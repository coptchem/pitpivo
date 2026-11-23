import { useStore } from '../state/store';
import { CATS, CTA, MET, ORDER, QUOTES } from '../lib/catalog';
import { bacOf, info, kgOf, tempoOf, todayDrinks } from '../lib/calc';
import { fmtDur, hhmm, n2, pct1, vol, word } from '../lib/format';
import { CatIcon, Icon, S } from '../components/ui';

export function Pipa() {
  const st = useStore();
  const { profile, drinks, cut, now, stats, def, quote, lastAdd, activeSession, sessionOver, sessionNote, setSessionNote, toasts } = st;
  const t = toasts[0];
  const prof = { kg: profile?.kg ?? 80, sex: profile?.sex ?? 'm', met: profile?.met ?? 'normal' } as const;
  const B = bacOf(drinks, prof, now);
  const defI = info(def)!;
  const todayList = todayDrinks(drinks, cut, now);
  const firstA = todayList.find(x => x.i.alco);
  const perH = tempoOf(stats.today.beers, firstA ? firstA.d.ts : null, now);
  const cnt: Partial<Record<string, number>> = {};
  todayList.forEach(({ i }) => { if (!i.beer) cnt[i.cat] = (cnt[i.cat] || 0) + 1; });
  const otherBits = Object.keys(cnt).map(k => `${cnt[k]}× ${CATS[k as keyof typeof CATS].label.toLowerCase()}`);
  const q = quote ? QUOTES[quote.i] : null;
  const scopeLabel = activeSession ? (activeSession.scope === 'global' ? 'Hlavní lokál' : activeSession.pubName) : '';
  const noteOpen = sessionOver && sessionNote && !!activeSession;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {q && (
        <div key={'q' + quote!.key} style={{ position: 'relative', marginBottom: -2, animation: 'pp-bubble 420ms cubic-bezier(.2,.9,.3,1.3) both' }}>
          <span style={{ position: 'absolute', bottom: -7, left: '50%', width: 14, height: 14, marginLeft: -7, transform: 'rotate(45deg)', background: 'var(--card)', borderRight: '1.5px solid var(--amber)', borderBottom: '1.5px solid var(--amber)', zIndex: 1 }} />
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--amber)', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="pretty" style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.35 }}>„{q.t}“</div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--amber-text)' }}>— {q.who} ({q.src})</div>
          </div>
        </div>
      )}
      {noteOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 18, background: 'var(--card)', border: '1.5px solid var(--line)' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>🔄 Nové kolo běží</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Minulé kolo: {activeSession!.closed.beers} {word(activeSession!.closed.beers)}, {n2(activeSession!.closed.liters, 1)} l · zavřel {activeSession!.byName} v {hhmm(activeSession!.end)}</span>
          </span>
          <button type="button" onClick={() => setSessionNote(false)} aria-label="Skrýt" style={{ ...S.roundBtn, width: 32, height: 32 }}>{Icon.x(14)}</button>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <button type="button" className="cta" onClick={() => st.addAt(Date.now(), def)}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '22px 16px 20px', borderRadius: 26, border: 0, background: 'linear-gradient(180deg,var(--amber-hi) 0%,var(--amber) 50%,var(--amber-lo) 100%)', boxShadow: '0 14px 40px var(--glow)', color: 'var(--on-amber)', font: 'inherit', cursor: 'pointer', transition: 'transform .12s' }}>
          <CatIcon k={def.cat} size={56} />
          <span style={{ fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: '.01em', textTransform: 'uppercase' }}>{CTA[def.cat] || CTA.big}</span>
          <span style={{ fontSize: 14, fontWeight: 600, opacity: .82 }}>{defI.name} ({vol(defI.ml)} · {pct1(defI.abv)})</span>
        </button>
        {(t || lastAdd) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none', zIndex: 2 }}>
            {t && (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'calc(100% - 32px)', padding: '8px 14px 8px 8px', borderRadius: 18, background: 'var(--card)', border: '1.5px solid var(--amber)', color: 'var(--text)', boxShadow: '0 12px 36px rgba(0,0,0,.35)', animation: 'pp-toast 380ms cubic-bezier(.2,.9,.3,1.2) both' }}>
                <span style={S.gradCircle(40, 16)}>{t.glyph}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--amber-text)' }}>{t.kicker}</span>
                  <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>{t.title}</span>
                </span>
              </div>
            )}
            {lastAdd && (
              <span key={'x' + lastAdd.id} style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--card)', border: '1.5px solid var(--amber)', fontWeight: 800, fontSize: 17, color: 'var(--amber-text)', animation: 'pp-float 1400ms ease-out forwards' }}>+{lastAdd.xp} XP</span>
            )}
          </div>
        )}
      </div>
      <div style={S.col(8)}>
        <span style={S.kicker12}>Dát si něco jinýho</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8 }}>
          {ORDER.map(k => {
            const on = def.cat === k;
            return (
              <button key={k} type="button" onClick={() => st.setSheet({ cat: k, v: on ? def.v : CATS[k].def, ml: k === 'shot' ? ((def.cat === 'shot' && def.ml) || 40) : null })}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 2px 9px', borderRadius: 16, font: 'inherit', color: 'var(--text)', cursor: 'pointer', background: on ? 'var(--amber-tint)' : 'var(--card)', border: `1.5px solid ${on ? 'var(--amber)' : 'var(--line-soft)'}` }}>
                <CatIcon k={k} size={30} />
                <span style={{ fontWeight: 800, fontSize: 13 }}>{CATS[k].label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{CATS[k].sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
        <div style={{ ...S.card, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={S.kicker}>Dnes vypito</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span key={'n' + (lastAdd ? lastAdd.id : 0)} style={{ ...S.big34, display: 'inline-block', transformOrigin: 'left bottom', animation: lastAdd ? 'pp-pop 380ms cubic-bezier(.2,.9,.3,1.5)' : 'none' }}>{stats.today.alco}</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--amber-text)' }}>ks</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{stats.today.beers ? `${stats.today.beers}× pivo (${n2(stats.today.liters, 1)} l)` : 'Zatím ani kapka'}</span>
          {otherBits.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{otherBits.join(' · ')}</span>}
        </div>
        <div style={{ ...S.card, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={S.kicker}>Piv za hodinu / minutu</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={S.big34}>{n2(perH, 1)}</span><span style={{ fontWeight: 800, fontSize: 15, color: 'var(--amber-text)' }}>piv/h</span></span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--amber-text)' }}>{n2(perH / 60, 2)} piv/min</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{firstA ? `Piješ už ${fmtDur(now - firstA.d.ts)}` : 'Ještě sis nedal'}</span>
        </div>
        <button type="button" onClick={() => st.goTab('profile')} style={{ ...S.card, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, minWidth: 0, font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <span style={S.kicker}>Odhad promile</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}><span style={S.big34}>{n2(B.bac, 2)}</span><span style={{ fontWeight: 800, fontSize: 16, color: 'var(--amber-text)' }}>‰</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{kgOf(prof)} kg · {prof.sex === 'f' ? 'Žena' : 'Muž'} · {(MET[prof.met] || MET.normal).label.toLowerCase()} ✏️</span>
        </button>
        <div style={{ ...S.card, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={S.kicker}>Vystřízlivění za</span>
          <span style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1, letterSpacing: '-.02em' }}>{B.bac > 0 ? fmtDur(B.soberMs) : 'Střízlivej'}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{B.bac > 0 ? `Cca v ${hhmm(now + B.soberMs)}` : 'Čistej jak sklo'}</span>
        </div>
      </div>

      <div style={{ ...S.card, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16, minWidth: 0 }}>📋 Moje čárky ({todayList.length}) <span style={{ color: 'var(--muted)', fontWeight: 600 }}>/</span>
            <button type="button" onClick={() => st.setListek(true)} style={{ padding: 0, background: 'transparent', border: 0, color: 'var(--amber-text)', font: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>LÍSTEK</button>
          </span>
          <button type="button" onClick={() => st.setForgotOpen(!st.forgotOpen)} style={S.outline}>{st.forgotOpen ? 'Zavřít' : '+ Zapomenutý pivo'}</button>
        </div>
        {st.forgotOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'end', padding: 12, borderRadius: 14, background: 'var(--amber-tint)' }}>
            <label style={{ ...S.label, gap: 5 }}>Kdy jsi do sebe hodil {defI.name.toLowerCase()}?
              <input type="time" value={st.forgotTime} onChange={e => st.setForgotTime(e.target.value)} style={{ minHeight: 44, padding: '8px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', font: 'inherit', fontSize: 16, fontWeight: 800 }} />
            </label>
            <button type="button" onClick={st.addForgot} style={{ minHeight: 44, padding: '0 18px', borderRadius: 12, border: 0, background: 'var(--amber)', color: 'var(--on-amber)', font: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Zapsat</button>
          </div>
        )}
        {todayList.length === 0 && <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: 14 }}>Zatím suchej jak Sahara. Dej si první!</p>}
        {todayList.slice().reverse().map(({ d, i }) => (
          <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '10px 10px 10px 12px', borderRadius: 14, background: 'var(--card-2)' }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{i.emoji}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{i.name} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>({vol(i.ml)} · {pct1(i.abv)})</span></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>{Icon.clock(12)}Vypito v {hhmm(d.ts)}</span>
            </span>
            <button type="button" onClick={() => st.deleteDrink(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 10, background: 'var(--danger-tint)', border: '1px solid var(--danger-line)', color: 'var(--danger)', font: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {Icon.x(13, 3)}Smazat
            </button>
          </div>
        ))}
      </div>

        {!sessionOver ? (
          <button type="button" onClick={st.openEnd} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: 56, padding: 10, borderRadius: 16, background: 'var(--card)', border: '1.5px solid var(--line)', color: 'var(--text)', font: 'inherit', cursor: 'pointer' }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>🛏️ Končím s pivkem</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Zavře kolo pro celou partu a hned začne nové. Jen jednou za den.</span>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: 56, padding: 10, borderRadius: 16, background: 'var(--card-2)', border: '1.5px solid var(--line-soft)', color: 'var(--muted)', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>🛏️ Kolo už dneska zavřel {activeSession?.byName || 'někdo z party'} ({scopeLabel})</span>
            <span style={{ fontSize: 12 }}>Příště zase zítra.</span>
          </div>
        )}
    </section>
  );
}
