import type { CSSProperties, ReactNode } from 'react';
import type { CatKey } from '../lib/catalog';

export const S = {
  card: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: 14 } as CSSProperties,
  card20: { background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 } as CSSProperties,
  kicker: { fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as CSSProperties,
  kicker12: { fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as CSSProperties,
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' } as CSSProperties,
  input: { minHeight: 50, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card-2)', color: 'var(--text)', font: 'inherit', fontSize: 18, fontWeight: 800, width: '100%' } as CSSProperties,
  primary: { minHeight: 56, borderRadius: 16, border: 0, background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', color: 'var(--on-amber)', font: 'inherit', fontWeight: 800, fontSize: 18, cursor: 'pointer', boxShadow: '0 8px 24px var(--glow)' } as CSSProperties,
  outline: { padding: '7px 12px', borderRadius: 12, background: 'transparent', border: '1.5px solid var(--amber)', color: 'var(--amber-text)', font: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' } as CSSProperties,
  segWrap: (cols: number): CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: 4, padding: 4, borderRadius: 14, background: 'var(--card-2)' }),
  seg: (on: boolean, disabled = false): CSSProperties => ({ minHeight: 42, borderRadius: 10, border: 0, font: 'inherit', fontWeight: 800, fontSize: 14, cursor: disabled ? 'default' : 'pointer', background: on ? 'var(--amber)' : 'transparent', color: disabled ? 'var(--muted)' : on ? 'var(--on-amber)' : 'var(--text)' }),
  roundBtn: { width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', border: 0, background: 'var(--card-2)', color: 'var(--text)', cursor: 'pointer' } as CSSProperties,
  big34: { fontWeight: 800, fontSize: 34, lineHeight: 1, letterSpacing: '-.02em' } as CSSProperties,
  progress: (h: number): CSSProperties => ({ display: 'block', height: h, borderRadius: 99, background: 'var(--card-2)', overflow: 'hidden' }),
  progressFill: (w: string): CSSProperties => ({ display: 'block', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,var(--amber-hi),var(--amber-lo))', transition: 'width .4s', width: w }),
  gradCircle: (size: number, fs: number): CSSProperties => ({ width: size, height: size, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', color: 'var(--on-amber)', fontWeight: 800, fontSize: fs }),
  col: (gap: number): CSSProperties => ({ display: 'flex', flexDirection: 'column', gap }),
  row: (gap: number): CSSProperties => ({ display: 'flex', alignItems: 'center', gap }),
};

export function Segment<T extends string>({ value, options, onChange, cols, disabled }: { value: T; options: { id: T; label: string; sub?: string; disabled?: boolean }[]; onChange: (v: T) => void; cols?: number; disabled?: boolean }) {
  return (
    <div style={S.segWrap(cols || options.length)}>
      {options.map(o => {
        const dis = disabled || !!o.disabled, on = value === o.id;
        return (
          <button key={o.id} type="button" onClick={() => { if (!dis) onChange(o.id); }} aria-pressed={on}
            style={o.sub ? { ...S.seg(on, dis), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 54, padding: '6px 4px' } : S.seg(on, dis)}>
            {o.sub ? <><span style={{ fontWeight: 800, fontSize: 14 }}>{o.label}</span><span style={{ fontSize: 11, opacity: .8 }}>{o.sub}</span></> : o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 35, max = 250, unit = 'kg' }: { value: number | string; onChange: (v: number | string) => void; min?: number; max?: number; unit?: string }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Number(v) || 80));
  const btn: CSSProperties = { minHeight: 48, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card-2)', color: 'var(--text)', font: 'inherit', fontWeight: 800, fontSize: 22, cursor: 'pointer' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(0,1fr) 48px', gap: 8 }}>
      <button type="button" onClick={() => onChange(clamp(Number(value) - 1))} aria-label="Ubrat" style={btn}>−</button>
      <div style={{ position: 'relative' }}>
        <input type="number" inputMode="numeric" min={min} max={max} value={value} onChange={e => onChange(e.target.value)} onBlur={() => onChange(clamp(Number(value)))}
          style={{ ...S.input, minHeight: 48, padding: '8px 44px 8px 14px', fontSize: 20 }} />
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)', pointerEvents: 'none' }}>{unit}</span>
      </div>
      <button type="button" onClick={() => onChange(clamp(Number(value) + 1))} aria-label="Přidat" style={btn}>+</button>
    </div>
  );
}

const ic = (size: number, sw = 2): CSSProperties => ({ width: size, height: size, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' });
const Svg = ({ size, sw, children }: { size: number; sw?: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={ic(size, sw)} aria-hidden="true">{children}</svg>
);
export const Icon = {
  sun: (s = 18) => <Svg size={s}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Svg>,
  moon: (s = 18) => <Svg size={s}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>,
  x: (s = 16, sw = 2.6) => <Svg size={s} sw={sw}><path d="M18 6 6 18M6 6l12 12" /></Svg>,
  clock: (s = 12) => <Svg size={s} sw={2.2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg>,
  arrowLeft: (s = 18) => <Svg size={s} sw={2.6}><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>,
  beer: (s = 22) => <Svg size={s}><path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M9 12v6" /><path d="M13 12v6" /><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" /><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" /></Svg>,
  trophy: (s = 22) => <Svg size={s}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Svg>,
  medal: (s = 22) => <Svg size={s}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></Svg>,
  user: (s = 22) => <Svg size={s}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>,
};

/** Ikony kategorií – emoji s poměrem velikostí podle prototypu, nealko = vlastní SVG PET lahve. */
export function CatIcon({ k, size }: { k: CatKey; size: number }) {
  if (k === 'nealko') return (
    <svg width={size * .8} height={size} viewBox="0 0 24 36" fill="none" stroke="currentColor" style={{ strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', color: '#3aa8e6' }} aria-hidden="true">
      <path d="M9 2h6v4H9z" fill="#3aa8e6" /><path d="M9 6c0 3-4 4-4 8v17a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V14c0-4-4-5-4-8" />
      <path d="M5 17h14M5 27h14" opacity=".6" /><path d="M7 20v4" opacity=".4" />
    </svg>
  );
  const e = { big: '🍺', small: '🍺', wine: '🍷', shot: '🥃' }[k], f = { big: 1, small: .68, wine: .92, shot: .62 }[k] || 1;
  return <span style={{ height: size, display: 'grid', placeItems: 'center', lineHeight: 1 }}><span style={{ fontSize: size * f }}>{e}</span></span>;
}

export const Spinner = ({ size = 18 }: { size?: number }) => (
  <span aria-hidden="true" style={{ width: size, height: size, borderRadius: '50%', border: '2.5px solid currentColor', borderRightColor: 'transparent', display: 'inline-block', animation: 'pp-spin .8s linear infinite' }} />
);
