"""
SevaSetu — Need Routes
CRUD endpoints for community need management.
"""

import hashlib
from uuid import UUID
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.db_models import Need
from app.models.schemas import (
    NeedCreate,
    NeedResponse,
    NeedListResponse,
    NeedStatusUpdate,
)

router = APIRouter()


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()


@router.post("/needs", response_model=NeedResponse, status_code=201)
async def create_need(data: NeedCreate, db: AsyncSession = Depends(get_db)):
    """Create a new community need report. Rejects exact duplicate descriptions (Tier-1 dedup)."""
    from datetime import datetime, timedelta
    from app.config import get_settings as _get_settings
    _settings = _get_settings()

    # Sanitize: strip control characters that PostgreSQL (UTF8) cannot store.
    # Keeps: \t (0x09), \n (0x0A), \r (0x0D) — strips: 0x00–0x08, 0x0B–0x0C, 0x0E–0x1F
    _CTRL_CHARS = "".join(chr(i) for i in range(0, 32) if i not in (9, 10, 13))
    _CTRL_TABLE = str.maketrans("", "", _CTRL_CHARS)

    def _strip_controls(s: str) -> str:
        return s.translate(_CTRL_TABLE) if s else s

    safe_title = _strip_controls(data.title)
    safe_description = _strip_controls(data.description)

    content_hash = _content_hash(safe_description)
    cutoff = datetime.utcnow() - timedelta(days=_settings.DEDUP_WINDOW_DAYS)

    # Tier-1: reject exact duplicate description
    existing_q = await db.execute(
        select(Need).where(
            and_(Need.content_hash == content_hash, Need.created_at >= cutoff)
        )
    )
    existing = existing_q.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Duplicate need report detected (exact match). Original id: {existing.id}",
        )

    need = Need(
        title=safe_title,
        description=safe_description,

        need_type=data.need_type,
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        urgency_base=data.urgency_base,
        urgency_current=data.urgency_base,
        affected_count=data.affected_count,
        required_skills=data.required_skills or [],
        status="new",
        source_channel=data.source_channel or "dashboard",
        reported_by=data.reported_by,
        language=data.language,
        media_urls=data.media_urls or [],
        content_hash=content_hash,
    )
    db.add(need)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Duplicate need report detected (concurrent submission). "
                   "An identical need was already registered.",
        )
    await db.refresh(need)
    return need




@router.get("/needs", response_model=NeedListResponse)
async def list_needs(
    need_type: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List needs with filtering, search, and pagination."""
    query = select(Need)
    count_query = select(func.count(Need.id))
    filters = []

    if need_type:
        filters.append(Need.need_type == need_type.upper())
    if status:
        filters.append(Need.status == status)
    if urgency:
        thresh_map = {"critical": 0.85, "high": 0.7, "moderate": 0.5, "low": 0.0}
        filters.append(Need.urgency_current >= thresh_map.get(urgency.lower(), 0.5))
    if search:
        pattern = f"%{search}%"
        filters.append(or_(Need.title.ilike(pattern), Need.description.ilike(pattern)))

    if filters:
        combined = and_(*filters)
        query = query.where(combined)
        count_query = count_query.where(combined)

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(Need.urgency_current.desc(), Need.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    needs = result.scalars().all()

    return NeedListResponse(
        needs=[NeedResponse.model_validate(n) for n in needs],
        total=total, page=page, page_size=page_size,
        has_more=(offset + page_size) < total,
    )


@router.get("/needs/stats/summary")
async def need_stats(db: AsyncSession = Depends(get_db)):
    """Quick stats for needs overview."""
    total = (await db.execute(select(func.count(Need.id)))).scalar() or 0
    active = (await db.execute(
        select(func.count(Need.id)).where(Need.status.in_(["new", "matched", "assigned", "in_progress"]))
    )).scalar() or 0
    critical = (await db.execute(
        select(func.count(Need.id)).where(and_(Need.urgency_current >= 0.85, Need.status != "completed"))
    )).scalar() or 0

    type_q = await db.execute(
        select(Need.need_type, func.count(Need.id)).where(Need.need_type.isnot(None)).group_by(Need.need_type)
    )
    status_q = await db.execute(select(Need.status, func.count(Need.id)).group_by(Need.status))

    return {
        "total": total, "active": active, "critical": critical,
        "by_type": {r[0]: r[1] for r in type_q.all()},
        "by_status": {r[0]: r[1] for r in status_q.all()},
    }


@router.get("/needs/{need_id}", response_model=NeedResponse)
async def get_need(need_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single need by ID."""
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    return need


@router.patch("/needs/{need_id}/status", response_model=NeedResponse)
async def update_need_status(need_id: UUID, data: NeedStatusUpdate, db: AsyncSession = Depends(get_db)):
    """Update the status of a need."""
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")

    need.status = data.status
    if data.status == "matched" and not need.matched_at:
        need.matched_at = datetime.utcnow()
    elif data.status == "completed" and not need.resolved_at:
        need.resolved_at = datetime.utcnow()

    await db.flush()
    await db.refresh(need)
    return need


@router.delete("/needs/{need_id}", status_code=204)
async def delete_need(need_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a need."""
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    await db.delete(need)
    await db.flush()


@router.get("/needs/{need_id}/responders")
async def get_need_responders(need_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get dynamic list of nearby volunteers, hospitals, and police relative to a need's coordinates with full AI match scores."""
    from app.services.responder_service import responder_service
    from app.models.db_models import Volunteer
    from app.services.matching_engine import matching_engine
    from app.services.weight_calibrator import weight_calibrator
    
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
        
    if not need.latitude or not need.longitude:
        return {
            "disaster_coords": None,
            "volunteers": [],
            "facilities": []
        }
        
    # Discover available volunteers (15km radius) from DB
    deg_offset = 15.0 / 111.0
    v_query = select(Volunteer).where(
        and_(
            Volunteer.latitude.between(need.latitude - deg_offset, need.latitude + deg_offset),
            Volunteer.longitude.between(need.longitude - deg_offset, need.longitude + deg_offset),
            Volunteer.status == "available",
        )
    )
    v_result = await db.execute(v_query)
    db_volunteers = v_result.scalars().all()
    
    # Calculate active weights for this need type
    active_weights = await weight_calibrator.get_weights(
        need_type=need.need_type or "UNKNOWN",
        urgency=need.urgency_current or need.urgency_base or 0.5,
        affected_count=need.affected_count or 0,
        disaster_mode=False,
    )
    
    volunteers_list = []
    for v in db_volunteers:
        # Compute exact same 5-signal matching scores
        breakdown = await matching_engine._score_volunteer(need, v)
        total = sum(
            breakdown[signal] * active_weights.get(signal, 0)
            for signal in active_weights
        )
        reliability_mult = 0.75 + (v.reliability * 0.25)
        total *= reliability_mult
        
        volunteers_list.append({
            "id": str(v.id),
            "name": v.name,
            "phone": v.phone,
            "latitude": v.latitude,
            "longitude": v.longitude,
            "skills": v.skills or [],
            "type": "volunteer",
            "has_vehicle": v.has_vehicle,
            "vehicle_type": v.vehicle_type,
            "experience": v.experience_text,
            "reliability": v.reliability,
            "match_score": round(total, 3),
            "score_breakdown": {
                "skill_embedding": round(breakdown["skill_embedding"], 3),
                "skill_tags": round(breakdown["skill_tags"], 3),
                "geo_proximity": round(breakdown["geo_proximity"], 3),
                "urgency": round(breakdown["urgency"], 3),
                "availability": round(breakdown["availability"], 3),
                "reliability": round(v.reliability, 3),
                "total": round(total, 3),
                "weights_used": active_weights,
            }
        })
    # Sort volunteers by match score descending
    volunteers_list.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Discover available facilities (10km radius)
    facilities = await responder_service.get_nearby_places(need.latitude, need.longitude, radius_meters=10000)
    
    return {
        "disaster_coords": {"latitude": need.latitude, "longitude": need.longitude},
        "volunteers": volunteers_list,
        "facilities": facilities
    }


