import { useStore } from '../state/store';
import { S, Spinner } from '../components/ui';

export function EndDialog() {
  const { end, setEnd, confirmEnd, pubs, pubSel } = useStore();
  if (!end) return null;
  const pub = pubSel === 'main' ? null : pubs.find(p => p.id === pubSel) || null;
  const close = () => setEnd(null);
  const scopeOpts = [
    { id: 'pub' as const, label: pub ? pub.name : 'Putyka', sub: pub ? 'jen naše parta' : 'nejsi v žádný putyce', disabled: !pub },
    { id: 'global' as const, label: 'Hlavní lokál', sub: 'všichni · admin heslo' },
  ];
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form role="dialog" aria-modal="true" aria-label="Fakt končíme?" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); void confirmEnd(); }}
        style={{ width: '100%', maxWidth: 400, maxHeight: 'calc(100vh - 40px)', overflow: 'auto', background: 'var(--sheet)', border: '1.5px solid var(--line)', borderRadius: 26, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 20px 60px rgba(0,0,0,.45)' }}>
        <span style={{ fontSize: 40, lineHeight: 1, textAlign: 'center' }}>🛏️</span>
        <span style={{ fontWeight: 800, fontSize: 22, textAlign: 'center', lineHeight: 1.2 }}>Fakt končíme?</span>
        <span className="pretty" style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>Čárky se uloží do historie a všichni začínají od nuly. Jde to jen jednou za den.</span>
        <div style={S.segWrap(2)}>
          {scopeOpts.map(o => {
            const on = end.scope === o.id;
            return (
              <button key={o.id} type="button" onClick={() => { if (!o.disabled) setEnd({ ...end, scope: o.id, error: '', passError: false }); }} aria-pressed={on}
                style={{ ...S.seg(on, o.disabled), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 52, padding: '6px 4px' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{o.label}</span>
                <span style={{ fontSize: 11, opacity: .8 }}>{o.sub}</span>
              </button>
            );
          })}
        </div>
        {end.scope === 'global' && (
          <label style={S.label}>Heslo hospodského (admin)
            <input type="password" value={end.pass} onChange={e => setEnd({ ...end, pass: e.target.value, passError: false, error: '' })} placeholder="••••••" autoComplete="current-password"
              style={{ ...S.input, minHeight: 48, padding: '8px 14px', border: `1.5px solid ${end.passError ? 'var(--danger)' : 'var(--line)'}`, letterSpacing: '.1em' }} />
          </label>
        )}
        <span style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Nejdřív dokaž, že ještě vidíš na čísla:</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, borderRadius: 16, background: 'var(--amber-tint)', border: '1px solid var(--amber)' }}>
          <span style={{ ...S.kicker, color: 'var(--amber-text)' }}>Hospodská matika</span>
          <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: '.04em', lineHeight: 1 }}>{end.q.text}</span>
        </div>
        <input type="number" inputMode="numeric" value={end.answer} onChange={e => setEnd({ ...end, answer: e.target.value, error: '' })} placeholder="?" autoFocus
          style={{ ...S.input, minHeight: 54, padding: '8px 14px', border: `1.5px solid ${end.error && !end.passError ? 'var(--danger)' : 'var(--line)'}`, fontSize: 24, textAlign: 'center' }} />
        {end.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700, textAlign: 'center' }}>{end.error}</span>}
        <button type="submit" disabled={end.busy} style={{ ...S.primary, minHeight: 54, fontSize: 17 }}>{end.busy ? <Spinner /> : 'Zavřít kolo'}</button>
        <button type="button" onClick={close} style={{ minHeight: 44, background: 'transparent', border: 0, color: 'var(--muted)', font: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Ještě ne, dáme jedno</button>
      </form>
    </div>
  );
}
