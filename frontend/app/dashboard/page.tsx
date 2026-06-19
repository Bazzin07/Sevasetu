'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import HeatMap from '@/app/components/HeatMap';
import ChatPanel from '@/app/components/ChatPanel';
import { formatNeedType, timeAgo, urgencyColor, formatPercent } from '@/lib/utils';
import {
  fetchDashboardStats, fetchHeatmap, fetchDeserts, fetchVolunteerLocations, fetchActivity,
  fetchDisasterCheck, fetchRegionalBriefing,
  DashboardStats, HeatmapPoint, DesertZone, VolunteerLocation, ActivityItem,
  DisasterCheckResponse,
} from '@/lib/api';

// Recharts for analytics
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'];

function StatPill({ v, l, c }: { v: number | string; l: string; c?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', padding: '16px 20px', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', flex: 1,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: c || '#1C1917', fontFamily: 'var(--font-heading)' }}>{v}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
    </div>
  );
}

// ─── Regional Briefing Modal ─────────────────────────────────
interface BriefingData {
  priority_alerts?: Array<{ region: string; issue: string; action: string; urgency: string }>;
  skill_gap_alerts?: Array<{ skill: string; demand: number; supply: number; recommendation: string }>;
  trend_observations?: string[];
  coordinator_actions?: string[];
  predicted_escalations?: string[];
  source?: string;
  generated_at?: string;
  corpus_snapshot?: { total_active: number; critical: number; regions_analyzed: number };
}

function BriefingModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchRegionalBriefing()
      .then(r => setData(r as unknown as BriefingData))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const urgencyColor = (u: string) => u === 'critical' ? '#DC2626' : u === 'high' ? '#D97706' : '#059669';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ background: '#fff', borderRadius: 24, padding: 36, maxWidth: 700, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              AI Regional Briefing
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              {data?.source === 'rule-based fallback' ? 'Rule-based analysis' : 'Gemini Pro analysis'} · {data?.corpus_snapshot?.total_active ?? '…'} active needs · {data?.corpus_snapshot?.regions_analyzed ?? '…'} regions
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid var(--slate-100)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid transparent', borderTopColor: '#059669', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#34D399', animation: 'spin 1.1s linear infinite reverse' }} />
            </div>
            <p style={{ color: 'var(--slate-400)', fontSize: 13, margin: 0 }}>Generating AI briefing…</p>
          </div>
        ) : err ? (
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 20, color: '#DC2626' }}>⚠️ {err}</div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Priority Alerts */}
            {(data.priority_alerts?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Priority Alerts</h3>
                {data.priority_alerts!.map((a, i) => (
                  <div key={i} style={{ background: '#FEF2F2', border: `1px solid ${urgencyColor(a.urgency)}33`, borderLeft: `3px solid ${urgencyColor(a.urgency)}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>{a.region} — {a.issue}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>→ {a.action}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Skill Gaps */}
            {(data.skill_gap_alerts?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Skill Gap Alerts</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {data.skill_gap_alerts!.map((g, i) => (
                    <div key={i} style={{ background: '#FFF7ED', borderRadius: 10, padding: '10px 14px', border: '1px solid #FED7AA' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{g.skill.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>Demand {g.demand} · Supply {g.supply}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {(data.trend_observations?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trend Observations</h3>
                {data.trend_observations!.map((t, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#374151', padding: '6px 0', borderBottom: i < data.trend_observations!.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    · {t}
                  </div>
                ))}
              </div>
            )}

            {/* Coordinator Actions */}
            {(data.coordinator_actions?.length ?? 0) > 0 && (
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '16px 20px', border: '1px solid #86EFAC' }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coordinator Actions</h3>
                {data.coordinator_actions!.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#166534', padding: '4px 0' }}>→ {a}</div>
                ))}
              </div>
            )}

          </div>
        ) : null}

      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  // Data state
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [heatmap, setHeatmap]           = useState<HeatmapPoint[]>([]);
  const [deserts, setDeserts]           = useState<DesertZone[]>([]);
  const [volLocations, setVolLocations] = useState<VolunteerLocation[]>([]);
  const [activity, setActivity]         = useState<ActivityItem[]>([]);
  const [disaster, setDisaster]         = useState<DisasterCheckResponse | null>(null);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  // UI state
  const [showVol, setShowVol]           = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<HeatmapPoint | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [disasterDismissed, setDisasterDismissed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, h, d, v, a, dis] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchHeatmap(),
        fetchDeserts(),
        fetchVolunteerLocations(),
        fetchActivity(20),
        fetchDisasterCheck(),
      ]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (h.status === 'fulfilled') setHeatmap(h.value);
      if (d.status === 'fulfilled') setDeserts(d.value);
      if (v.status === 'fulfilled') setVolLocations(v.value);
      if (a.status === 'fulfilled') setActivity(a.value);
      if (dis.status === 'fulfilled') setDisaster(dis.value);
      setLastUpdated(new Date());
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadAll();
    timerRef.current = setInterval(loadAll, 30_000); // refresh every 30s
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadAll]);

  const categoryData = stats
    ? Object.entries(stats.needs_by_type)
        .map(([name, value]) => ({ name: formatNeedType(name), value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const disasterActive = disaster?.disaster_active && !disasterDismissed;

  return (
    <div style={{ position: 'relative', width: '100vw', height: `calc(100vh - 56px${disasterActive ? ' - 48px' : ''})`, overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ─── Disaster Banner ─────────────────────────────── */}
      <AnimatePresence>
        {disasterActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 48, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 14, fontWeight: 700, position: 'relative', zIndex: 200, overflow: 'hidden' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.9, animation: 'pulse-dot 1s ease-in-out infinite', display: 'inline-block' }} />
            DISASTER MODE ACTIVE
            {disaster?.active_zones?.length > 0 && (
              <span style={{ fontWeight: 400, opacity: 0.9 }}>— Zones: {disaster.active_zones.join(', ')}</span>
            )}
            <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 12 }}>
              · {disaster?.critical_needs_count ?? '?'} critical needs
            </span>
            <button onClick={() => setDisasterDismissed(true)} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Map */}
      <HeatMap
        points={heatmap}
        deserts={deserts}
        volunteerLocations={volLocations}
        showVolunteers={showVol}
        onHotspotClick={setSelectedHotspot}
      />

      {/* Loading overlay — branded dual-ring */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50, background: 'rgba(248,250,252,0.82)', backdropFilter: 'blur(8px)', gap: 20 }}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid var(--slate-100)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid transparent', borderTopColor: '#059669', animation: 'spin 0.75s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 9, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#34D399', animation: 'spin 1.1s linear infinite reverse' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 4 }}>Loading live data</div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>Fetching from all services…</div>
          </div>
        </div>
      )}

      {/* ─── Top Floating Header & Stats ─────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ position: 'absolute', top: 24, left: 24, right: 384 + 48, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', padding: '16px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: '#1C1917' }}>Command Center</h1>
            <p style={{ fontSize: 13, color: '#57534E', margin: 0, fontWeight: 500 }}>
              Live Humanitarian Coordination
              {lastUpdated && <span style={{ marginLeft: 8, color: '#94A3B8' }}>· Updated {timeAgo(lastUpdated.toISOString())}</span>}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, pointerEvents: 'auto' }}>
            <label style={{
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', padding: '10px 16px', borderRadius: 12,
              fontSize: 13, fontWeight: 600, color: '#1C1917', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            }}>
              <input type="checkbox" checked={showVol} onChange={e => setShowVol(e.target.checked)} style={{ accentColor: '#059669', width: 16, height: 16 }} />
              Volunteers
            </label>
            <button onClick={() => setShowBriefing(true)} style={{
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', color: '#059669', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 12,
              padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Briefing
            </button>
            <button onClick={() => setChatOpen(true)} style={{
              background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Ask SevaBot
            </button>
          </div>
        </div>

        {/* KPI pills */}
        <div style={{ display: 'flex', gap: 16, pointerEvents: 'auto' }}>
          {loading || !stats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ flex: 1, height: 72, borderRadius: 16, opacity: 0.7 }} />
            ))
          ) : (
            <>
              <StatPill v={stats.total_needs}      l="Total Needs" />
              <StatPill v={stats.active_needs}     l="Active Needs" />
              <StatPill v={stats.critical_needs}   l="Critical Now" c="#DC2626" />
              <StatPill v={stats.matched_needs}    l="Matched" />
              <StatPill v={stats.active_volunteers} l="Volunteers Active" />
            </>
          )}
        </div>
      </motion.div>

      {/* ─── Right Floating Panel ─────────────────────────── */}
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
        style={{
          position: 'absolute', top: 24, right: 24, bottom: 24, width: 384,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', zIndex: 10,
        }}>

        {/* Pie chart */}
        <div style={{ padding: '20px 20px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, margin: '0 0 12px', color: '#1C1917' }}>Needs by Category</h2>
          {loading || categoryData.length === 0 ? (
            <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
          ) : (
            <>
              <div style={{ position: 'relative', height: 180, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600, padding: '8px 14px' }}
                      formatter={(val, name) => [`${Number(val ?? 0)} needs`, String(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                    {categoryData.reduce((s, d) => s + d.value, 0)}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {categoryData.map((entry, i) => {
                  const total = categoryData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#475569', flex: 1, fontWeight: 500 }}>{entry.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1C1917' }}>{entry.value}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', width: 32, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Activity feed */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1C1917' }}>Live Activity</h2>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
            {loading || activity.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48, marginBottom: 12, borderRadius: 10 }} />
              ))
            ) : (
              activity.map((item, i) => {
                const dotColor = item.type === 'disaster_alert' ? '#DC2626' : item.type === 'assignment_completed' ? '#059669' : item.type === 'volunteer_matched' ? '#7C3AED' : '#64748B';
                return (
                  <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1C1917', lineHeight: 1.45 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{timeAgo(item.timestamp)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Hotspot Detail Drawer ────────────────────────── */}
      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'absolute', bottom: 24, left: 24, right: 384 + 48,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(24px)',
              borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)', zIndex: 20, padding: 24,
              display: 'flex', gap: 24,
            }}>
            <button onClick={() => setSelectedHotspot(null)} style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: urgencyColor(selectedHotspot.urgency ?? 0.5), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {formatNeedType(selectedHotspot.need_type)}
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#1C1917' }}>
                {selectedHotspot.title}
              </h2>
              <p style={{ fontSize: 14, color: '#57534E', margin: '0 0 20px', lineHeight: 1.5, maxWidth: 500 }}>
                {selectedHotspot.description}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1917' }}>{selectedHotspot.affected_count || 'N/A'}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>Affected</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1917' }}>{formatPercent(selectedHotspot.urgency)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>Urgency</div>
                </div>
                <button onClick={() => router.push(`/needs/${selectedHotspot.need_id}`)} style={{
                  background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', border: 'none', borderRadius: 12, padding: '0 24px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto',
                  boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
                }}>
                  Find Matches →
                </button>
              </div>
            </div>

            <div style={{ width: 240, borderLeft: '1px solid #E2E8F0', paddingLeft: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1917', marginBottom: 16 }}>Resource Gap (Radius: 20km)</div>
              <div style={{ height: 100, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Req.', count: 45 },
                    { name: 'Avail.', count: 12 },
                  ]} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#78716C' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Regional Briefing Modal ─────────────────────── */}
      <AnimatePresence>
        {showBriefing && <BriefingModal onClose={() => setShowBriefing(false)} />}
      </AnimatePresence>

      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />


    </div>
  );
}
