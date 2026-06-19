'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { fetchVolunteer, fetchVolunteerImpact, fetchAssignments, VolunteerResponse, ImpactResponse, AssignmentResponse } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

const STATUS_META: Record<string, { bg: string; color: string; icon: string }> = {
  available:     { bg: '#F0FDF4', color: '#059669', icon: '🟢' },
  on_assignment: { bg: '#EFF6FF', color: '#2563EB', icon: '🔵' },
  inactive:      { bg: '#F1F5F9', color: '#64748B', icon: '⚫' },
};

const ASSIGN_STATUS: Record<string, { bg: string; color: string; icon: string }> = {
  pending:   { bg: '#FEF3C7', color: '#D97706', icon: '⏳' },
  active:    { bg: '#EFF6FF', color: '#2563EB', icon: '🔄' },
  completed: { bg: '#F0FDF4', color: '#059669', icon: '✅' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626', icon: '❌' },
};

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 14, opacity: i <= Math.round(value) ? 1 : 0.25 }}>⭐</span>
      ))}
      <span style={{ fontSize: 12, color: '#64748B', marginLeft: 6, alignSelf: 'center' }}>{value.toFixed(1)}</span>
    </div>
  );
}

/** Read the real UUID from /volunteers/<uuid> in the browser URL. Never returns '_'. */
function useRealId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last !== '_' && last !== 'register') setId(last);
  }, []);
  return id;
}

interface Props {
  /** Provided by the server page in SSR/dev mode. Undefined in static export mode. */
  initialId?: string;
}

export default function VolunteerDetailClient({ initialId }: Props = {}) {
  const pathnameId = useRealId();
  const id = initialId ?? pathnameId;
  const { t } = useLanguage();

  const [vol, setVol]           = useState<VolunteerResponse | null>(null);
  const [impact, setImpact]     = useState<ImpactResponse | null>(null);
  const [assignments, setAssign] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; // wait for real id from pathname
    Promise.allSettled([
      fetchVolunteer(id),
      fetchVolunteerImpact(id),
      fetchAssignments({ volunteer_id: id }),
    ]).then(([v, i, a]) => {
      if (v.status === 'fulfilled') setVol(v.value);
      else setError(v.reason?.message ?? 'Volunteer not found');
      if (i.status === 'fulfilled') setImpact(i.value);
      if (a.status === 'fulfilled') setAssign(a.value);
    }).finally(() => setLoading(false));
  }, [id]);

  if (!id || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !vol) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: '#64748B', marginBottom: 24 }}>{error || 'Volunteer not found.'}</p>
      <Link href="/volunteers" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>← Back to Volunteers</Link>
    </div>
  );

  const meta = STATUS_META[vol.status] ?? STATUS_META.inactive;

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(180deg,#F8FAFC 0%,#fff 120px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/volunteers" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, fontWeight: 500 }}>
          ← {t('volunteers')}
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

          {/* Left — Main Profile */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

              {/* Profile card */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#059669,#10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                    {vol.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0 }}>{vol.name}</h1>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: meta.bg, color: meta.color, textTransform: 'uppercase' }}>
                        {meta.icon} {vol.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748B' }}>
                      {vol.phone && <span>📞 {vol.phone}</span>}
                      {vol.latitude && vol.longitude && <span>📍 {vol.latitude.toFixed(3)}, {vol.longitude.toFixed(3)}</span>}
                      {vol.has_vehicle && <span>🚗 {vol.vehicle_type || 'Has vehicle'}</span>}
                      <span>🕒 Joined {timeAgo(vol.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {vol.skills.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {vol.skills.map(s => (
                        <span key={s} style={{ fontSize: 12, background: '#F0FDF4', color: '#059669', padding: '4px 12px', borderRadius: 999, fontWeight: 600, border: '1px solid #BBF7D0' }}>{s.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {vol.languages.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Languages</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {vol.languages.map(l => (
                        <span key={l} style={{ fontSize: 12, background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: 999, fontWeight: 600 }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {vol.experience_text && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Experience</div>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', border: '1px solid #F1F5F9' }}>
                      {vol.experience_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment History */}
              {assignments.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: '#1C1917', margin: '0 0 16px' }}>
                    📋 Assignment History ({assignments.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {assignments.map(a => {
                      const am = ASSIGN_STATUS[a.status] ?? ASSIGN_STATUS.pending;
                      return (
                        <div key={a.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                          <span style={{ fontSize: 20 }}>{am.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1917' }}>
                              Need: <Link href={`/needs/${a.need_id}`} style={{ color: '#059669', textDecoration: 'none' }}>{a.need_id.slice(0, 8)}…</Link>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              {a.match_score != null && <>{Math.round(a.match_score * 100)}% match · </>}
                              {timeAgo(a.proposed_at)}
                              {a.rating != null && <> · Rating: {a.rating}/5</>}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: am.bg, color: am.color, textTransform: 'uppercase', flexShrink: 0 }}>
                            {a.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right — Impact Stats */}
          <div style={{ position: 'sticky', top: 80 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>

              {/* Impact card */}
              {impact && (
                <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 700, color: '#1C1917', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Impact Stats
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Assignments', val: impact.total_assignments, color: '#1C1917' },
                      { label: 'Completed', val: impact.completed_assignments, color: '#059669' },
                      { label: 'Completion Rate', val: `${Math.round(impact.completion_rate * 100)}%`, color: impact.completion_rate >= 0.8 ? '#059669' : '#D97706' },
                      { label: 'Reliability', val: `${Math.round(impact.reliability * 100)}%`, color: impact.reliability >= 0.8 ? '#059669' : '#D97706' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{val}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {impact.avg_rating != null && (
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Avg Rating</div>
                      <StarRating value={impact.avg_rating} />
                    </div>
                  )}
                </div>
              )}

              {/* Reliability bar */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reliability</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{Math.round(vol.reliability * 100)}%</span>
                </div>
                <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${vol.reliability * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,#059669,#10B981)', borderRadius: 999 }} />
                </div>
              </div>

              {/* Task summary */}
              <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '16px 20px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Summary</div>
                <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                  <div>📋 {vol.total_tasks} total tasks</div>
                  <div>✅ {vol.completed_tasks} completed</div>
                  <div>🗓️ Joined {timeAgo(vol.created_at)}</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
