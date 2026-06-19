/**
 * Shared skeleton / loading primitives used across SevaSetu pages.
 * All use the .skeleton CSS class from globals.css (shimmer animation).
 */

/* ─── Generic block skeleton ─────────────────────────────────── */
export function SkeletonBlock({ width = '100%', height = 16, radius = 8, style = {} }: {
  width?: string | number; height?: number; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
  );
}

/* ─── Card skeleton — mirrors NeedCard / VolunteerCard layout ── */
export function CardSkeleton({ type = 'need' }: { type?: 'need' | 'volunteer' }) {
  if (type === 'volunteer') {
    return (
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--slate-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[70, 60, 80].map((w, i) => <div key={i} className="skeleton" style={{ height: 22, width: w, borderRadius: 99 }} />)}
        </div>
        <div className="skeleton" style={{ height: 1, marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: '25%', borderRadius: 6 }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--slate-100)' }}>
      <div className="skeleton" style={{ height: 3 }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 99 }} />
        </div>
        <div className="skeleton" style={{ height: 16, width: '85%', borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 12, width: '95%', borderRadius: 6, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 12, width: '75%', borderRadius: 6, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[55, 68, 72].map((w, i) => <div key={i} className="skeleton" style={{ height: 22, width: w, borderRadius: 99 }} />)}
        </div>
      </div>
    </div>
  );
}

/* ─── Grid of card skeletons ─────────────────────────────────── */
export function CardGridSkeleton({ count = 6, type = 'need' }: { count?: number; type?: 'need' | 'volunteer' }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 20,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} type={type} />
      ))}
    </div>
  );
}

/* ─── Pulse dots (3-dot loading indicator) ───────────────────── */
export function PulseDots({ color = '#059669' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%', background: color,
          animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── Full-page loader with branded mark ─────────────────────── */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px', gap: 20,
    }}>
      {/* Animated ring */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2.5px solid var(--slate-100)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2.5px solid transparent',
          borderTopColor: '#059669',
          animation: 'spin 0.75s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#10B981',
          animation: 'spin 1.2s linear infinite reverse',
        }} />
      </div>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
        color: 'var(--slate-400)', margin: 0, letterSpacing: '0.02em',
      }}>
        {label}
      </p>
    </div>
  );
}
