'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { registerVolunteer, VolunteerRegister } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

const SKILL_PRESETS = [
  'Medical','Nursing','First Aid','Teaching','Counseling',
  'Logistics','Construction','Cooking','Driving','Translation',
  'IT Support','Social Work','Agriculture','Legal Aid','Accounting',
];
const INDIAN_LANGUAGES = ['Hindi','English','Marathi','Tamil','Telugu','Bengali','Gujarati','Kannada','Malayalam','Punjabi','Odia','Assamese'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const labelStyle: React.CSSProperties = {
  display:'block', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase',
  color:'#64748B', marginBottom:8, fontWeight:700,
};
const inputStyle: React.CSSProperties = {
  width:'100%', height:48, border:'1.5px solid #E2E8F0', borderRadius:12,
  padding:'0 16px', fontSize:15, color:'#1C1917', outline:'none',
  transition:'all 250ms', boxSizing:'border-box', fontFamily:'var(--font-body)',
  background:'#FAFAFA',
};

export default function VolunteerRegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  const [form, setForm] = useState<{
    name: string; phone: string; location_name: string;
    latitude: string; longitude: string;
    skills: string[]; languages: string[]; experience_text: string;
    has_vehicle: boolean; vehicle_type: string;
    availability: Record<string, number[]>;
  }>({
    name:'', phone:'', location_name:'', latitude:'', longitude:'',
    skills:[], languages:['Hindi','English'], experience_text:'',
    has_vehicle:false, vehicle_type:'',
    availability:{ Mon:[], Tue:[], Wed:[], Thu:[], Fri:[], Sat:[], Sun:[] },
  });

  function toggleSkill(s: string) {
    setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x=>x!==s) : [...f.skills, s] }));
  }
  function toggleLang(l: string) {
    setForm(f => ({ ...f, languages: f.languages.includes(l) ? f.languages.filter(x=>x!==l) : [...f.languages, l] }));
  }
  function toggleHour(day: string, hour: number) {
    setForm(f => {
      const hrs = f.availability[day] ?? [];
      return { ...f, availability: { ...f.availability, [day]: hrs.includes(hour) ? hrs.filter(h=>h!==hour) : [...hrs, hour].sort((a,b)=>a-b) } };
    });
  }
  function addCustomSkill(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const s = skillInput.trim().replace(/,$/, '');
      if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] }));
      setSkillInput('');
    }
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.skills.length === 0) { setError('Add at least one skill.'); return; }
    setSubmitting(true); setError(null);
    try {
      const payload: VolunteerRegister = {
        name: form.name.trim(), phone: form.phone || undefined,
        skills: form.skills, languages: form.languages,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        experience_text: form.experience_text || undefined,
        has_vehicle: form.has_vehicle,
        vehicle_type: form.has_vehicle && form.vehicle_type ? form.vehicle_type : undefined,
        availability: form.availability,
      };
      await registerVolunteer(payload);
      router.push('/volunteers');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
      setSubmitting(false);
    }
  }

  const STEPS = [t('name'), t('skills'), 'Availability'];

  return (
    <div style={{ minHeight:'calc(100vh - 56px)', background:'linear-gradient(135deg,#F0FDF4,#F8FAFC,#EFF6FF)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'48px 24px 80px' }}>
      <div style={{ width:'100%', maxWidth:680 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🙌</div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:32, fontWeight:700, color:'#1C1917', margin:'0 0 8px', letterSpacing:'-0.02em' }}>{t('volunteer_register')}</h1>
          <p style={{ fontSize:15, color:'#64748B', margin:0 }}>Join India's AI-powered humanitarian network.</p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:8, marginBottom:32, justifyContent:'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, background: step > i+1 ? '#059669' : step === i+1 ? 'linear-gradient(135deg,#059669,#10B981)' : '#E2E8F0', color: step >= i+1 ? '#fff' : '#94A3B8', boxShadow: step === i+1 ? '0 4px 12px rgba(5,150,105,0.3)' : 'none', transition:'all 300ms' }}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span style={{ fontSize:13, fontWeight:600, color: step === i+1 ? '#059669' : '#94A3B8' }}>{s}</span>
              {i < STEPS.length-1 && <div style={{ width:40, height:2, background: step > i+1 ? '#059669' : '#E2E8F0', borderRadius:999, transition:'background 300ms' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.3 }}
          style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(16px)', borderRadius:24, padding:'36px 40px', boxShadow:'0 16px 48px rgba(0,0,0,0.08)', border:'1px solid rgba(255,255,255,0.8)' }}>

          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <label style={labelStyle}>{t('name')} *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g., Priya Nair" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>{t('phone')}</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 98765 43210" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
              </div>
              <div>
                <label style={labelStyle}>{t('location')}</label>
                <input value={form.location_name} onChange={e=>setForm(f=>({...f,location_name:e.target.value}))} placeholder="e.g., Mumbai, Maharashtra" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={labelStyle}>Latitude (optional)</label>
                  <input type="number" value={form.latitude} onChange={e=>setForm(f=>({...f,latitude:e.target.value}))} placeholder="19.076" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                </div>
                <div>
                  <label style={labelStyle}>Longitude (optional)</label>
                  <input type="number" value={form.longitude} onChange={e=>setForm(f=>({...f,longitude:e.target.value}))} placeholder="72.877" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('languages_spoken')}</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {INDIAN_LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={()=>toggleLang(l)} style={{ padding:'6px 14px', borderRadius:999, border:`1.5px solid ${form.languages.includes(l)?'#059669':'#E2E8F0'}`, background: form.languages.includes(l)?'#F0FDF4':'#FAFAFA', color: form.languages.includes(l)?'#059669':'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 200ms' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <label style={labelStyle}>{t('skills')} (select or type)</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                  {SKILL_PRESETS.map(s => (
                    <button key={s} type="button" onClick={()=>toggleSkill(s)} style={{ padding:'6px 14px', borderRadius:999, border:`1.5px solid ${form.skills.includes(s)?'#059669':'#E2E8F0'}`, background: form.skills.includes(s)?'linear-gradient(135deg,#059669,#10B981)':'#FAFAFA', color: form.skills.includes(s)?'#fff':'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 200ms', boxShadow: form.skills.includes(s)?'0 2px 8px rgba(5,150,105,0.2)':'none' }}>
                      {s}
                    </button>
                  ))}
                </div>
                <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={addCustomSkill} placeholder="Type custom skill + press Enter…" style={inputStyle} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                {form.skills.filter(s=>!SKILL_PRESETS.includes(s)).length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {form.skills.filter(s=>!SKILL_PRESETS.includes(s)).map(s => (
                      <span key={s} style={{ background:'linear-gradient(135deg,#059669,#10B981)', color:'#fff', fontSize:12, fontWeight:600, borderRadius:999, padding:'4px 12px', display:'flex', gap:6, alignItems:'center' }}>
                        {s}
                        <button onClick={()=>setForm(f=>({...f,skills:f.skills.filter(x=>x!==s)}))} style={{ background:'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', borderRadius:'50%', padding:'1px 4px', color:'#fff', fontSize:11 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>{t('experience')}</label>
                <textarea value={form.experience_text} onChange={e=>setForm(f=>({...f,experience_text:e.target.value}))} rows={3} placeholder="Describe your relevant experience…" style={{ ...inputStyle, height:'auto', padding:'14px 16px', resize:'vertical', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16, background:'#F8FAFC', borderRadius:12, padding:'16px 20px', border:'1px solid #E2E8F0' }}>
                <label style={{ fontSize:14, fontWeight:600, color:'#1C1917', cursor:'pointer', display:'flex', gap:12, alignItems:'center' }}>
                  <input type="checkbox" checked={form.has_vehicle} onChange={e=>setForm(f=>({...f,has_vehicle:e.target.checked}))} style={{ width:18, height:18, accentColor:'#059669', cursor:'pointer' }} />
                  🚗 {t('has_vehicle')}
                </label>
                <AnimatePresence>
                  {form.has_vehicle && (
                    <motion.input initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:180 }} exit={{ opacity:0, width:0 }} value={form.vehicle_type} onChange={e=>setForm(f=>({...f,vehicle_type:e.target.value}))} placeholder="e.g., Bike, Car, Truck" style={{ ...inputStyle, height:36, flex:'1', fontSize:13 }} onFocus={e=>e.target.style.borderColor='#059669'} onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:'#1C1917', marginBottom:4 }}>Weekly Availability</h3>
              <p style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Click the hours you're available each day.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {DAYS.map(day => (
                  <div key={day} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#475569', width:32, textAlign:'right', flexShrink:0 }}>{day}</span>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(h => {
                        const active = (form.availability[day]??[]).includes(h);
                        return (
                          <button key={h} type="button" onClick={()=>toggleHour(day,h)} style={{ width:28, height:28, borderRadius:6, border:`1.5px solid ${active?'#059669':'#E2E8F0'}`, background: active?'linear-gradient(135deg,#059669,#10B981)':'#FAFAFA', color: active?'#fff':'#94A3B8', fontSize:10, fontWeight:700, cursor:'pointer', transition:'all 150ms' }}>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:28, background:'#F0FDF4', borderRadius:12, padding:'16px 20px', border:'1px solid #BBF7D0' }}>
                <h4 style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'#1C1917', margin:'0 0 8px' }}>Review</h4>
                <div style={{ fontSize:13, color:'#475569', display:'flex', flexDirection:'column', gap:4 }}>
                  <span>👤 <strong>{form.name}</strong></span>
                  <span>🛠 {form.skills.join(', ') || 'None selected'}</span>
                  <span>🗣 {form.languages.join(', ')}</span>
                  {form.location_name && <span>📍 {form.location_name}</span>}
                  {form.has_vehicle && <span>🚗 {form.vehicle_type || 'Has vehicle'}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ marginTop:16, background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'12px 16px', color:'#DC2626', fontSize:14 }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display:'flex', gap:12, marginTop:28 }}>
            {step > 1 && (
              <button onClick={()=>setStep(s=>s-1)} style={{ flex:1, height:48, border:'1.5px solid #E2E8F0', borderRadius:12, background:'#fff', fontSize:15, fontWeight:600, color:'#475569', cursor:'pointer' }}>
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={()=>setStep(s=>s+1)} style={{ flex:2, height:48, background:'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 6px 20px rgba(5,150,105,0.3)' }}>
                Continue →
              </button>
            ) : (
              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }} onClick={handleSubmit} disabled={submitting}
                style={{ flex:2, height:52, background: submitting?'#D1D5DB':'linear-gradient(135deg,#059669,#10B981)', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor: submitting?'default':'pointer', boxShadow: submitting?'none':'0 8px 24px rgba(5,150,105,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                {submitting ? <><div style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Submitting…</> : '🚀 Complete Registration'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
