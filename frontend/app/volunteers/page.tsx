'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchVolunteers, VolunteerResponse } from '@/lib/api';
import VolunteerCard from '@/app/components/VolunteerCard';
import EmptyState from '@/app/components/EmptyState';
import { CardGridSkeleton } from '@/app/components/Skeleton';
import { cardVariants } from '@/lib/animations';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

const STATUSES = ['', 'available', 'on_assignment', 'inactive'];
const STATUS_LABELS: Record<string, string> = {
  '': 'All Statuses', available: 'Available',
  on_assignment: 'On Assignment', inactive: 'Inactive',
};

const sel: React.CSSProperties = {
  height: 40, border: '1.5px solid #E2E8F0', borderRadius: 10,
  padding: '0 14px', fontSize: 13, fontWeight: 600, color: '#64748B',
  background: '#fff', outline: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-body)', transition: 'border-color 200ms',
};

export default function VolunteersPage() {
  const { t } = useLanguage();
  const [status, setStatus]       = useState('');
  const [skill, setSkill]         = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [volunteers, setVolunteers] = useState<VolunteerResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchVolunteers({
        status: status || undefined,
        skill: skill || undefined,
      });
      setVolunteers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load volunteers.');
    } finally { setLoading(false); }
  }, [status, skill]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(180deg, #F8FAFC 0%, #fff 200px)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {t('volunteers')}
            </h1>
            <p style={{ fontSize: 15, color: '#64748B', margin: 0 }}>
              {loading ? '…' : `${volunteers.length} registered volunteers`}
            </p>
          </div>
          <Link href="/volunteers/register" style={{
            background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff',
            padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            + {t('register')}
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28, background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
          <select value={status} onChange={e => { setStatus(e.target.value); }} style={sel}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 0 }}>
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSkill(skillInput); }}
              placeholder="Filter by skill…"
              style={{ ...sel, borderRadius: '10px 0 0 10px', borderRight: 'none', width: 200 }}
              onFocus={e => e.target.style.borderColor = '#059669'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            <button onClick={() => setSkill(skillInput)} style={{ height: 40, padding: '0 16px', background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {t('filter')}
            </button>
          </div>
          {(status || skill) && (
            <button onClick={() => { setStatus(''); setSkill(''); setSkillInput(''); }}
              style={{ ...sel, color: '#EF4444', border: '1.5px solid #FCA5A5', background: '#FEF2F2' }}>
              ✕ {t('clear')}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <CardGridSkeleton count={6} type="volunteer" />
        ) : error ? (
          <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 32, textAlign: 'center', color: '#DC2626' }}>⚠️ {error}</div>
        ) : volunteers.length === 0 ? (
          <EmptyState message="No volunteers match your filters." ctaLabel="Register as volunteer" ctaHref="/volunteers/register" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {volunteers.map((vol, i) => (
              <motion.div key={vol.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <VolunteerCard volunteer={vol} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
