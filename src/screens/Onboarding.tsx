import { useStore } from '../state/store';
import { kgOf } from '../lib/calc';
import { initials } from '../lib/format';
import { Icon, S, Segment, Spinner, Stepper } from '../components/ui';

export function Onboarding() {
  const { theme, setTheme, ob, setOb, finishOb, obFind, obClaim } = useStore();
  const canStart = !!ob.name.trim() && !ob.busy;
  return (
    <section style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 18, padding: '28px 20px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Přepnout motiv"
          style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--card)', border: '1px solid var(--line-soft)', color: 'var(--text)', cursor: 'pointer' }}>
          {theme === 'dark' ? Icon.sun(18) : Icon.moon(18)}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
        <span style={{ width: 84, height: 84, borderRadius: 26, display: 'grid', placeItems: 'center', fontSize: 46, background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', boxShadow: '0 12px 36px var(--glow)' }}>🍺</span>
        <h1 style={{ margin: '6px 0 0', fontSize: 34, fontWeight: 800, letterSpacing: '-.02em' }}>Pit Pivo</h1>
        <p className="pretty" style={{ margin: 0, fontSize: 15, color: 'var(--muted)', maxWidth: 320 }}>Počítej piva, měř se s kámošema a sbírej odznaky. Bez registrace, bez hesla.</p>
      </div>

      {ob.step === 'form' && (
        <>
          <form onSubmit={e => { e.preventDefault(); if (canStart) { setOb({ busy: true }); void finishOb(ob.name, kgOf(ob), ob.sex).finally(() => setOb({ busy: false })); } }}
            style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={S.label}>Jak ti říkaj u pípy?
              <input value={ob.name} onChange={e => setOb({ name: e.target.value })} maxLength={24} placeholder="třeba Kopec" autoComplete="nickname" style={S.input} />
            </label>
            <div style={S.col(6)}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Váha (kvůli promile)</span>
              <Stepper value={ob.kg} onChange={kg => setOb({ kg })} />
            </div>
            <div style={S.col(6)}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Pohlaví</span>
              <Segment value={ob.sex} options={[{ id: 'm', label: 'Chlap' }, { id: 'f', label: 'Ženská' }]} onChange={sex => setOb({ sex })} />
            </div>
            <button type="submit" disabled={!canStart} style={{ ...S.primary, minHeight: 58, borderRadius: 18, fontSize: 20, boxShadow: '0 10px 30px var(--glow)', opacity: ob.name.trim() ? 1 : .5 }}>
              {ob.busy ? <Spinner /> : 'Jdu pít 🍻'}
            </button>
          </form>
          <button type="button" onClick={() => setOb({ step: 'invite', error: '', found: null })}
            style={{ minHeight: 48, borderRadius: 16, background: 'transparent', border: '1.5px solid var(--amber)', color: 'var(--amber-text)', font: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Mám pozvánku od kámoše</button>
        </>
      )}

      {ob.step === 'invite' && (
        <>
          <form onSubmit={e => { e.preventDefault(); void obFind(); }} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 22, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={S.label}>Kód z pozvánky
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8 }}>
                <input value={ob.code} onChange={e => setOb({ code: e.target.value.toUpperCase(), error: '', found: null })} placeholder="KOTEL-7F2X" autoCapitalize="characters" autoComplete="off"
                  style={{ ...S.input, letterSpacing: '.06em', textTransform: 'uppercase', minWidth: 0 }} />
                <button type="submit" disabled={ob.busy} style={{ minHeight: 50, padding: '0 18px', borderRadius: 14, border: 0, background: 'var(--amber)', color: 'var(--on-amber)', font: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{ob.busy && !ob.found ? <Spinner size={16} /> : 'Najít'}</button>
              </div>
            </label>
            {ob.error && <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>{ob.error}</span>}
            {ob.found && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, background: 'var(--amber-tint)', border: '1px solid var(--amber)' }}>
                  <span style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--amber)', color: 'var(--on-amber)', fontWeight: 800, fontSize: 20 }}>{initials(ob.found.name)}</span>
                  <span style={S.col(3)}>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{ob.found.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{ob.found.kg} kg · {ob.found.sex === 'f' ? 'ženská' : 'chlap'} · účet založil kámoš</span>
                  </span>
                </div>
                <button type="button" onClick={() => void obClaim()} disabled={ob.busy} style={S.primary}>{ob.busy ? <Spinner /> : 'To jsem já 👋'}</button>
              </>
            )}
          </form>
          <button type="button" onClick={() => setOb({ step: 'form' })} style={{ minHeight: 44, background: 'transparent', border: 0, color: 'var(--muted)', font: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Zpět, založím si vlastní</button>
        </>
      )}

      <p className="pretty" style={{ margin: 'auto 0 0', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>Účet si můžeš kdykoli zamknout přes Google nebo Apple, aby ti čárky nezmizely při výměně telefonu.</p>
    </section>
  );
}
