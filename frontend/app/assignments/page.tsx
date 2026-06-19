'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAssignments, updateAssignmentStatus, AssignmentResponse } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';

// ── Backend status lifecycle: proposed → accepted → in_progress → completed / declined ──
const STATUSES = ['proposed', 'accepted', 'in_progress', 'completed', 'declined'] as const;
type Status = typeof STATUSES[number];

const STATUS_META: Record<Status, { label: string; color: string; bg: string; icon: string }> = {
  proposed:    { label: 'Proposed',    color: '#D97706', bg: '#FEF3C7', icon: '⏳' },
  accepted:    { label: 'Accepted',    color: '#2563EB', bg: '#EFF6FF', icon: '✔️' },
  in_progress: { label: 'In Progress', color: '#7C3AED', bg: '#F5F3FF', icon: '🔄' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#F0FDF4', icon: '✅' },
  declined:    { label: 'Declined',    color: '#DC2626', bg: '#FEF2F2', icon: '❌' },
};

const TABS: Status[] = ['proposed', 'accepted', 'in_progress', 'completed'];

// What actions are available per status
const TRANSITIONS: Partial<Record<Status, { label: string; next: string; color: string; bg: string }[]>> = {
  proposed: [
    { label: 'Accept',  next: 'accepted',    color: '#fff', bg: 'linear-gradient(135deg,#2563EB,#3B82F6)' },
    { label: 'Decline', next: 'declined',    color: '#DC2626', bg: '#FEF2F2' },
  ],
  accepted: [
    { label: '▶ Start Work',   next: 'in_progress', color: '#fff', bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)' },
    { label: 'Cancel',         next: 'declined',    color: '#DC2626', bg: '#FEF2F2' },
  ],
  in_progress: [
    { label: '✓ Mark Complete', next: 'completed', color: '#fff', bg: 'linear-gradient(135deg,#059669,#10B981)' },
  ],
};

function AssignmentCard({ a, onUpdate }: { a: AssignmentResponse; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const status = (a.status ?? 'proposed') as Status;
  const meta = STATUS_META[status] ?? STATUS_META.proposed;
  const actions = TRANSITIONS[status] ?? [];

  async function update(nextStatus: string) {
    setLoading(true); setErr(null);
    try {
      await updateAssignmentStatus(a.id, nextStatus, nextStatus === 'completed' && rating > 0 ? rating : undefined);
      onUpdate();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally { setLoading(false); }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
      style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9', marginBottom: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{meta.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: meta.bg, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {meta.label}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1917', marginBottom: 2 }}>
            Need: <Link href={`/needs/${a.need_id}`} style={{ color: '#059669', textDecoration: 'none' }}>{a.need_id.slice(0, 8)}…</Link>
          </div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            Volunteer: <Link href={`/volunteers/${a.volunteer_id}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>{a.volunteer_id.slice(0, 8)}…</Link>
            {a.match_score != null && <> · Match <strong style={{ color: '#1C1917' }}>{Math.round(a.match_score * 100)}%</strong></>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'right', flexShrink: 0 }}>
          {timeAgo(a.proposed_at)}
          {a.accepted_at && <div style={{ marginTop: 2 }}>Accepted {timeAgo(a.accepted_at)}</div>}
        </div>
      </div>

      {/* Dispatch Brief */}
      {a.dispatch_brief && (
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#475569', fontStyle: 'italic', marginBottom: 12, borderLeft: '3px solid #059669', lineHeight: 1.5 }}>
          {a.dispatch_brief}
        </div>
      )}

      {/* Error */}
      {err && <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#DC2626', marginBottom: 10 }}>⚠️ {err}</div>}

      {/* Actions */}
      {actions.length > 0 && !showRating && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actions.map(act => (
            <button key={act.next} onClick={() => act.next === 'completed' ? setShowRating(true) : update(act.next)}
              disabled={loading}
              style={{ flex: 1, minWidth: 120, height: 38, background: act.bg, color: act.color, border: act.color === '#DC2626' ? '1px solid #FCA5A5' : 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 200ms' }}>
              {loading ? '…' : act.label}
            </button>
          ))}
        </div>
      )}

      {/* Star rating for completion */}
      {showRating && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#64748B', flexShrink: 0 }}>Rate volunteer:</span>
          {[1, 2, 3, 4, 5].map(r => (
            <button key={r} onClick={() => setRating(r)}
              style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${rating >= r ? '#F59E0B' : '#E2E8F0'}`, background: rating >= r ? '#FEF3C7' : '#fff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⭐
            </button>
          ))}
          <button onClick={() => update('completed')} disabled={loading}
            style={{ height: 38, padding: '0 18px', background: '#059669', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? '…' : 'Confirm'}
          </button>
          <button onClick={() => { setShowRating(false); setRating(0); }}
            style={{ height: 38, padding: '0 12px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function AssignmentsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Status>('proposed');
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load counts for all tabs in parallel for the badge numbers
  const loadCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      TABS.map(s => fetchAssignments({ status: s }).then(r => ({ s, n: r.length })))
    );
    const newCounts: Partial<Record<Status, number>> = {};
    results.forEach(r => { if (r.status === 'fulfilled') newCounts[r.value.s] = r.value.n; });
    setCounts(newCounts);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssignments({ status: tab });
      setAssignments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load.');
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  function handleUpdate() { load(); loadCounts(); }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(180deg,#F8FAFC 0%,#fff 100px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {t('assignments_board')}
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: 0 }}>Track volunteer assignments through every stage of the response lifecycle.</p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 28, overflowX: 'auto' }}>
          {TABS.map(s => {
            const meta = STATUS_META[s];
            const count = counts[s];
            return (
              <button key={s} onClick={() => setTab(s)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 200ms', whiteSpace: 'nowrap',
                background: tab === s ? '#fff' : 'transparent',
                color: tab === s ? meta.color : '#64748B',
                boxShadow: tab === s ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
                {meta.icon} {meta.label}
                {count != null && (
                  <span style={{ marginLeft: 8, fontSize: 11, background: tab === s ? meta.bg : '#E2E8F0', color: tab === s ? meta.color : '#64748B', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748B', fontSize: 14 }}>{t('loading')}</p>
          </div>
        ) : error ? (
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#DC2626' }}>⚠️ {error}</div>
        ) : assignments.length === 0 ? (
          <div style={{ background: '#F8FAFC', borderRadius: 20, padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#1C1917', margin: '0 0 8px' }}>
              No {STATUS_META[tab].label} Assignments
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 24px' }}>
              {tab === 'proposed' ? 'Match volunteers to needs to create assignments.' : `Assignments move here once ${tab === 'accepted' ? 'a volunteer accepts' : tab === 'in_progress' ? 'work begins' : 'work is done'}.`}
            </p>
            <Link href="/needs" style={{ color: '#059669', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>→ View Needs</Link>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {assignments.map(a => (
              <AssignmentCard key={a.id} a={a} onUpdate={handleUpdate} />
            ))}
          </AnimatePresence>
        )}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
