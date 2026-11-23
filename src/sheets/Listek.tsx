import { useRef, useState, type PointerEvent } from 'react';
import { useStore } from '../state/store';
import { CATS, LISTEK_LABEL, ORDER, type CatKey } from '../lib/catalog';
import { todayDrinks } from '../lib/calc';
import { pl } from '../lib/format';
import { Icon } from '../components/ui';

const INK = '#1e2a6b';
const HAND = { fontFamily: 'var(--font-hand)', fontWeight: 700 } as const;

/** Čárky: 4 svislé lehce roztřesené + 5. šikmý škrt (generátor z prototypu). */
function TallySvg({ n, k }: { n: number; k: string }) {
  const W = 14, w = n * W + (n === 5 ? 8 : 6), j = (i: number, kk: number) => ((i * 7 + kk * 3 + n) % 5 - 2);
  const strokes = [];
  for (let i = 0; i < Math.min(n, 4); i++) { const x = 8 + i * W; strokes.push(<path key={'s' + i} d={`M${x + j(i, 1)} 6 Q${x + 2 + j(i, 2)} 20 ${x + j(i, 3)} 36`} />); }
  if (n === 5) strokes.push(<path key="x" d={`M2 32 Q${w / 2} 24 ${w - 2} 8`} />);
  return <svg key={k} width={w} height={42} viewBox={`0 0 ${w} 42`} fill="none" stroke={INK} style={{ strokeWidth: 2.6, strokeLinecap: 'round', display: 'block' }} aria-hidden="true">{strokes}</svg>;
}

export function Listek() {
  const { listek, setListek, drinks, cut, now, def, addAt } = useStore();
  const [draw, setDraw] = useState<{ cat: CatKey; pts: [number, number][] } | null>(null);
  const rect = useRef<DOMRect | null>(null);
  if (!listek) return null;
  const todayList = todayDrinks(drinks, cut, now);
  const close = () => { setDraw(null); setListek(false); };

  const down = (cat: CatKey) => (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(); rect.current = r;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* */ }
    setDraw({ cat, pts: [[e.clientX - r.left, e.clientY - r.top]] });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = rect.current; if (!draw || !r) return;
    const p: [number, number] = [e.clientX - r.left, e.clientY - r.top], l = draw.pts[draw.pts.length - 1];
    if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 2) return;
    setDraw({ ...draw, pts: [...draw.pts, p] });
  };
  const up = () => {
    if (!draw) return;
    const a = draw.pts[0], b = draw.pts[draw.pts.length - 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    setDraw(null);
    if (len < 22) return;
    const k = draw.cat;
    addAt(Date.now(), { cat: k, v: def.cat === k ? def.v : CATS[k].def, ml: k === 'shot' ? ((def.cat === 'shot' && def.ml) || 40) : null });
  };

  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.62)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-body)' }}>
      <div role="dialog" aria-modal="true" aria-label="Lístek" onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 360, maxHeight: 'calc(100vh - 40px)', background: '#fbfaf6', color: INK, borderRadius: 3, boxShadow: '0 2px 0 #e9e6dd,0 4px 0 #dedbd2,0 6px 0 #d3d0c7,0 24px 60px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', padding: '18px 20px 16px', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(30,42,107,.55)' }}>Tahem prstu udělej čárku</span>
          <button type="button" onClick={close} aria-label="Zavřít" style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', border: 0, background: 'rgba(30,42,107,.08)', color: INK, cursor: 'pointer' }}>{Icon.x(18)}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', padding: '4px 0' }}>
          {ORDER.map(k => {
            const c = todayList.filter(x => x.i.cat === k).length;
            const groups: number[] = []; let r = c; while (r > 0) { const g = Math.min(5, r); groups.push(g); r -= g; }
            const dr = draw && draw.cat === k ? draw : null;
            return (
              <div key={k} onPointerDown={down(k)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDraw(null)}
                style={{ position: 'relative', display: 'grid', gridTemplateColumns: '92px minmax(0,1fr)', gap: 10, alignItems: 'start', minHeight: 64, padding: '6px 4px', borderRadius: 8, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'crosshair', background: dr ? 'rgba(30,42,107,.05)' : 'transparent' }}>
                <span style={{ ...HAND, fontSize: 26, lineHeight: '52px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{LISTEK_LABEL[k]}:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', alignItems: 'center', minHeight: 52, pointerEvents: 'none' }}>
                  {groups.map((g, i) => <TallySvg key={k + i} n={g} k={k + i} />)}
                </div>
                {dr && dr.pts.length > 1 && (
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }} aria-hidden="true">
                    <path d={'M' + dr.pts.map(p => p[0] + ' ' + p[1]).join(' L')} fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" opacity={.85} />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          <span style={{ ...HAND, fontSize: 22, lineHeight: 1.2 }}>{todayList.length ? `Celkem ${todayList.length} ${pl(todayList.length, 'čárka', 'čárky', 'čárek')}` : ''}</span>
        </div>
        <button type="button" onClick={close} style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 22px', borderRadius: 99, border: `2px solid ${INK}`, background: 'transparent', color: INK, font: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{Icon.arrowLeft(18)}Zpět</button>
      </div>
    </div>
  );
}
