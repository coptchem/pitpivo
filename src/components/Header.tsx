import { useStore } from '../state/store';
import { initials } from '../lib/format';
import { sod } from '../lib/calc';
import { Icon } from './ui';

export function Header() {
  const { theme, setTheme, profile, goTab, members, now, drinks, cut, stats } = useStore();
  const t0 = sod(now);
  const myToday = drinks.some(d => d.ts >= t0 && d.ts > cut);
  const online = Math.max(members.filter(m => (m.stats?.lastAt || 0) >= t0).length, myToday ? 1 : 0);
  const name = profile?.name || 'Ty';
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)' }}>
      <span style={{ width: 44, height: 44, flex: 'none', borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 24, background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', boxShadow: '0 4px 14px var(--glow)' }}>🍺</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 'auto', minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: 20, lineHeight: 1, letterSpacing: '-.01em' }}>Pit Pivo</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '2px 9px', borderRadius: 99, background: 'var(--ok-tint)', border: '1px solid var(--ok)', color: 'var(--ok)', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', display: 'inline-block', animation: 'pp-pulse 1.4s ease-in-out infinite' }} />
          <span style={{ whiteSpace: 'nowrap' }}>Online · {online} u pípy</span>
        </span>
      </div>
      <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Přepnout motiv"
        style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--card)', border: '1px solid var(--line-soft)', color: 'var(--text)', cursor: 'pointer' }}>
        {theme === 'dark' ? Icon.sun(18) : Icon.moon(18)}
      </button>
      <button type="button" onClick={() => goTab('profile')} aria-label={`Úroveň ${stats.level}`} title={stats.title}
        style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', border: 0, color: 'var(--on-amber)', cursor: 'pointer', boxShadow: '0 4px 14px var(--glow)' }}>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.08em', lineHeight: 1, opacity: .85 }}>LVL</span>
        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.05 }}>{stats.level}</span>
      </button>
      <button type="button" onClick={() => goTab('profile')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px 0 5px', borderRadius: 99, background: 'var(--card)', border: '1.5px solid var(--amber)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', maxWidth: 140 }}>
        <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--amber)', color: 'var(--on-amber)', fontSize: 12 }}>{initials(name)}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      </button>
    </header>
  );
}
