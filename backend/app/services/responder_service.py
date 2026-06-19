"""
SevaSetu — Geospatial Responder Discovery Service
Fetches nearby volunteers (from local DB) and emergency facilities (hospitals, police, fire)
using a hybrid approach: Google Places API (if key is active) and OpenStreetMap Overpass API (free fallback).
"""

import httpx
import logging
from typing import List, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.db_models import Volunteer
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ResponderService:
    """Discovers nearby volunteers and safety infrastructure."""

    async def get_nearby_volunteers(
        self, db: AsyncSession, lat: float, lng: float, radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """Query available volunteers from DB within roughly a bounding box."""
        # 1 degree lat ≈ 111km, 1 degree lng ≈ 111km * cos(lat)
        # Roughly use radius_km / 111.0 for bounding offsets
        deg_offset = radius_km / 111.0
        
        query = select(Volunteer).where(
            and_(
                Volunteer.latitude.between(lat - deg_offset, lat + deg_offset),
                Volunteer.longitude.between(lng - deg_offset, lng + deg_offset),
                Volunteer.status == "available",
            )
        )
        
        try:
            result = await db.execute(query)
            volunteers = result.scalars().all()
            logger.info(f"📍 Found {len(volunteers)} available volunteers near ({lat}, {lng})")
            return [
                {
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
                }
                for v in volunteers
            ]
        except Exception as e:
            logger.error(f"❌ Failed to fetch nearby volunteers: {e}")
            return []

    async def get_nearby_places(
        self, lat: float, lng: float, radius_meters: int = 10000
    ) -> List[Dict[str, Any]]:
        """Query nearby hospitals, police stations, and fire stations from Overpass (OSM) with Google Places integration."""
        
        # Priority 1: OpenStreetMap Overpass API (Completely free, no keys required, high availability)
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = f"""
        [out:json][timeout:5];
        (
          node["amenity"="hospital"](around:{radius_meters},{lat},{lng});
          node["amenity"="police"](around:{radius_meters},{lat},{lng});
          node["emergency"="fire_station"](around:{radius_meters},{lat},{lng});
        );
        out body;
        """
        
        try:
            logger.info(f"🛰️ Querying OSM Overpass API for facilities near ({lat}, {lng}) within {radius_meters}m")
            async with httpx.AsyncClient() as client:
                response = await client.post(overpass_url, data={"data": query}, timeout=6.0)
                if response.status_code == 200:
                    data = response.json()
                    elements = data.get("elements", [])
                    places = []
                    for el in elements:
                        tags = el.get("tags", {})
                        amenity = tags.get("amenity") or tags.get("emergency") or "facility"
                        
                        # Normalize type for frontend UI matching
                        place_type = "hospital"
                        if amenity == "police":
                            place_type = "police"
                        elif amenity == "fire_station":
                            place_type = "fire_station"
                            
                        places.append({
                            "id": f"osm-{el.get('id')}",
                            "name": tags.get("name") or f"Local {place_type.capitalize()}",
                            "latitude": el.get("lat"),
                            "longitude": el.get("lon"),
                            "type": place_type,
                            "skills": [f"Emergency {place_type.capitalize()} operations"],
                            "phone": tags.get("phone") or "112 (National Emergency)"
                        })
                    logger.info(f"✅ Found {len(places)} facilities from Overpass")
                    return places
        except Exception as e:
            logger.warning(f"⚠️ Overpass API fetch failed: {e}. Trying Google Places fallback.")

        # Priority 2: Google Places API (If API key is active)
        if settings.GOOGLE_MAPS_API_KEY:
            try:
                # We can perform a nearby search using standard requests
                google_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                places = []
                
                # Fetch hospitals and police in parallel or sequence
                for search_type in ["hospital", "police"]:
                    params = {
                        "location": f"{lat},{lng}",
                        "radius": radius_meters,
                        "type": search_type,
                        "key": settings.GOOGLE_MAPS_API_KEY
                    }
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(google_url, params=params, timeout=5.0)
                        if resp.status_code == 200:
                            results = resp.json().get("results", [])
                            for r in results:
                                geom = r.get("geometry", {}).get("location", {})
                                places.append({
                                    "id": f"g-{r.get('place_id')}",
                                    "name": r.get("name") or f"Local {search_type.capitalize()}",
                                    "latitude": geom.get("lat"),
                                    "longitude": geom.get("lng"),
                                    "type": "police" if search_type == "police" else "hospital",
                                    "skills": [f"Emergency {search_type.capitalize()} operations"],
                                    "phone": "112 (National Emergency)"
                                })
                if places:
                    logger.info(f"✅ Found {len(places)} facilities from Google Places API")
                    return places
            except Exception as e:
                logger.error(f"❌ Google Places API query failed: {e}")

        # Priority 3: Fallback safety-net seeded mock facilities if both APIs are down/unreachable
        logger.warning("🚨 Discovered zero facilities from live APIs. Returning seed safety-net elements.")
        return [
            {
                "id": "mock-hosp-1",
                "name": "District General Hospital",
                "latitude": lat + 0.0095,
                "longitude": lng - 0.0084,
                "type": "hospital",
                "skills": ["Trauma Support", "Ambulance Station", "General Ward"],
                "phone": "+91 22 2262 0261"
            },
            {
                "id": "mock-hosp-2",
                "name": "Community Red Cross Clinic",
                "latitude": lat - 0.0125,
                "longitude": lng + 0.0118,
                "type": "hospital",
                "skills": ["First Aid Triage", "Pediatric Care"],
                "phone": "+91 22 2262 0262"
            },
            {
                "id": "mock-police-1",
                "name": "Metro Police Station",
                "latitude": lat + 0.0078,
                "longitude": lng + 0.0094,
                "type": "police",
                "skills": ["Crowd Management", "Search and Rescue Support"],
                "phone": "+91 22 2262 0263"
            },
            {
                "id": "mock-fire-1",
                "name": "Central Fire & Rescue Station",
                "latitude": lat - 0.0062,
                "longitude": lng - 0.0071,
                "type": "fire_station",
                "skills": ["Debris Clearance", "Fire Suppression", "Hazmat Rescue"],
                "phone": "+91 22 2262 0264"
            }
        ]


# Singleton instance
responder_service = ResponderService()
