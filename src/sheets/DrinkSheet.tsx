import { useStore } from '../state/store';
import { CATS } from '../lib/catalog';
import { pct0, vol } from '../lib/format';
import { Icon, S } from '../components/ui';

export function DrinkSheet() {
  const { sheet, setSheet, saveSheet } = useStore();
  if (!sheet) return null;
  const c = CATS[sheet.cat];
  return (
    <div onClick={() => setSheet(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label={c.title} onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', background: 'var(--sheet)', border: '1px solid var(--line)', borderBottom: 0, borderRadius: '26px 26px 0 0', padding: '10px 16px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 60px rgba(0,0,0,.45)' }}>
        <span style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 9, background: 'var(--line)' }} />
        <div style={S.row(10)}>
          <span style={{ fontWeight: 800, fontSize: 21, marginRight: 'auto' }}>{c.title}</span>
          <button type="button" onClick={() => setSheet(null)} aria-label="Zavřít" style={S.roundBtn}>{Icon.x(16)}</button>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)', marginTop: -6 }}>{c.hint}</span>
        {c.sizes && (
          <div style={S.segWrap(2)}>
            {([[20, 'Malej · 2 cl'], [40, 'Velkej · 4 cl']] as const).map(([ml, label]) => (
              <button key={ml} type="button" onClick={() => setSheet({ ...sheet, ml })} style={S.seg(sheet.ml === ml)}>{label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.vars.length === 3 ? 3 : 2},minmax(0,1fr))`, gap: 8 }}>
          {c.vars.map(v => {
            const on = sheet.v === v.id, ml = c.sizes ? (sheet.ml || 40) : (v.ml || c.ml);
            return (
              <button key={v.id} type="button" onClick={() => setSheet({ ...sheet, v: v.id })} aria-pressed={on}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: 12, borderRadius: 16, font: 'inherit', color: 'var(--text)', textAlign: 'left', cursor: 'pointer', background: on ? 'var(--amber-tint)' : 'var(--card)', border: `1.5px solid ${on ? 'var(--amber)' : 'var(--line-soft)'}` }}>
                <span style={{ fontSize: 26, lineHeight: 1.1 }}>{v.emoji || c.emoji}</span>
                <span style={{ position: 'absolute', top: 10, right: 10, padding: '2px 7px', borderRadius: 8, background: 'var(--amber-tint)', color: 'var(--amber-text)', fontSize: 11, fontWeight: 800 }}>{pct0(v.abv)}</span>
                <span style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>{v.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{vol(ml)}</span>
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Uložením se tahle volba nastaví na hlavní tlačítko na Pípě.</span>
        <button type="button" onClick={saveSheet} style={S.primary}>Uložit</button>
      </div>
    </div>
  );
}
