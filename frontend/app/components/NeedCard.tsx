'use client';
import Link from 'next/link';
import { NeedResponse } from '@/lib/api';
import { formatNeedType, urgencyLabel, urgencyColor, timeAgo } from '@/lib/utils';

interface Props { need: NeedResponse; }

/* ── Type dot colors (no emoji) ── */
const TYPE_COLOR: Record<string, string> = {
  HEALTHCARE:       '#0EA5E9',
  EDUCATION:        '#8B5CF6',
  WATER_SANITATION: '#06B6D4',
  SHELTER:          '#F97316',
  FOOD:             '#16A34A',
  INFRASTRUCTURE:   '#64748B',
  LIVELIHOOD:       '#D97706',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:         { bg: '#EFF6FF', text: '#3B82F6' },
  matched:     { bg: '#F0FDF4', text: '#16A34A' },
  assigned:    { bg: '#FFF7ED', text: '#EA580C' },
  in_progress: { bg: '#FEF3C7', text: '#D97706' },
  completed:   { bg: '#F0FDF4', text: '#059669' },
};

export default function NeedCard({ need }: Props) {
  const urg       = need.urgency_current ?? need.urgency_base ?? 0;
  const urgColor  = urgencyColor(urg);
  const typeColor = TYPE_COLOR[need.need_type ?? ''] ?? '#94A3B8';
  const statusStyle = STATUS_COLORS[need.status ?? 'new'] ?? STATUS_COLORS.new;

  return (
    <Link href={`/needs/${need.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--slate-100)',
          transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
          cursor: 'pointer',
          willChange: 'transform',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* Urgency accent bar */}
        <div style={{ height: 3, background: urgColor, opacity: 0.85, flexShrink: 0 }} />

        <div style={{ padding: '18px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Type + Urgency row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* Type dot */}
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {formatNeedType(need.need_type)}
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)',
              background: urgColor + '14', color: urgColor, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {urgencyLabel(urg)}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)',
            margin: '0 0 7px', lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {need.title}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: 13, color: 'var(--slate-500)', lineHeight: 1.6,
            margin: '0 0 14px', flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {need.description}
          </p>

          {/* Affected + skills */}
          {(need.affected_count || (need.required_skills && need.required_skills.length > 0)) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {need.affected_count && (
                <span style={{
                  fontSize: 11, background: 'var(--slate-50)', border: '1px solid var(--slate-200)',
                  color: 'var(--slate-600)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600,
                }}>
                  {need.affected_count.toLocaleString()} affected
                </span>
              )}
              {need.required_skills?.slice(0, 2).map(s => (
                <span key={s} style={{
                  fontSize: 11, background: 'var(--emerald-50)', color: 'var(--emerald-700)',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600,
                }}>
                  {s.replace(/_/g, ' ')}
                </span>
              ))}
              {(need.required_skills?.length ?? 0) > 2 && (
                <span style={{ fontSize: 11, color: 'var(--slate-400)', alignSelf: 'center' }}>
                  +{(need.required_skills?.length ?? 0) - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--slate-100)' }}>
            <span style={{
              background: statusStyle.bg, color: statusStyle.text,
              padding: '3px 10px', borderRadius: 'var(--radius-full)',
              fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em',
            }}>
              {need.status?.replace(/_/g, ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--slate-400)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{need.location_name?.split(',')[0] || '—'}</span>
              <span style={{ color: 'var(--slate-300)' }}>·</span>
              <span>{timeAgo(need.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
