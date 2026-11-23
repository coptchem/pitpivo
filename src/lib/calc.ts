import { BADGES, CATS, MET, TITLES, type CatKey, type Met, type Sex } from './catalog';

export const DAY = 864e5;
export const sod = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const prevDay = (k: number) => sod(k - DAY / 2);
export const dayKey = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export interface Drink { id: string; cat: CatKey; v: string; ml: number | null; ts: number }
export interface Profile { kg: number; sex: Sex; met: Met }
export interface DrinkInfo {
  cat: CatKey; v: { id: string; name: string; abv: number; ml?: number; emoji?: string }; ml: number; abv: number; beer: 0 | 1; xp: number;
  emoji: string; name: string; key: string; alco: boolean; label: string;
}

export const kgOf = (p: { kg: number | string }) => Math.min(250, Math.max(35, Number(p.kg) || 80));
export const rOf = (p: { sex: Sex }) => (p.sex === 'f' ? 0.55 : 0.68);
export const betaOf = (met: Met | undefined) => (MET[met || 'normal'] || MET.normal).b;
export const levelOf = (xp: number) => { let L = 1; while (xp >= 50 * (L + 1) * L) L++; return L; };
export const titleOf = (L: number) => TITLES[Math.min(L - 1, TITLES.length - 1)];

export function info(d: { cat: CatKey; v: string; ml?: number | null }): DrinkInfo | null {
  const c = CATS[d.cat]; if (!c) return null;
  const v = c.vars.find(x => x.id === d.v) || c.vars[0];
  const ml = d.ml || v.ml || c.ml;
  return {
    cat: d.cat, v, ml, abv: v.abv, beer: c.beer, xp: c.xp, emoji: v.emoji || c.emoji,
    name: c.sizes ? `${v.name} · ${ml >= 40 ? 'velkej' : 'malej'}` : v.name, key: d.cat + ':' + v.id, alco: v.abv >= 0.01, label: c.label,
  };
}

export interface RecentDrink { ts: number; ml: number; abv: number }
/** Widmark: BAC v ‰ z posledních 36 h; mezi drinky i od posledního do teď odečítá β ‰/h, nikdy pod 0. */
export function bacFromRecent(recent: RecentDrink[], prof: Profile, now: number) {
  const beta = betaOf(prof.met), wr = kgOf(prof) * rOf(prof);
  const list = recent.filter(d => d.ts > now - 36 * 36e5 && d.ts <= now && d.abv > 0).sort((a, b) => a.ts - b.ts);
  let bac = 0, t: number | null = null;
  for (const d of list) { if (t != null) bac = Math.max(0, bac - beta * (d.ts - t) / 36e5); bac += d.ml * d.abv * 0.789 / wr; t = d.ts; }
  if (t != null) bac = Math.max(0, bac - beta * (now - t) / 36e5);
  return { bac, soberMs: bac / beta * 36e5 };
}
export function recentOf(drinks: Drink[], now: number): RecentDrink[] {
  return drinks.filter(d => d.ts > now - 36 * 36e5).map(d => { const i = info(d); return i && i.abv > 0 ? { ts: d.ts, ml: i.ml, abv: i.abv } : null; }).filter((x): x is RecentDrink => !!x);
}
export const bacOf = (drinks: Drink[], prof: Profile, now: number) => bacFromRecent(recentOf(drinks, now), prof, now);

export interface DayAgg { beers: number; nealko: number; alco: number; all: number; liters: number; xp: number }
export interface Stats {
  totalBeers: number; liters: number; owl: boolean; distinct: number; today: DayAgg; week: number; streak: number;
  chart: { k: number; v: number }[]; maxDayBeers: number; maxDayNealko: number;
  badges: { id: string; name: string; glyph: string; desc: string; cur: number; goal: number; done: boolean }[];
  badgeCount: number; waterGoal: number; ch1: boolean; ch2: boolean; xp: number; level: number; title: string; lvlStart: number; lvlNext: number;
}
const emptyDay = (): DayAgg => ({ beers: 0, nealko: 0, alco: 0, all: 0, liters: 0, xp: 0 });

/**
 * Statistiky z mých zápisů. `cut` = čas zavření dnešního kola (0 = žádné): dnešní zápisy do `cut` včetně se počítají
 * do historie (celkem, XP…), ale ne do „dneska“.
 */
export function computeStats(drinks: Drink[], cut: number, now = Date.now()): Stats {
  const t = sod(now), days: Record<number, DayAgg> = {}, types = new Set<string>();
  let totalBeers = 0, liters = 0, xp = 0, owl = false;
  for (const d of drinks) {
    const i = info(d); if (!i) continue; const k = sod(d.ts);
    if (k === t && d.ts <= cut) { totalBeers += i.beer; liters += i.beer ? i.ml / 1000 : 0; xp += i.xp; types.add(i.key); continue; }
    const o = days[k] || (days[k] = emptyDay());
    o.beers += i.beer; o.nealko += i.cat === 'nealko' ? 1 : 0; o.alco += i.alco ? 1 : 0; o.all++; o.liters += i.beer ? i.ml / 1000 : 0; o.xp += i.xp;
    totalBeers += i.beer; liters += i.beer ? i.ml / 1000 : 0; xp += i.xp; types.add(i.key);
    if (i.alco && new Date(d.ts).getHours() < 4) owl = true;
  }
  const today = days[t] || emptyDay();
  let week = 0, k = t; const chart: { k: number; v: number }[] = [];
  for (let i = 0; i < 7; i++) { const v = (days[k] || {}).beers || 0; chart.unshift({ k, v }); week += v; k = prevDay(k); }
  let streak = 0; k = t; if (!days[k]) k = prevDay(k); while (days[k] && days[k].all) { streak++; k = prevDay(k); }
  const vals = Object.values(days);
  const base = { totalBeers, liters, owl, distinct: types.size, today, week, streak, chart,
    maxDayBeers: Math.max(0, ...vals.map(v => v.beers)), maxDayNealko: Math.max(0, ...vals.map(v => v.nealko)) };
  const badges = BADGES.map(b => { const [c, g] = b.f(base); return { id: b.id, name: b.name, glyph: b.glyph, desc: b.desc, cur: Math.min(c, g), goal: g, done: c >= g }; });
  const badgeCount = badges.filter(b => b.done).length;
  const waterGoal = Math.max(1, Math.floor(today.beers / 3));
  const ch1 = week >= 15, ch2 = today.beers >= 3 && today.nealko >= waterGoal;
  xp += badgeCount * 50 + (ch1 ? 150 : 0) + (ch2 ? 60 : 0);
  const level = levelOf(xp);
  return { ...base, badges, badgeCount, waterGoal, ch1, ch2, xp, level, title: titleOf(level), lvlStart: 50 * level * (level - 1), lvlNext: 50 * (level + 1) * level };
}

/** Dnešní zápisy v aktuálním kole, seřazené vzestupně. */
export function todayDrinks(drinks: Drink[], cut: number, now = Date.now()) {
  const t0 = sod(now);
  return drinks.filter(d => d.ts >= t0 && d.ts > cut && d.ts <= now)
    .map(d => ({ d, i: info(d)! })).filter(x => !!x.i).sort((a, b) => a.d.ts - b.d.ts);
}

/** Promile v čase `at` (poslední alkoholický drink) + rychlost odbourávání; ostatní z toho dopočítají aktuální stav. */
export interface PublicBac { v: number; at: number; beta: number }
export const bacNow = (b: PublicBac | null | undefined, now: number) => (b ? Math.max(0, b.v - b.beta * Math.max(0, now - b.at) / 36e5) : 0);

/**
 * Veřejný agregát pro žebříček — počítá ho Cloud Function (users/{uid}.stats), klient ho jen čte.
 * Neobsahuje váhu, pohlaví ani časovou osu jednotlivých drinků.
 */
export interface PublicStats {
  dayKey: string; today: number; shots: number; nealko: number; liters: number; firstAlcoAt: number | null; lastAt: number | null;
  week: number; total: number; xp: number; cut: number; bac: PublicBac | null;
}
export function publicStats(drinks: Drink[], cut: number, prof: Profile, now = Date.now()): PublicStats {
  const s = computeStats(drinks, cut, now), tl = todayDrinks(drinks, cut, now);
  const firstA = tl.find(x => x.i.alco);
  const recent = recentOf(drinks, now).filter(d => d.ts <= now && d.abv > 0);
  const lastAlco = recent.length ? Math.max(...recent.map(d => d.ts)) : 0;
  const bac = lastAlco ? { v: Math.round(bacFromRecent(recent, prof, lastAlco).bac * 1000) / 1000, at: lastAlco, beta: betaOf(prof.met) } : null;
  return {
    dayKey: dayKey(now), today: s.today.beers, shots: tl.filter(x => x.i.cat === 'shot').length, nealko: s.today.nealko,
    liters: Math.round(s.today.liters * 100) / 100,
    firstAlcoAt: firstA ? firstA.d.ts : null, lastAt: drinks.length ? Math.max(...drinks.map(d => d.ts)) : null,
    week: s.week, total: s.totalBeers, xp: s.xp, cut, bac: bac && bac.v > 0 ? bac : null,
  };
}

export const tempoOf = (beers: number, firstAlcoAt: number | null, now: number) =>
  firstAlcoAt ? beers / Math.max((now - firstAlcoAt) / 36e5, 0.5) : 0;

/** Hospodská matika pro zavření kola. */
export function makeQ() {
  const r = (n: number) => Math.floor(Math.random() * n); let a: number, b: number, op: string, ans: number;
  if (Math.random() < .5) { a = 2 + r(8); b = 2 + r(8); op = '+'; ans = a + b; }
  else { a = 5 + r(10); b = 1 + r(a - 1); op = '−'; ans = a - b; }
  if (Math.random() < .3) { a = 2 + r(4); b = 2 + r(5); op = '×'; ans = a * b; }
  return { text: `${a} ${op} ${b} = ?`, ans };
}
