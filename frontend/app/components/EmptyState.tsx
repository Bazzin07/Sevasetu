'use client';
import Link from 'next/link';

interface Props {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: 'search' | 'inbox' | 'users' | 'clipboard';
}

/* Minimal SVG illustrations — no emoji */
const ICONS = {
  inbox: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  search: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  users: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clipboard: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
};

export default function EmptyState({ message, ctaLabel, ctaHref, icon = 'inbox' }: Props) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-16) var(--space-6)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--slate-50)',
      border: '1px solid var(--slate-100)',
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-xl)',
        background: '#fff', border: '1px solid var(--slate-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto var(--space-5)',
        color: 'var(--slate-300)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {ICONS[icon]}
      </div>

      <p style={{
        fontSize: 15, fontWeight: 500, color: 'var(--slate-500)',
        margin: '0 0 var(--space-5)', lineHeight: 1.6,
        maxWidth: 320, marginLeft: 'auto', marginRight: 'auto',
      }}>
        {message}
      </p>

      {ctaLabel && ctaHref && (
        <Link href={ctaHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, #059669, #10B981)',
          color: '#fff',
          padding: '10px 22px', borderRadius: 'var(--radius-md)',
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
          boxShadow: 'var(--shadow-emerald)',
          transition: 'opacity var(--transition-fast)',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
