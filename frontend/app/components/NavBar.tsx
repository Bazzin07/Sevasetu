'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, LANGUAGES, LangCode } from '@/lib/i18n';

const navLinks = [
  { key: 'home',        href: '/',           label: 'Home' },
  { key: 'dashboard',   href: '/dashboard',  label: 'Dashboard' },
  { key: 'needs',       href: '/needs',      label: 'Needs' },
  { key: 'volunteers',  href: '/volunteers', label: 'Volunteers' },
  { key: 'assignments', href: '/assignments',label: 'Assignments' },
  { key: 'ingest',      href: '/ingest',     label: 'Ingest' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();

  return (
    <nav style={{
      borderBottom: '1px solid var(--slate-100)',
      padding: '0 var(--space-6)',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100,
      position: 'sticky',
      top: 0,
      boxShadow: '0 1px 0 var(--slate-100)',
    }}>

      {/* Brand */}
      <Link href="/" style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--stone-900)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        letterSpacing: '-0.01em',
      }}>
        {/* Minimal leaf mark */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 22C12 22 4 16 4 9C4 5.13 7.58 2 12 2C16.42 2 20 5.13 20 9C20 16 12 22 12 22Z"
            fill="url(#g1)" />
          <path d="M12 22V11M12 11C12 11 8 8 8 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
          <defs>
            <linearGradient id="g1" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981"/>
              <stop offset="1" stopColor="#059669"/>
            </linearGradient>
          </defs>
        </svg>
        SevaSetu
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {navLinks.map(link => {
          const active = link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} style={{
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? '#059669' : 'var(--slate-600)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: active ? 'var(--emerald-50)' : 'transparent',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
              letterSpacing: active ? '0' : '0',
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--slate-50)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {t(link.key)}
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--slate-200)', margin: '0 8px' }} />

        {/* Language Switcher */}
        <select
          value={lang}
          onChange={e => setLang(e.target.value as LangCode)}
          style={{
            height: 30, border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
            padding: '0 8px', fontSize: 12, fontWeight: 500, color: 'var(--slate-600)',
            background: '#fff', outline: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        {/* Report Need CTA */}
        <Link href="/needs/new" style={{
          fontSize: 13, fontWeight: 600, color: '#fff',
          background: 'linear-gradient(135deg, #059669, #10B981)',
          padding: '7px 16px', borderRadius: 'var(--radius-md)',
          textDecoration: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(5,150,105,0.25)',
          marginLeft: 4,
          transition: 'opacity var(--transition-fast)',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        >
          {t('report_need')}
        </Link>
      </div>
    </nav>
  );
}
