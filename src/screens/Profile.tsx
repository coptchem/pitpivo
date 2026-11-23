import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { MET } from '../lib/catalog';
import { BADGES } from '../lib/catalog';
import { initials, n2, pl } from '../lib/format';
import { S, Segment, Spinner, Stepper } from '../components/ui';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
);
const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.8-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.2 3.1-2.5.9-1.4 1.3-2.7 1.4-2.8-.1 0-2.9-1.1-2.9-4.2zM13.9 5.4c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4z" /></svg>
);
const providerLabel = (id: string) => (id === 'google.com' ? 'Google' : id === 'apple.com' ? 'Apple' : 'email');

export function Profile() {
  const st = useStore();
  const { profile, stats, authUser, pubs, invites, uid, theme, setTheme } = st;
  const prof = { kg: profile?.kg ?? 80, sex: profile?.sex ?? 'm', met: profile?.met ?? 'normal' } as const;
  const [name, setName] = useState(profile?.name || '');
  const [kg, setKg] = useState<number | string>(prof.kg);
  useEffect(() => { setName(profile?.name || ''); }, [profile?.name]);
  useEffect(() => { setKg(prof.kg); }, [prof.kg]);
  const commitName = () => { if (name.trim() && name.trim() !== profile?.name) st.setProfile({ name }); else setName(profile?.name || ''); };
  const commitKg = (v: number | string) => { setKg(v); const n = Number(v); if (n >= 35 && n <= 250) st.setProfile({ kg: n }); };
  const [busy, setBusy] = useState<'google' | 'apple' | 'delete' | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const account = authUser && !authUser.isAnonymous ? { provider: providerLabel(authUser.providerData[0]?.providerId || ''), email: authUser.email || authUser.providerData[0]?.email || '' } : null;
  const maxV = Math.max(1, ...stats.chart.map(c => c.v));
  const lvl = { pct: Math.min(100, Math.round((stats.xp - stats.lvlStart) / (stats.lvlNext - stats.lvlStart) * 100)) + '%', inLevel: stats.xp - stats.lvlStart, need: stats.lvlNext - stats.lvlStart };
  const pubSub = (p: typeof pubs[number]) => { const n = p.memberIds.length; return `${n} ${pl(n, 'štamgast', 'štamgasti', 'štamgastů')} · ${p.ownerId === uid ? 'tvoje putyka' : 'jsi člen'}`; };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: 16, display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 14, alignItems: 'center' }}>
        <span style={S.gradCircle(64, 24)}>{initials(profile?.name || 'Ty')}</span>
        <label style={{ ...S.label, gap: 5 }}>Přezdívka u pípy
          <input value={name} onChange={e => setName(e.target.value)} onBlur={commitName} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} maxLength={24} style={{ ...S.input, minHeight: 46, borderRadius: 12, fontSize: 16 }} />
        </label>
      </div>

      <button type="button" onClick={() => st.goTab('game')} style={{ ...S.card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
        <span style={S.gradCircle(48, 20)}>{stats.level}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}><span style={{ fontWeight: 800, fontSize: 15 }}>{stats.title}</span><span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{lvl.inLevel} / {lvl.need} XP</span></span>
          <span style={S.progress(8)}><span style={S.progressFill(lvl.pct)} /></span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>🔥 {stats.streak} dní v řadě · tenhle týden {stats.week} piv</span>
        </span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        {[{ label: 'Piv celkem', value: String(stats.totalBeers) }, { label: 'Litrů celkem', value: n2(stats.liters, 1) }, { label: 'Celkem XP', value: stats.xp.toLocaleString('cs-CZ') }, { label: 'Odznaky', value: `${stats.badgeCount}/${BADGES.length}` }].map(s => (
          <div key={s.label} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={S.kicker}>{s.label}</span>
            <span style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.05 }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card20, gap: 16 }}>
        <div style={S.col(3)}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>🧍 Profil pijana</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Z toho se počítá odhad promile a kdy vystřízlivíš.</span>
        </div>
        <div style={S.col(6)}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Váha</span>
          <Stepper value={kg} onChange={commitKg} />
        </div>
        <div style={S.col(6)}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Pohlaví</span>
          <Segment value={prof.sex} options={[{ id: 'm', label: 'Chlap' }, { id: 'f', label: 'Ženská' }]} onChange={sex => st.setProfile({ sex })} />
        </div>
        <div style={S.col(6)}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Jak rychle to z tebe vyprchá</span>
          <Segment value={prof.met} options={(['fast', 'normal', 'slow'] as const).map(id => ({ id, label: MET[id].label, sub: `−${n2(MET[id].b, 2)} ‰/h` }))} onChange={met => st.setProfile({ met })} />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{(MET[prof.met] || MET.normal).desc}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Je to jen hospodský odhad podle Widmarkova vzorce. Skutečná hladina se může dost lišit a za volant podle toho fakt nesedej.</p>
      </div>

      <div style={S.card20}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>📊 Posledních 7 dní</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8, alignItems: 'end', height: 140 }}>
          {stats.chart.map((c, i) => (
            <div key={c.k} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, height: '100%' }}>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{c.v}</span>
              <div style={{ width: '100%', borderRadius: '8px 8px 3px 3px', transition: 'height .4s', background: i === 6 ? 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))' : 'var(--bar)', height: c.v ? Math.max(6, c.v / maxV * 100 * 0.78) + '%' : 4 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 }}>
          {stats.chart.map(c => <span key={c.k} style={{ fontSize: 11, textAlign: 'center', color: 'var(--muted)' }}>{new Date(c.k).toLocaleDateString('cs-CZ', { weekday: 'short' })}</span>)}
        </div>
      </div>

      <div style={S.card20}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>🔐 Zamkni si účet</span>
        {!account ? (
          <>
            <span className="pretty" style={{ fontSize: 13, color: 'var(--muted)' }}>Teď jsi tu anonymně, jen na tomhle telefonu. Zamkni si účet, ať o čárky nepřijdeš při výměně mobilu. Všechno zůstane.</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
              <button type="button" disabled={!!busy} onClick={() => { setBusy('google'); void st.loginGoogle().finally(() => setBusy(null)); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card-2)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{busy === 'google' ? <Spinner /> : <><GoogleLogo />Google</>}</button>
              <button type="button" disabled={!!busy} onClick={() => { setBusy('apple'); void st.loginApple().finally(() => setBusy(null)); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card-2)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{busy === 'apple' ? <Spinner /> : <><AppleLogo />Apple</>}</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 14, background: 'var(--ok-tint)', border: '1px solid var(--ok)' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ok)' }}>✓ Zamčeno přes {account.provider}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.email}</span>
            </span>
            <button type="button" onClick={() => void st.logout()} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Odhlásit</button>
          </div>
        )}
      </div>

      <div style={{ ...S.card20, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>🏚️ Moje putyky</span>
          <button type="button" onClick={() => st.openPs('menu')} style={S.outline}>+ Nová</button>
        </div>
        {pubs.map(p => (
          <button key={p.id} type="button" onClick={() => st.openPs('detail', { pubId: p.id })} style={{ display: 'grid', gridTemplateColumns: '40px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: 'var(--card-2)', border: 0, font: 'inherit', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{p.emoji}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{pubSub(p)}</span>
            </span>
            <span style={{ padding: '3px 9px', borderRadius: 8, background: 'var(--amber-tint)', color: 'var(--amber-text)', fontSize: 12, fontWeight: 800, letterSpacing: '.04em' }}>{p.code}</span>
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Hlavní lokál je pro všechny a zůstáváš v něm vždycky.</span>
      </div>

      <div style={{ ...S.card20, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>👥 Účty pro kámoše</span>
          <button type="button" onClick={() => st.openPs('invite')} style={S.outline}>+ Založit</button>
        </div>
        <span className="pretty" style={{ fontSize: 13, color: 'var(--muted)' }}>Pro líný kamarády. Vyplníš jim profil, pošleš odkaz a oni jen kliknou „To jsem já“.</span>
        {invites.map(i => (
          <button key={i.code} type="button" onClick={() => st.openPs('inviteDone', { done: i })} style={{ display: 'grid', gridTemplateColumns: '36px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: 'var(--card-2)', border: 0, font: 'inherit', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--amber)', color: 'var(--on-amber)', fontWeight: 800, fontSize: 13 }}>{initials(i.name)}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{i.name}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{i.kg} kg · {i.sex === 'f' ? 'ženská' : 'chlap'} · {i.code}</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: i.claimedBy ? 'var(--ok)' : 'var(--amber-text)', whiteSpace: 'nowrap' }}>{i.claimedBy ? 'Převzato ✓' : 'Čeká'}</span>
          </button>
        ))}
      </div>

      <div style={{ ...S.card20, gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 17 }}>🌗 Vzhled</span>
        <Segment value={theme} options={[{ id: 'dark', label: 'Tmavý' }, { id: 'light', label: 'Světlý' }]} onChange={setTheme} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13, padding: '6px 0', flexWrap: 'wrap' }}>
        {!confirmDel ? (
          <button type="button" onClick={() => setConfirmDel(true)} style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--danger)', font: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Smazat účet</button>
        ) : (
          <>
            <span style={{ color: 'var(--muted)' }}>Fakt smazat účet i všechny čárky?</span>
            <button type="button" disabled={busy === 'delete'} onClick={() => { setBusy('delete'); void st.deleteAccount().finally(() => { setBusy(null); setConfirmDel(false); }); }} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, background: 'var(--danger-tint)', border: '1px solid var(--danger-line)', color: 'var(--danger)', font: 'inherit', fontWeight: 800, cursor: 'pointer' }}>{busy === 'delete' ? <Spinner size={14} /> : 'Jo, smazat'}</button>
            <button type="button" onClick={() => setConfirmDel(false)} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--text)', font: 'inherit', fontWeight: 800, cursor: 'pointer' }}>Ne</button>
          </>
        )}
      </div>
    </section>
  );
}
