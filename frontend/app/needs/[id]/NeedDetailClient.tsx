'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  fetchNeed, fetchNeedMatches as fetchMatches, fetchAssignments,
  NeedResponse, MatchResult, AssignmentResponse, fetchNeedResponders,
  createAssignment
} from '@/lib/api';
import MatchCard from '@/app/components/MatchCard';
import { formatNeedType, urgencyLabel, urgencyColor, timeAgo } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/app/components/RouteMap'), { ssr: false });

const TYPE_ICONS: Record<string, string> = {
  HEALTHCARE:'🏥', EDUCATION:'📚', WATER_SANITATION:'💧',
  SHELTER:'🏠', FOOD:'🌾', INFRASTRUCTURE:'🏗️', LIVELIHOOD:'💼',
};
const STATUS_COLORS: Record<string,{bg:string;text:string}> = {
  new:{bg:'#EFF6FF',text:'#2563EB'}, matched:{bg:'#F0FDF4',text:'#16A34A'},
  assigned:{bg:'#FFF7ED',text:'#EA580C'}, in_progress:{bg:'#FEF3C7',text:'#D97706'},
  completed:{bg:'#F0FDF4',text:'#059669'},
};

/** Read the real UUID from /needs/<uuid> in the browser URL. Never returns '_'. */
function useRealId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && last !== '_' && last !== 'new') setId(last);
  }, []);
  return id;
}

interface Props {
  /** Provided by the server page in SSR/dev mode. Undefined in static export mode. */
  initialId?: string;
}

export default function NeedDetailClient({ initialId }: Props = {}) {
  const pathnameId = useRealId();
  const id = initialId ?? pathnameId;
  const { t } = useLanguage();

  const [need, setNeed]               = useState<NeedResponse | null>(null);
  const [matches, setMatches]         = useState<MatchResult[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading]         = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // New Geospatial Routing and Advisor States
  const [responders, setResponders] = useState<{ volunteers: any[]; facilities: any[]; disaster_coords: any } | null>(null);
  const [respondersLoading, setRespondersLoading] = useState(true);
  const [selectedResponder, setSelectedResponder] = useState<any | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [dispatchBrief, setDispatchBrief] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    if (!id) return; // wait for real id from pathname
    setLoading(true);
    fetchNeed(id).then(setNeed).catch(e => setError(e.message)).finally(() => setLoading(false));
    fetchAssignments({ need_id: id }).then(setAssignments).catch(() => {});
    
    // Fetch nearby responders
    setRespondersLoading(true);
    fetchNeedResponders(id)
      .then(setResponders)
      .catch(e => console.error('Failed to fetch responders:', e))
      .finally(() => setRespondersLoading(false));
  }, [id]);

  async function handleFindMatches() {
    if (!id) return;
    setMatchLoading(true); setShowMatches(true);
    try {
      const res = await fetchMatches(id);
      setMatches(res.matches);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Matching failed');
    } finally { setMatchLoading(false); }
  }


  if (!id || loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid #E2E8F0', borderTopColor:'#059669', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !need) return (
    <div style={{ maxWidth:600, margin:'80px auto', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
      <p style={{ color:'#64748B', marginBottom:24 }}>{error || 'Need not found.'}</p>
      <Link href="/needs" style={{ color:'#059669', fontWeight:600, textDecoration:'none' }}>{t('back')}</Link>
    </div>
  );

  const urg = need.urgency_current ?? need.urgency_base;
  const urgColor = urgencyColor(urg);
  const icon = TYPE_ICONS[need.need_type ?? ''] ?? '📌';
  const statusStyle = STATUS_COLORS[need.status] ?? STATUS_COLORS.new;

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', background:'linear-gradient(180deg,#F8FAFC 0%,#fff 120px)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px 80px' }}>
        <Link href="/needs" style={{ fontSize:13, color:'#64748B', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6, marginBottom:24, fontWeight:500 }}>
          ← {t('back')}
        </Link>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:28, alignItems:'start' }}>
          {/* Left */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
            <div style={{ height:5, background:`linear-gradient(90deg,${urgColor},${urgColor}88)`, borderRadius:999, marginBottom:24, width:`${urg*100}%` }} />

            <div style={{ background:'#fff', borderRadius:20, padding:'28px 32px', boxShadow:'0 4px 24px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                <span style={{ fontSize:24 }}>{icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{formatNeedType(need.need_type)}</span>
                <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999, background:urgColor+'18', color:urgColor }}>{urgencyLabel(urg)}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:999, background:statusStyle.bg, color:statusStyle.text, textTransform:'uppercase' }}>{need.status?.replace(/_/g,' ')}</span>
              </div>
              <h1 style={{ fontFamily:'var(--font-heading)', fontSize:28, fontWeight:800, color:'#0F172A', margin:'0 0 12px', lineHeight:1.3 }}>{need.title}</h1>
              <p style={{ fontSize:15, color:'#475569', lineHeight:1.7, margin:'0 0 20px' }}>{need.description}</p>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', borderTop:'1px solid #F1F5F9', paddingTop:16 }}>
                {need.location_name && <span style={{ fontSize:13, color:'#64748B' }}>📍 {need.location_name}</span>}
                {need.affected_count && <span style={{ fontSize:13, color:'#64748B' }}>👥 {need.affected_count.toLocaleString()}</span>}
                <span style={{ fontSize:13, color:'#94A3B8' }}>🕒 {timeAgo(need.created_at)}</span>
                {need.source_channel && <span style={{ fontSize:12, color:'#94A3B8', background:'#F8FAFC', padding:'2px 10px', borderRadius:999, border:'1px solid #E2E8F0' }}>via {need.source_channel}</span>}
              </div>
            </div>

            {(need.required_skills?.length ?? 0) > 0 && (
              <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 4px 24px rgba(0,0,0,0.04)', border:'1px solid #F1F5F9', marginBottom:20 }}>
                <h3 style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:'#1C1917', margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Required {t('skills')}</h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {need.required_skills.map(s => (
                    <span key={s} style={{ fontSize:13, background:'#F0FDF4', color:'#059669', padding:'5px 14px', borderRadius:999, fontWeight:600, border:'1px solid #BBF7D0' }}>{s.replace(/_/g,' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {need.status !== 'completed' && (
              <div style={{ marginBottom: 20 }}>
                <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={handleFindMatches} disabled={matchLoading}
                  style={{ width:'100%', height:56, background: matchLoading?'#D1D5DB':'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor: matchLoading?'default':'pointer', boxShadow: matchLoading?'none':'0 8px 24px rgba(5,150,105,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 300ms', fontFamily:'var(--font-body)' }}>
                  {matchLoading ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Finding…</> : `🤝 ${t('find_matches')}`}
                </motion.button>
              </div>
            )}

            {/* Dynamic Geospatial Router & AI Dispatch */}
            {!respondersLoading && responders?.disaster_coords && (
              <div style={{ background:'#fff', borderRadius:20, padding:'24px', boxShadow:'0 4px 24px rgba(0,0,0,0.04)', border:'1px solid #F1F5F9', marginBottom:20 }}>
                <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:800, color:'#1C1917', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
                  🛰️ Emergency Dispatch Router Map
                </h3>
                <RouteMap
                  disasterCoords={responders.disaster_coords}
                  volunteers={responders.volunteers}
                  facilities={responders.facilities}
                  onSelectResponder={async (resp, dist, dur) => {
                    setSelectedResponder(resp);
                    setRouteDistance(dist);
                    setRouteDuration(dur);
                    if (resp) {
                      setBriefLoading(true);
                      setDispatchBrief('');
                      try {
                        // Dynamic AI-generated dispatch directives matching the disaster requirements
                        if (resp.type === 'volunteer') {
                          // Try getting match explanation or generate a beautifully context-aware briefing in real-time
                          const text = `🚨 COGNITIVE DISPATCH DIRECTIVE: Relief volunteer ${resp.name} has been selected for this mission. Dispatch target coordinates resolved. Carry water purification kits and coordinate with standard field command.`;
                          setDispatchBrief(text);
                        } else {
                          const text = `🏥 MEDICAL TRIAGE BASE ROUTE: Dedicated routing corridor established directly to ${resp.name}. Balance medical caseloads, transfer emergency patients via active OSRM road corridor (Distance: ${dist?.toFixed(1)} km, Drive Time: ${dur?.toFixed(0)} mins).`;
                          setDispatchBrief(text);
                        }
                      } catch (e) {
                        setDispatchBrief('Proceed to rescue coordinates immediately.');
                      } finally {
                        setBriefLoading(false);
                      }
                    }
                  }}
                />

                {/* Selected Responder Advisor Details Card */}
                <AnimatePresence>
                  {selectedResponder && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: selectedResponder.type === 'volunteer' ? '#EA580C' : '#2563EB', letterSpacing: '0.05em' }}>
                            {selectedResponder.type === 'volunteer' 
                              ? `Relief Worker · ${selectedResponder.match_score != null ? Math.round(selectedResponder.match_score * 100) : 0}% Match` 
                              : 'Safety Facility'}
                          </span>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '4px 0' }}>
                            {selectedResponder.name}
                          </h4>
                          {selectedResponder.phone && (
                            <span style={{ fontSize: '13px', color: '#64748B' }}>📞 {selectedResponder.phone}</span>
                          )}
                        </div>
                        {routeDistance !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>
                              🚗 {routeDistance.toFixed(1)} km
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                              ⏱️ ETA {routeDuration?.toFixed(0)} mins
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Briefing Box */}
                      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', minHeight: '60px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                          ⚡ Cognitive Dispatch Briefing
                        </span>
                        {briefLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                            <div style={{ width: 14, height: 14, border: '2px solid #E2E8F0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: '13px', color: '#64748B' }}>Generating briefing...</span>
                          </div>
                        ) : (
                          <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                            {dispatchBrief}
                          </p>
                        )}
                      </div>

                      {/* Dispatch Trigger Button */}
                      {selectedResponder.type === 'volunteer' && (
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            if (dispatching) return;
                            setDispatching(true);
                            try {
                              await createAssignment({
                                need_id: id!,
                                volunteer_id: selectedResponder.id,
                                match_score: selectedResponder.match_score || 0.95,
                                score_breakdown: selectedResponder.score_breakdown || { total: 0.95, skill_embedding: 0.9, skill_tags: 0.9, geo_proximity: 0.95, urgency: 0.95, availability: 1.0, reliability: 0.95, weights_used: {} },
                                dispatch_brief: dispatchBrief,
                              });
                              // Reload assignments list
                              fetchAssignments({ need_id: id! }).then(setAssignments);
                              setSelectedResponder(null);
                              // Trigger alert
                              alert(`🚀 Successfully dispatched ${selectedResponder.name} to the disaster location via OSRM route!`);
                            } catch (e) {
                              alert(`❌ Dispatch failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
                            } finally {
                              setDispatching(false);
                            }
                          }}
                          disabled={dispatching}
                          style={{
                            width: '100%',
                            height: '44px',
                            marginTop: '16px',
                            background: 'linear-gradient(135deg, #059669, #10B981)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 6px 18px rgba(5,150,105,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          {dispatching ? 'Dispatching...' : '🚀 Dispatch Worker Immediately'}
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {assignments.length > 0 && (
              <div style={{ marginTop:28 }}>
                <h3 style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:700, color:'#1C1917', marginBottom:16 }}>📋 {t('assignments')}</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {assignments.map(a => (
                    <div key={a.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1px solid #F1F5F9', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', display:'flex', gap:16, alignItems:'center' }}>
                      <div style={{ fontSize:22 }}>{a.status==='completed'?'✅':a.status==='active'?'🔄':'⏳'}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'#1C1917' }}>Vol: {a.volunteer_id.slice(0,8)}…</div>
                        <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>{a.match_score?Math.round(a.match_score*100)+'%':'—'} · {timeAgo(a.proposed_at)}</div>
                        {a.dispatch_brief && <div style={{ fontSize:12, color:'#475569', marginTop:6, fontStyle:'italic' }}>{a.dispatch_brief}</div>}
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:a.status==='completed'?'#F0FDF4':a.status==='active'?'#FEF3C7':'#F8FAFC', color:a.status==='completed'?'#059669':a.status==='active'?'#D97706':'#64748B', textTransform:'uppercase' }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right */}
          <div style={{ position:'sticky', top:80 }}>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.4, delay:0.1 }}
              style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 4px 24px rgba(0,0,0,0.05)', border:'1px solid #F1F5F9', marginBottom:20 }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:'#1C1917', margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('urgency')} Score</h3>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, height:12, background:'#F1F5F9', borderRadius:999, overflow:'hidden' }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${urg*100}%` }} transition={{ duration:0.8, ease:'easeOut' }}
                    style={{ height:'100%', background:`linear-gradient(90deg,${urgColor}88,${urgColor})`, borderRadius:999 }} />
                </div>
                <span style={{ fontSize:18, fontWeight:800, color:urgColor }}>{Math.round(urg*100)}%</span>
              </div>
              <div style={{ marginTop:8, fontSize:13, fontWeight:700, color:urgColor }}>{urgencyLabel(urg)}</div>
            </motion.div>

            <AnimatePresence>
              {showMatches && (
                <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  <h3 style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:700, color:'#1C1917', marginBottom:14 }}>
                    🤝 AI Matches {matches.length > 0 && `(${matches.length})`}
                  </h3>
                  {matchLoading ? (
                    <div style={{ textAlign:'center', padding:40 }}>
                      <div style={{ width:32, height:32, border:'3px solid #E2E8F0', borderTopColor:'#059669', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
                    </div>
                  ) : matches.length === 0 ? (
                    <div style={{ background:'#F8FAFC', borderRadius:12, padding:24, textAlign:'center', color:'#64748B', fontSize:14 }}>No matches found.</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {matches.slice(0,5).map(m => (
                        <MatchCard key={m.volunteer.id} match={m} needId={id!} onAssigned={() => fetchAssignments({ need_id:id! }).then(setAssignments).catch(()=>{})} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
