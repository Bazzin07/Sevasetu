'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ingestWhatsApp, ingestRawText, ingestCSV, fetchOfflineQueue, triggerOfflineSync, NeedResponse, BulkIngestResult, OfflineQueueResponse } from '@/lib/api';
import { useLanguage, LangCode, LANGUAGES } from '@/lib/i18n';
import Link from 'next/link';

type Tab = 'whatsapp' | 'text' | 'csv' | 'offline';

const TAB_META: Record<Tab, { icon: string; label: string }> = {
  whatsapp: { icon: '📱', label: 'WhatsApp' },
  text:     { icon: '✍️', label: 'Raw Text / AI' },
  csv:      { icon: '📊', label: 'CSV Upload' },
  offline:  { icon: '📡', label: 'Offline Queue' },
};

function ResultCard({ need }: { need: NeedResponse }) {
  const urgColor = need.urgency_base >= 0.85 ? '#DC2626' : need.urgency_base >= 0.65 ? '#EA580C' : need.urgency_base >= 0.40 ? '#CA8A04' : '#059669';
  const urgLabel = need.urgency_base >= 0.85 ? 'Critical' : need.urgency_base >= 0.65 ? 'High' : need.urgency_base >= 0.40 ? 'Moderate' : 'Low';
  return (
    <motion.div initial={{ opacity:0, y:12, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.4 }}
      style={{ background:'#fff', borderRadius:16, padding:'20px 24px', border:'1px solid #BBF7D0', boxShadow:'0 8px 24px rgba(5,150,105,0.08)' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#059669', textTransform:'uppercase', letterSpacing:'0.08em', background:'#F0FDF4', padding:'3px 10px', borderRadius:999 }}>
          ✅ Need Created
        </span>
        <span style={{ fontSize:11, fontWeight:700, color:urgColor, background:urgColor+'18', padding:'3px 10px', borderRadius:999 }}>
          {urgLabel}
        </span>
        <span style={{ fontSize:11, color:'#94A3B8', background:'#F8FAFC', padding:'3px 10px', borderRadius:999, border:'1px solid #E2E8F0', marginLeft:'auto' }}>
          {need.need_type?.replace(/_/g,' ') ?? 'Unknown'}
        </span>
      </div>
      <h3 style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:700, color:'#0F172A', margin:'0 0 6px', lineHeight:1.3 }}>{need.title}</h3>
      <p style={{ fontSize:13, color:'#64748B', margin:'0 0 14px', lineHeight:1.6 }}>{need.description}</p>
      {need.required_skills?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {need.required_skills.map(s => (
            <span key={s} style={{ fontSize:11, background:'#F0FDF4', color:'#059669', padding:'3px 10px', borderRadius:999, fontWeight:600 }}>{s.replace(/_/g,' ')}</span>
          ))}
        </div>
      )}
      <Link href={`/needs/${need.id}`} style={{ fontSize:13, fontWeight:700, color:'#059669', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
        View Need & Find Matches →
      </Link>
    </motion.div>
  );
}

function BulkResultCard({ result }: { result: BulkIngestResult }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
      style={{ background:'#fff', borderRadius:16, padding:'24px', border:'1px solid #BBF7D0', boxShadow:'0 8px 24px rgba(5,150,105,0.08)' }}>
      <div style={{ fontSize:18, marginBottom:16 }}>📊 CSV Import Complete</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Total Rows', val:result.total_rows, color:'#1C1917' },
          { label:'Processed',  val:result.processed,  color:'#059669' },
          { label:'Duplicates', val:result.duplicates, color:'#CA8A04' },
          { label:'Errors',     val:result.errors,     color:'#DC2626' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:'#F8FAFC', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:800, color, fontFamily:'var(--font-heading)' }}>{val}</div>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>
      {result.need_ids.length > 0 && (
        <Link href="/needs" style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:16, fontSize:13, fontWeight:700, color:'#059669', textDecoration:'none' }}>
          View All Created Needs →
        </Link>
      )}
    </motion.div>
  );
}

export default function IngestPage() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needResult, setNeedResult] = useState<NeedResponse | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkIngestResult | null>(null);

  // WhatsApp state
  const [waPhone, setWaPhone]   = useState('');
  const [waText, setWaText]     = useState('');

  // Text state
  const [textInput, setTextInput] = useState('');
  const [textLang, setTextLang]   = useState<LangCode>(lang);

  // CSV state
  const fileRef  = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueResponse | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'offline') {
      setOfflineLoading(true);
      fetchOfflineQueue().then(setOfflineQueue).catch(() => {}).finally(() => setOfflineLoading(false));
    }
  }, [tab]);

  async function handleSync() {
    setOfflineLoading(true); setSyncMsg(null);
    try {
      const res = await triggerOfflineSync();
      setSyncMsg(`✅ Synced ${res.synced} reports. ${res.remaining} remaining in queue.`);
      const q = await fetchOfflineQueue();
      setOfflineQueue(q);
    } catch (e: unknown) {
      setSyncMsg(`⚠️ Sync failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setOfflineLoading(false); }
  }

  function reset() { setNeedResult(null); setBulkResult(null); setError(null); }

  async function submitWA() {
    if (!waText.trim()) { setError('Message text is required.'); return; }
    reset(); setLoading(true);
    try {
      const res = await ingestWhatsApp({ phone: waPhone || '+91-demo', message_type:'text', text: waText });
      setNeedResult(res);
      setWaText(''); setWaPhone('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed.'); }
    finally { setLoading(false); }
  }

  async function submitText() {
    if (textInput.trim().length < 10) { setError('Please enter at least 10 characters.'); return; }
    reset(); setLoading(true);
    try {
      const res = await ingestRawText(textInput, textLang, 'dashboard');
      setNeedResult(res);
      setTextInput('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed.'); }
    finally { setLoading(false); }
  }

  async function submitCSV() {
    if (!csvFile) { setError('Please select a CSV file.'); return; }
    reset(); setLoading(true);
    try {
      const res = await ingestCSV(csvFile);
      setBulkResult(res);
      setCsvFile(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed.'); }
    finally { setLoading(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) setCsvFile(f);
    else setError('Only .csv files are accepted.');
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', border:'1.5px solid #E2E8F0', borderRadius:12,
    padding:'12px 16px', fontSize:15, color:'#1C1917', outline:'none',
    fontFamily:'var(--font-body)', background:'#FAFAFA', boxSizing:'border-box',
    transition:'border-color 200ms',
  };

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', background:'linear-gradient(180deg,#F8FAFC 0%,#fff 120px)' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'40px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:34, fontWeight:800, color:'#0F172A', margin:'0 0 8px', letterSpacing:'-0.02em' }}>
            {t('ingest_hub')}
          </h1>
          <p style={{ fontSize:15, color:'#64748B', margin:0 }}>
            Submit community needs via WhatsApp messages, raw text, or bulk CSV — all processed by Gemini AI.
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'#F1F5F9', borderRadius:14, padding:4, marginBottom:28 }}>
          {(Object.entries(TAB_META) as [Tab, { icon:string; label:string }][]).map(([key, meta]) => (
            <button key={key} onClick={()=>{ setTab(key); reset(); }} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 200ms', background: tab===key?'#fff':'transparent', color: tab===key?'#059669':'#64748B', boxShadow: tab===key?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}
            style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', borderRadius:24, padding:'32px', boxShadow:'0 16px 48px rgba(0,0,0,0.07)', border:'1px solid rgba(255,255,255,0.8)', marginBottom:24 }}>

            {tab === 'whatsapp' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ background:'#F0FDF4', borderRadius:12, padding:'14px 18px', border:'1px solid #BBF7D0', fontSize:13, color:'#166534' }}>
                  📱 Simulate a WhatsApp field report. Our AI will extract the need, urgency, location, and required skills automatically.
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Sender Phone</label>
                  <input value={waPhone} onChange={e=>setWaPhone(e.target.value)} placeholder="+91 98765 43210" style={{ ...inputStyle, height:48 }} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Message Text *</label>
                  <textarea value={waText} onChange={e=>setWaText(e.target.value)} rows={5} placeholder="e.g., Hamare gaon mein flood aa gayi hai. 200 log phas gaye hain. Medical help aur khana chahiye urgently. Location: Silchar, Assam." style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                  <p style={{ fontSize:12, color:'#94A3B8', marginTop:6 }}>💡 Try writing in Hindi, Tamil, or any Indian language — AI handles it automatically.</p>
                </div>
                <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={submitWA} disabled={loading}
                  style={{ height:52, background: loading?'#D1D5DB':'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor: loading?'default':'pointer', boxShadow: loading?'none':'0 8px 24px rgba(5,150,105,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  {loading ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Processing…</> : '📱 Process WhatsApp Message'}
                </motion.button>
              </div>
            )}

            {tab === 'text' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h3 style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:'#1C1917', margin:0 }}>AI-Powered Text Ingestion</h3>
                    <p style={{ fontSize:13, color:'#64748B', margin:'4px 0 0' }}>Describe the situation in any language. Gemini will extract structured data.</p>
                  </div>
                  <select value={textLang} onChange={e=>setTextLang(e.target.value as LangCode)} style={{ height:38, border:'1.5px solid #E2E8F0', borderRadius:10, padding:'0 12px', fontSize:13, fontWeight:600, color:'#475569', background:'#fff', outline:'none', cursor:'pointer' }}>
                    {(Object.entries(LANGUAGES) as [LangCode,string][]).map(([c,l]) => (
                      <option key={c} value={c}>{l}</option>
                    ))}
                  </select>
                </div>
                <textarea value={textInput} onChange={e=>setTextInput(e.target.value)} rows={7}
                  placeholder="Describe the community need in detail. Include location, number of people affected, what kind of help is needed, and how urgent it is…"
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.7, fontSize:14 }}
                  onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color: textInput.length < 10 ? '#EF4444' : '#94A3B8' }}>{textInput.length} chars {textInput.length < 10 && '(min 10)'}</span>
                  <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={submitText} disabled={loading}
                    style={{ height:48, padding:'0 32px', background: loading?'#D1D5DB':'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading?'default':'pointer', boxShadow: loading?'none':'0 6px 20px rgba(5,150,105,0.3)', display:'flex', alignItems:'center', gap:8 }}>
                    {loading ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Processing…</> : '✍️ Extract & Create Need'}
                  </motion.button>
                </div>
              </div>
            )}

            {tab === 'offline' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ background:'#FEF3C7', borderRadius:12, padding:'14px 18px', border:'1px solid #FDE68A', fontSize:13, color:'#92400E' }}>
                  📡 Reports submitted during connectivity outages are queued here. Use &quot;Sync Now&quot; to push them to the database when connectivity is restored.
                </div>

                {/* Stats */}
                {offlineLoading ? (
                  <div style={{ textAlign:'center', padding:40 }}><div style={{ width:32, height:32, border:'3px solid #E2E8F0', borderTopColor:'#D97706', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} /></div>
                ) : offlineQueue ? (
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:20 }}>
                      {[
                        { label:'Queue Depth', val: offlineQueue.queue_depth, color:'#D97706' },
                        { label:'Total Queued', val: (offlineQueue.stats as Record<string,number>)?.total_queued ?? '—', color:'#2563EB' },
                        { label:'Total Synced', val: (offlineQueue.stats as Record<string,number>)?.total_synced ?? '—', color:'#059669' },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ background:'#F8FAFC', borderRadius:12, padding:'16px', textAlign:'center', border:'1px solid #F1F5F9' }}>
                          <div style={{ fontSize:26, fontWeight:800, color, fontFamily:'var(--font-heading)' }}>{String(val)}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', marginTop:4 }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {syncMsg && (
                      <div style={{ background: syncMsg.startsWith('✅') ? '#F0FDF4' : '#FEF2F2', border:`1px solid ${syncMsg.startsWith('✅') ? '#BBF7D0' : '#FCA5A5'}`, borderRadius:10, padding:'12px 16px', color: syncMsg.startsWith('✅') ? '#166534' : '#DC2626', fontSize:13, marginBottom:16 }}>
                        {syncMsg}
                      </div>
                    )}

                    <button onClick={handleSync} disabled={offlineLoading || offlineQueue.queue_depth === 0}
                      style={{ width:'100%', height:48, background: offlineQueue.queue_depth === 0 ? '#E2E8F0' : 'linear-gradient(135deg,#D97706,#F59E0B)', color: offlineQueue.queue_depth === 0 ? '#94A3B8' : '#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: offlineQueue.queue_depth === 0 ? 'default' : 'pointer', marginBottom:20 }}>
                      {offlineLoading ? 'Syncing…' : offlineQueue.queue_depth === 0 ? '✓ Queue Empty' : `📡 Sync Now (${offlineQueue.queue_depth} pending)`}
                    </button>

                    {/* Pending list */}
                    {offlineQueue.pending_reports.length > 0 && (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Pending Reports</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {(offlineQueue.pending_reports as Record<string,unknown>[]).map((r, i) => (
                            <div key={i} style={{ background:'#FFFBEB', borderRadius:10, padding:'12px 16px', border:'1px solid #FDE68A', fontSize:13 }}>
                              <div style={{ fontWeight:600, color:'#92400E', marginBottom:2 }}>{String(r.title || r.description || 'Untitled report').slice(0, 80)}</div>
                              <div style={{ color:'#A16207', fontSize:12 }}>Channel: {String(r.source_channel ?? '—')} · ID: {String(r.id ?? '—').slice(0, 8)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color:'#64748B', textAlign:'center', fontSize:14 }}>Could not load offline queue.</div>
                )}
              </div>
            )}

            {tab === 'csv' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div style={{ background:'#F0FDF4', borderRadius:12, padding:'14px 18px', border:'1px solid #BBF7D0', fontSize:13, color:'#166534' }}>
                  📊 Expected columns: <code>title, description, need_type, location, urgency, affected_count, skills</code>
                </div>
                <div
                  onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
                  onDragLeave={()=>setDragging(false)}
                  onDrop={onDrop}
                  onClick={()=>fileRef.current?.click()}
                  style={{ border:`2px dashed ${dragging?'#059669':csvFile?'#10B981':'#CBD5E1'}`, borderRadius:16, padding:'40px 24px', textAlign:'center', cursor:'pointer', background: dragging?'#F0FDF4':csvFile?'#F0FDF4':'#F8FAFC', transition:'all 200ms' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>{csvFile?'📄':'☁️'}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1C1917', marginBottom:6 }}>
                    {csvFile ? csvFile.name : 'Drop CSV here or click to select'}
                  </div>
                  {csvFile && <div style={{ fontSize:12, color:'#64748B' }}>{(csvFile.size/1024).toFixed(1)} KB</div>}
                  {!csvFile && <div style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Supports .csv files up to 10MB</div>}
                  <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) setCsvFile(e.target.files[0]); }} />
                </div>
                {csvFile && (
                  <div style={{ display:'flex', gap:12 }}>
                    <button onClick={()=>setCsvFile(null)} style={{ flex:1, height:48, border:'1.5px solid #E2E8F0', borderRadius:12, background:'#fff', fontSize:14, fontWeight:600, color:'#64748B', cursor:'pointer' }}>Remove</button>
                    <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={submitCSV} disabled={loading}
                      style={{ flex:2, height:48, background: loading?'#D1D5DB':'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      {loading ? <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Uploading…</> : '📊 Upload & Process CSV'}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:12, padding:'14px 18px', color:'#DC2626', fontSize:14, fontWeight:500, marginBottom:16 }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {needResult && <ResultCard need={needResult} />}
        {bulkResult && <BulkResultCard result={bulkResult} />}
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
