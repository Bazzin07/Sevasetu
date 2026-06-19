'use client';
import Link from 'next/link';
import { VolunteerResponse } from '@/lib/api';
import { initialsFromName } from '@/lib/utils';

interface Props { volunteer: VolunteerResponse; }

const AVATAR_COLORS = [
  ['#059669', '#34D399'], // emerald
  ['#2563EB', '#60A5FA'], // blue
  ['#7C3AED', '#A78BFA'], // violet
  ['#D97706', '#FCD34D'], // amber
  ['#0E7490', '#22D3EE'], // cyan
];

function avatarColors(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* Status pill — no emoji, just a tiny dot + text */
const STATUS_CONFIG: Record<string, { dot: string; label: string; textColor: string }> = {
  available:     { dot: '#22C55E', label: 'Available',     textColor: '#166534' },
  on_assignment: { dot: '#F59E0B', label: 'On Assignment',  textColor: '#92400E' },
  inactive:      { dot: '#94A3B8', label: 'Inactive',       textColor: '#64748B' },
};

export default function VolunteerCard({ volunteer }: Props) {
  const rel       = volunteer.reliability ?? 0;
  const relColor  = rel >= 0.8 ? '#059669' : rel >= 0.5 ? '#D97706' : '#DC2626';
  const [c1, c2]  = avatarColors(volunteer.name ?? 'A');
  const statusKey = volunteer.status ?? 'inactive';
  const status    = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.inactive;

  return (
    <Link href={`/volunteers/${volunteer.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          border: '1px solid var(--slate-100)',
          boxShadow: 'var(--shadow-xs)',
          transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
          cursor: 'pointer',
          willChange: 'transform',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(5,150,105,0.09), 0 2px 8px rgba(0,0,0,0.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
        }}
      >
        {/* Header — avatar + name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
            letterSpacing: '0.02em',
          }}>
            {initialsFromName(volunteer.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--slate-900)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {volunteer.name}
            </div>
            {/* Status pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: status.textColor, letterSpacing: '0.02em' }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Vehicle icon — SVG instead of emoji */}
          {volunteer.has_vehicle && (
            <div title={`Has ${volunteer.vehicle_type ?? 'vehicle'}`} style={{ color: 'var(--slate-400)', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
          )}
        </div>

        {/* Skills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {(volunteer.skills ?? []).slice(0, 4).map(s => (
            <span key={s} style={{
              fontSize: 11, padding: '2px 9px', borderRadius: 'var(--radius-full)',
              background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 500,
            }}>
              {s.replace(/_/g, ' ')}
            </span>
          ))}
          {volunteer.skills.length > 4 && (
            <span style={{ fontSize: 11, color: 'var(--slate-400)', alignSelf: 'center' }}>
              +{volunteer.skills.length - 4}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid var(--slate-100)', paddingTop: 10,
          fontSize: 12, color: 'var(--slate-500)',
        }}>
          <span>
            Reliability{' '}
            <span style={{ fontWeight: 700, color: relColor }}>{Math.round(rel * 100)}%</span>
          </span>
          <span style={{ color: 'var(--slate-400)' }}>{volunteer.completed_tasks}/{volunteer.total_tasks} tasks</span>
        </div>
      </div>
    </Link>
  );
}
