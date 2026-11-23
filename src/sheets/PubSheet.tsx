import { useStore } from '../state/store';
import { PUB_EMOJIS, AVATARS } from '../lib/catalog';
import { APP_HOST, avatarOf, pl, word } from '../lib/format';
import { dayKey } from '../lib/calc';
import { Icon, S, Segment, Spinner } from '../components/ui';

export function PubSheet() {
  const st = useStore();
  const { ps, setPs, pubs, members, uid, profile, now } = st;
  if (!ps) return null;
  const pub = ps.pubId ? pubs.find(p => p.id === ps.pubId) || null : null;
  const owner = !!pub && pub.ownerId === uid;
  const T: Record<string, [string, string]> = {
    menu: ['Putyka', 'Kde dneska pijeme?'], create: ['Nová putyka', 'Dostaneš kód, kterej pošleš partě.'], join: ['Vstoupit do putyky', 'Zadej kód, co ti poslal kámoš.'],
    detail: [pub ? `${pub.emoji} ${pub.name}` : '', 'Kdo má kód, může dovnitř.'], invite: ['Účet pro kámoše', 'Vyplň mu to, ať nemusí nic řešit.'], inviteDone: ['Pozvánka je hotová', 'Stačí poslat odkaz.'],
  };
  if (ps.mode === 'join' && ps.name) T.join = [`Vstoupit do ${ps.emoji} ${ps.name}`, 'Zadej kód, co ti poslal hospodský nebo někdo z party.'];
  const [title, hint] = T[ps.mode] || ['', ''];
  const close = () => setPs(null);
  const tk = dayKey(now);
  const memberList = pub ? [
    { uid: uid || 'me', emoji: '🍺', name: `${profile?.name || 'Ty'} (ty)`, sub: owner ? 'hospodský' : '', kickable: false },
    ...pub.memberIds.filter(id => id !== uid).map(id => {
      const m = members.find(x => x.uid === id);
      const today = m?.stats && m.stats.dayKey === tk ? m.stats.today : 0;
      return { uid: id, emoji: m?.emoji || avatarOf(id, AVATARS), name: m?.name || 'Štamgast', sub: `${today} ${word(today)} dnes`, kickable: owner };
    }),
  ] : [];
  const n = pub ? pub.memberIds.length : 0;
  const link = ps.mode === 'inviteDone' ? `https://${APP_HOST}/j/${ps.done?.code || ''}` : `https://${APP_HOST}/p/${pub?.code || ''}`;

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', background: 'var(--sheet)', border: '1px solid var(--line)', borderBottom: 0, borderRadius: '26px 26px 0 0', padding: '10px 16px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 60px rgba(0,0,0,.45)' }}>
        <span style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 9, background: 'var(--line)' }} />
        <div style={S.row(10)}>
          <span style={{ fontWeight: 800, fontSize: 21, marginRight: 'auto' }}>{title}</span>
          <button type="button" onClick={close} aria-label="Zavřít" style={S.roundBtn}>{Icon.x(16)}</button>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)', marginTop: -6 }}>{hint}</span>

        {ps.mode === 'menu' && (
          <>
            <button type="button" onClick={() => setPs({ ...ps, mode: 'create' })} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: 'var(--card)', border: '1.5px solid var(--line)', font: 'inherit', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>🏚️</span>
              <span style={S.col(3)}><span style={{ fontWeight: 800, fontSize: 16 }}>Založit putyku</span><span style={{ fontSize: 13, color: 'var(--muted)' }}>Vlastní místnost pro tvoji partu. Dostaneš kód na pozvání.</span></span>
            </button>
            <button type="button" onClick={() => setPs({ ...ps, mode: 'join' })} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: 'var(--card)', border: '1.5px solid var(--line)', font: 'inherit', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>🔑</span>
              <span style={S.col(3)}><span style={{ fontWeight: 800, fontSize: 16 }}>Vstoupit kódem</span><span style={{ fontSize: 13, color: 'var(--muted)' }}>Kámoš ti poslal kód nebo odkaz? Sem s ním.</span></span>
            </button>
          </>
        )}

        {ps.mode === 'create' && (
          <form onSubmit={e => { e.preventDefault(); void st.createPub(); }} style={S.col(14)}>
            <label style={S.label}>Jak se bude putyka jmenovat?
              <input value={ps.name} onChange={e => setPs({ ...ps, name: e.target.value })} maxLength={28} placeholder="U Baráka" style={S.input} />
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PUB_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setPs({ ...ps, emoji: e })} aria-pressed={ps.emoji === e} style={{ width: 48, height: 48, borderRadius: 14, fontSize: 24, cursor: 'pointer', background: ps.emoji === e ? 'var(--amber-tint)' : 'var(--card)', border: `1.5px solid ${ps.emoji === e ? 'var(--amber)' : 'var(--line-soft)'}` }}>{e}</button>
              ))}
            </div>
            {ps.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{ps.error}</span>}
            <button type="submit" disabled={ps.busy} style={{ ...S.primary, opacity: ps.name.trim() ? 1 : .5 }}>{ps.busy ? <Spinner /> : 'Založit putyku'}</button>
          </form>
        )}

        {ps.mode === 'join' && (
          <form onSubmit={e => { e.preventDefault(); void st.joinPub(); }} style={S.col(14)}>
            <label style={S.label}>Kód putyky
              <input value={ps.code} onChange={e => setPs({ ...ps, code: e.target.value.toUpperCase(), error: '' })} placeholder="SKLEP-9Q" autoCapitalize="characters" autoComplete="off" style={{ ...S.input, letterSpacing: '.06em', textTransform: 'uppercase' }} />
            </label>
            {ps.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{ps.error}</span>}
            <button type="submit" disabled={ps.busy} style={S.primary}>{ps.busy ? <Spinner /> : 'Vstoupit'}</button>
          </form>
        )}

        {ps.mode === 'detail' && pub && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 16, background: 'var(--amber-tint)', border: '1px solid var(--amber)' }}>
              <span style={{ ...S.kicker, color: 'var(--amber-text)' }}>Kód na pozvání</span>
              <span style={{ fontWeight: 800, fontSize: 32, letterSpacing: '.08em', lineHeight: 1 }}>{pub.code}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{APP_HOST}/p/{pub.code}</span>
              <button type="button" onClick={() => st.copy(link)} style={{ alignSelf: 'flex-start', minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: 'var(--amber)', color: 'var(--on-amber)', font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Kopírovat odkaz</button>
            </div>
            <span style={S.kicker12}>{n} {pl(n, 'štamgast', 'štamgasti', 'štamgastů')}</span>
            <div style={S.col(4)}>
              {memberList.map(m => (
                <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderTop: '1px solid var(--line-soft)', fontSize: 14, fontWeight: 700 }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>{m.name}<span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{m.sub}</span>
                  {m.kickable && <button type="button" onClick={() => void st.kickMember(m.uid, m.name)} style={{ minHeight: 32, padding: '0 10px', borderRadius: 9, background: 'var(--danger-tint)', border: '1px solid var(--danger-line)', color: 'var(--danger)', font: 'inherit', fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Vyhodit</button>}
                </div>
              ))}
            </div>
            {ps.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{ps.error}</span>}
            <button type="button" disabled={ps.busy} onClick={() => void st.leavePub()} style={{ minHeight: 48, borderRadius: 14, background: 'var(--danger-tint)', border: '1px solid var(--danger-line)', color: 'var(--danger)', font: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{ps.busy ? <Spinner /> : owner ? 'Zrušit putyku' : 'Odejít z putyky'}</button>
          </>
        )}
        {ps.mode === 'detail' && !pub && <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tahle putyka už neexistuje.</span>}

        {ps.mode === 'invite' && (
          <form onSubmit={e => { e.preventDefault(); void st.createInvite(); }} style={S.col(14)}>
            <label style={S.label}>Přezdívka kámoše
              <input value={ps.inv.name} onChange={e => setPs({ ...ps, inv: { ...ps.inv, name: e.target.value } })} maxLength={24} placeholder="Kotel" style={S.input} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
              <label style={S.label}>Váha
                <div style={{ position: 'relative' }}>
                  <input type="number" inputMode="numeric" min={35} max={250} value={ps.inv.kg} onChange={e => setPs({ ...ps, inv: { ...ps.inv, kg: e.target.value } })} style={{ ...S.input, minHeight: 48, padding: '8px 40px 8px 14px' }} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--muted)', pointerEvents: 'none' }}>kg</span>
                </div>
              </label>
              <div style={S.label}>Pohlaví
                <Segment value={ps.inv.sex} options={[{ id: 'm', label: 'Chlap' }, { id: 'f', label: 'Ženská' }]} onChange={sex => setPs({ ...ps, inv: { ...ps.inv, sex } })} />
              </div>
            </div>
            {ps.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{ps.error}</span>}
            <button type="submit" disabled={ps.busy} style={{ ...S.primary, opacity: ps.inv.name.trim() ? 1 : .5 }}>{ps.busy ? <Spinner /> : 'Vytvořit pozvánku'}</button>
          </form>
        )}

        {ps.mode === 'inviteDone' && ps.done && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 16, background: 'var(--amber-tint)', border: '1px solid var(--amber)' }}>
              <span style={{ ...S.kicker, color: 'var(--amber-text)' }}>Pozvánka pro {ps.done.name}</span>
              <span style={{ fontWeight: 800, fontSize: 32, letterSpacing: '.08em', lineHeight: 1 }}>{ps.done.code}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{APP_HOST}/j/{ps.done.code}</span>
              <button type="button" onClick={() => st.copy(link)} style={{ alignSelf: 'flex-start', minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: 'var(--amber)', color: 'var(--on-amber)', font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Kopírovat odkaz</button>
            </div>
            <span className="pretty" style={{ fontSize: 13, color: 'var(--muted)' }}>Pošli to kámošovi. Otevře odkaz, klikne „To jsem já“ a může pít. Heslo řešit nemusí, účet si může zamknout později sám.</span>
            <button type="button" onClick={close} style={{ minHeight: 52, borderRadius: 16, border: 0, background: 'var(--card-2)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Hotovo</button>
          </>
        )}
      </div>
    </div>
  );
}
