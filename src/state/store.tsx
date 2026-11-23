import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider, OAuthProvider, linkWithPopup, linkWithRedirect, onAuthStateChanged, signInAnonymously, signInWithCredential, signOut, type User,
} from 'firebase/auth';
import {
  collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, fns } from '../lib/firebase';
import { isOffensive, OFFENSIVE_MSG } from '../lib/profanity';
import { CATS, QUOTES, type CatKey, type Met, type Sex } from '../lib/catalog';
import { computeStats, dayKey, makeQ, sod, type Drink, type Stats, DAY } from '../lib/calc';
import type { PubDirEntry, Def, FeedEvent, Invite, InviteFound, Member, PrivateProfile, PublicUser, Pub, Range, Session, Tab, Theme, Toast, UserDoc } from '../lib/types';

const LS_THEME = 'pitpivo-theme', LS_DEF = 'pitpivo-def';

export interface SheetState { cat: CatKey; v: string; ml: number | null }
export type PsMode = 'menu' | 'create' | 'join' | 'detail' | 'invite' | 'inviteDone';
export interface PsState { mode: PsMode; name: string; emoji: string; code: string; error: string; pubId: string | null; inv: { name: string; kg: number | string; sex: Sex }; done: Invite | null; busy?: boolean }
export interface EndState { q: { text: string; ans: number }; answer: string; error: string; tries: number; scope: 'global' | 'pub'; pass: string; passError: boolean; busy?: boolean }
export interface ObState { step: 'form' | 'invite'; name: string; kg: number | string; sex: Sex; code: string; found: { name: string; kg: number; sex: Sex } | null; error: string; busy?: boolean }

export interface Store {
  // auth / data
  authUser: User | null; uid: string | null; authReady: boolean; profile: UserDoc | null; profileLoaded: boolean;
  drinks: Drink[]; pubs: Pub[]; pubDir: PubDirEntry[]; mainSession: Session | null; members: Member[]; events: FeedEvent[]; invites: Invite[];
  now: number; cut: number; activeSession: Session | null; sessionOver: boolean; stats: Stats;
  // ui
  theme: Theme; setTheme: (t: Theme) => void; tab: Tab; goTab: (t: Tab) => void; def: Def; setDef: (d: Def) => void;
  pubSel: string; setPubSel: (id: string) => void; range: Range; setRange: (r: Range) => void;
  toasts: Toast[]; toast: (t: Omit<Toast, 'id'>) => void; popToast: () => void;
  quote: { i: number; key: number } | null; lastAdd: { id: string; xp: number } | null;
  sheet: SheetState | null; setSheet: (s: SheetState | null) => void; saveSheet: () => void;
  ps: PsState | null; setPs: (p: PsState | null | ((p: PsState | null) => PsState | null)) => void; openPs: (mode: PsMode, patch?: Partial<PsState>) => void;
  end: EndState | null; setEnd: (e: EndState | null | ((e: EndState | null) => EndState | null)) => void; openEnd: () => void; confirmEnd: () => Promise<void>;
  listek: boolean; setListek: (b: boolean) => void;
  forgotOpen: boolean; setForgotOpen: (b: boolean) => void; forgotTime: string; setForgotTime: (s: string) => void; addForgot: () => void;
  sessionNote: boolean; setSessionNote: (b: boolean) => void;
  moved: Record<string, { dir: 'up' | 'down'; t: number }>; flash: { id: string; t: number } | null; setMoved: (m: Record<string, { dir: 'up' | 'down'; t: number }>) => void;
  ob: ObState; setOb: (p: Partial<ObState> | ((o: ObState) => ObState)) => void;
  pendingJoin: string | null; setPendingJoin: (c: string | null) => void;
  // actions
  addAt: (ts: number, sel: Def) => void; deleteDrink: (id: string) => void;
  setProfile: (patch: Partial<Pick<UserDoc, 'name' | 'kg' | 'sex' | 'met'>>) => void;
  finishOb: (name: string, kg: number, sex: Sex) => Promise<void>;
  obFind: () => Promise<void>; obClaim: () => Promise<void>;
  createPub: () => Promise<void>; joinPub: (code?: string) => Promise<void>; leavePub: () => Promise<void>; kickMember: (uid: string, name: string) => Promise<void>;
  createInvite: () => Promise<void>;
  loginGoogle: () => Promise<void>; loginApple: () => Promise<void>; logout: () => Promise<void>; deleteAccount: () => Promise<void>;
  copy: (text: string) => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error('no store'); return s; };

const readLS = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const writeLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const hhmm = (ts: number) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const call = <I, O>(name: string) => httpsCallable<I, O>(fns, name);
const errCode = (e: unknown) => String((e as { code?: string })?.code || '');
const errMsg = (e: unknown) => String((e as { message?: string })?.message || '');
const TOO_MANY = 'Zkoušíš to moc často. Dej si pauzu a zkus to za hodinu.';
const limited = (e: unknown) => errCode(e).includes('resource-exhausted');

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [pubDoc, setPubDoc] = useState<PublicUser | null>(null);
  const [privDoc, setPrivDoc] = useState<Partial<PrivateProfile> | null>(null);
  const profile = useMemo<UserDoc | null>(() => (pubDoc ? { ...pubDoc, ...(privDoc || {}) } : null), [pubDoc, privDoc]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [pubDir, setPubDir] = useState<PubDirEntry[]>([]);
  const [mainSession, setMainSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [evAll, setEvAll] = useState<FeedEvent[]>([]);
  const [evMine, setEvMine] = useState<FeedEvent[]>([]);
  const events = useMemo(() => {
    const m = new Map<string, FeedEvent>(); [...evAll, ...evMine].forEach(e => m.set(e.id, e));
    return [...m.values()].sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [evAll, evMine]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [now, setNow] = useState(Date.now());
  const uid = authUser?.uid ?? null;

  const [theme, setThemeState] = useState<Theme>(() => readLS<Theme | null>(LS_THEME, null) || (matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  const [tab, setTab] = useState<Tab>('count');
  const [def, setDefState] = useState<Def>(() => readLS<Def>(LS_DEF, { cat: 'big', v: '12' }));
  const [pubSel, setPubSel] = useState('main');
  const [range, setRangeState] = useState<Range>('today');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [quote, setQuote] = useState<{ i: number; key: number } | null>(null);
  const [lastAdd, setLastAdd] = useState<{ id: string; xp: number } | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [ps, setPs] = useState<PsState | null>(null);
  const [end, setEnd] = useState<EndState | null>(null);
  const [listek, setListek] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotTime, setForgotTime] = useState(hhmm(Date.now() - 30 * 6e4));
  const [sessionNote, setSessionNote] = useState(false);
  const [moved, setMoved] = useState<Record<string, { dir: 'up' | 'down'; t: number }>>({});
  const [flash, setFlash] = useState<{ id: string; t: number } | null>(null);
  const [ob, setObState] = useState<ObState>({ step: 'form', name: '', kg: 80, sex: 'm', code: '', found: null, error: '' });
  const [pendingJoin, setPendingJoin] = useState<string | null>(null);
  const lastQ = useRef<number>(-1);

  // ── theme / def persist
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); writeLS(LS_THEME, theme); document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#14100c' : '#fbf4e9'); }, [theme]);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const setDef = useCallback((d: Def) => { setDefState(d); writeLS(LS_DEF, d); }, []);
  const goTab = useCallback((t: Tab) => { setTab(t); try { window.scrollTo(0, 0); } catch { /* */ } }, []);
  const setRange = useCallback((r: Range) => { setRangeState(r); setMoved({}); }, []);

  // ── clock
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  // ── auth
  useEffect(() => onAuthStateChanged(auth, u => {
    setAuthUser(u); setAuthReady(true);
    if (!u) signInAnonymously(auth).catch(e => console.error('anon sign-in', e));
  }), []);

  // ── my profile + drinks
  useEffect(() => {
    if (!uid) { setPubDoc(null); setPrivDoc(null); setProfileLoaded(false); setDrinks([]); return; }
    setProfileLoaded(false);
    const u1 = onSnapshot(doc(db, 'users', uid), s => { setPubDoc(s.exists() ? (s.data() as PublicUser) : null); setProfileLoaded(true); }, e => { console.error(e); setProfileLoaded(true); });
    const u2 = onSnapshot(collection(db, 'users', uid, 'drinks'), s => setDrinks(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Drink, 'id'>) }))), e => console.error(e));
    const u3 = onSnapshot(doc(db, 'users', uid, 'private', 'profile'), s => setPrivDoc(s.exists() ? (s.data() as PrivateProfile) : null), e => console.error(e));
    return () => { u1(); u2(); u3(); };
  }, [uid]);
  const onboarded = !!(profile && profile.name);

  // ── pubs, main session, members, events, invites (až po onboardingu)
  useEffect(() => {
    if (!uid || !onboarded) { setPubs([]); setMembers([]); setEvAll([]); setEvMine([]); setInvites([]); setMainSession(null); return; }
    const u1 = onSnapshot(query(collection(db, 'pubs'), where('memberIds', 'array-contains', uid)), s => setPubs(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Pub, 'id'>) }))), e => console.error(e));
    const u2 = onSnapshot(doc(db, 'pubs', 'main'), s => setMainSession((s.data()?.session as Session) || null), e => console.error(e));
    const u3 = onSnapshot(collection(db, 'users'), s => setMembers(s.docs.map(d => ({ uid: d.id, ...(d.data() as UserDoc) }))), e => console.error(e));
    const evMap = (s: { docs: { id: string; data: () => unknown }[] }) => s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<FeedEvent, 'id'>) }));
    const u4 = onSnapshot(query(collection(db, 'events'), where('aud', '==', 'all'), orderBy('ts', 'desc'), limit(40)), s => setEvAll(evMap(s)), e => console.error(e));
    const u7 = onSnapshot(collection(db, 'pubDirectory'), s => setPubDir(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PubDirEntry, 'id'>) })).sort((a, b) => b.members - a.members || a.name.localeCompare(b.name, 'cs'))), e => console.error(e));
    const u6 = onSnapshot(query(collection(db, 'events'), where('members', 'array-contains', uid), orderBy('ts', 'desc'), limit(20)), s => setEvMine(evMap(s)), e => console.error(e));
    const u5 = onSnapshot(query(collection(db, 'invites'), where('createdBy', '==', uid)), s => setInvites(s.docs.map(d => ({ code: d.id, ...(d.data() as Omit<Invite, 'code'>) })).sort((a, b) => a.createdAt - b.createdAt)), e => console.error(e));
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, [uid, onboarded]);

  // ── kolo: platí globální session + session každé mé putyky, pokud byla zavřena dnes
  const todayKey = dayKey(now);
  const { cut, activeSession } = useMemo(() => {
    const list = [mainSession, ...pubs.map(p => p.session || null)].filter((s): s is Session => !!s && dayKey(s.end) === todayKey);
    const best = list.sort((a, b) => b.end - a.end)[0] || null;
    return { cut: best ? best.end : 0, activeSession: best };
  }, [mainSession, pubs, todayKey]);
  const sessionOver = !!activeSession;
  useEffect(() => { if (pubs.length === 0 && pubSel !== 'main') setPubSel('main'); else if (pubSel !== 'main' && !pubs.some(p => p.id === pubSel)) setPubSel('main'); }, [pubs, pubSel]);
  const noteShownFor = useRef<number>(0);
  useEffect(() => {
    if (!activeSession || noteShownFor.current === activeSession.end) return;
    noteShownFor.current = activeSession.end;
    if (activeSession.by !== uid && Date.now() - activeSession.end < 5 * 60000) setSessionNote(true);
  }, [activeSession, uid]);

  const stats = useMemo(() => computeStats(drinks, cut, now), [drinks, cut, sod(now)]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── veřejný agregát users/{uid}.stats počítá server (trigger na drinks). Po půlnoci si ho jednou za den nechám přepočítat.
  const refreshedFor = useRef<string>('');
  useEffect(() => {
    if (!uid || !onboarded || !profile?.stats || profile.stats.dayKey === todayKey || refreshedFor.current === todayKey) return;
    refreshedFor.current = todayKey;
    call<void, unknown>('refreshStats')().catch(e => console.error('refreshStats', e));
  }, [uid, onboarded, todayKey, profile?.stats]);

  // ── toasty
  const toast = useCallback((t: Omit<Toast, 'id'>) => setToasts(x => [...x, { id: 't' + Date.now() + Math.random(), ...t }]), []);
  const popToast = useCallback(() => setToasts(x => x.slice(1)), []);
  useEffect(() => { if (!toasts.length) return; const h = setTimeout(popToast, 2800); return () => clearTimeout(h); }, [toasts, popToast]);
  const copy = useCallback((text: string) => { try { void navigator.clipboard?.writeText(text); } catch { /* */ } toast({ kicker: 'Schránka', title: 'Odkaz zkopírován', glyph: '📋' }); }, [toast]);

  const pickQuote = () => { let i: number; do { i = Math.floor(Math.random() * QUOTES.length); } while (QUOTES.length > 1 && i === lastQ.current); lastQ.current = i; return { i, key: Date.now() }; };

  // ── zápis pití
  const addAt = useCallback((ts: number, sel: Def) => {
    if (!uid) return;
    const before = computeStats(drinks, cut, Date.now());
    const d: Drink = { id: doc(collection(db, 'users', uid, 'drinks')).id, cat: sel.cat, v: sel.v, ml: sel.ml || null, ts };
    const c = CATS[d.cat];
    const after = computeStats([...drinks, d], cut, Date.now());
    const ts2: Omit<Toast, 'id'>[] = [];
    after.badges.forEach((b, i) => { if (b.done && !before.badges[i].done) ts2.push({ kicker: 'Nový odznak · +50 XP', title: b.name, glyph: b.glyph }); });
    if (after.ch1 && !before.ch1) ts2.push({ kicker: 'Výzva splněna · +150 XP', title: 'Pivní týden', glyph: '15' });
    if (after.ch2 && !before.ch2) ts2.push({ kicker: 'Výzva splněna · +60 XP', title: 'Pivo a voda', glyph: 'H₂O' });
    if (after.level > before.level) ts2.push({ kicker: 'Postup!', title: `Úroveň ${after.level} · ${after.title}`, glyph: String(after.level) });
    setDoc(doc(db, 'users', uid, 'drinks', d.id), { cat: d.cat, v: d.v, ml: d.ml, ts: d.ts }).catch(e => console.error('drink', e));
    setLastAdd({ id: d.id, xp: c.xp }); setQuote(pickQuote()); setFlash({ id: uid, t: Date.now() });
    ts2.forEach(toast);
    try { navigator.vibrate?.(18); } catch { /* */ }
  }, [uid, drinks, cut, toast]); // eslint-disable-line react-hooks/exhaustive-deps
  const deleteDrink = useCallback((id: string) => { if (uid) deleteDoc(doc(db, 'users', uid, 'drinks', id)).catch(e => console.error(e)); }, [uid]);
  const addForgot = useCallback(() => {
    const [h, m] = (forgotTime || '').split(':').map(Number); if (isNaN(h) || isNaN(m)) return;
    const d = new Date(); d.setHours(h, m, 0, 0); let ts = d.getTime(); if (ts > Date.now()) ts -= DAY;
    addAt(ts, def); setForgotOpen(false);
  }, [forgotTime, addAt, def]);
  const saveSheet = useCallback(() => { if (!sheet) return; setDef({ cat: sheet.cat, v: sheet.v, ml: sheet.ml || null }); setSheet(null); goTab('count'); }, [sheet, setDef, goTab]);

  // ── profil
  const setProfile = useCallback((patch: Partial<Pick<UserDoc, 'name' | 'kg' | 'sex' | 'met'>>) => {
    if (!uid || !profile) return;
    if (patch.name !== undefined) {
      const name = patch.name.trim().slice(0, 24) || profile.name;
      setPubDoc(p => p && { ...p, name });
      updateDoc(doc(db, 'users', uid), { name }).catch(e => console.error('profile', e));
    }
    const priv: Partial<PrivateProfile> = {};
    if (patch.kg !== undefined) priv.kg = Math.min(250, Math.max(35, Math.round(Number(patch.kg) || 80)));
    if (patch.sex !== undefined) priv.sex = patch.sex;
    if (patch.met !== undefined) priv.met = patch.met as Met;
    if (Object.keys(priv).length) {
      const full: PrivateProfile = { kg: profile.kg ?? 80, sex: profile.sex ?? 'm', met: profile.met ?? 'normal', ...priv };
      setPrivDoc(p => ({ ...(p || {}), ...full }));
      setDoc(doc(db, 'users', uid, 'private', 'profile'), full, { merge: true }).catch(e => console.error('profile', e));
    }
  }, [uid, profile]);
  const finishOb = useCallback(async (name: string, kg: number, sex: Sex) => {
    if (!uid) return;
    const now = Date.now();
    await setDoc(doc(db, 'users', uid, 'private', 'profile'), { kg, sex, met: 'normal' }, { merge: true });
    await setDoc(doc(db, 'users', uid), { name: name.trim().slice(0, 24), createdAt: now });
    setTab('count');
  }, [uid]);
  const setOb = useCallback((p: Partial<ObState> | ((o: ObState) => ObState)) => setObState(o => (typeof p === 'function' ? p(o) : { ...o, ...p })), []);
  const obFind = useCallback(async () => {
    const code = ob.code.trim().toUpperCase().replace(/\s+/g, '').replace(/^.*\//, '');
    setOb({ code, busy: true, error: '', found: null });
    try {
      const r = await call<{ code: string }, InviteFound>('findInvite')({ code });
      setOb({ busy: false, found: r.data, error: '' });
    } catch (e) { console.error(e); setOb({ busy: false, found: null, error: limited(e) ? TOO_MANY : 'Takovej kód neznáme. Zkontroluj ho, nebo si založ vlastní účet.' }); }
  }, [ob.code, setOb]);
  const obClaim = useCallback(async () => {
    if (!ob.found) return;
    setOb({ busy: true });
    try { await call<{ code: string }, unknown>('claimInvite')({ code: ob.code }); setTab('count'); }
    catch (e) { console.error(e); setOb({ busy: false, error: limited(e) ? TOO_MANY : errMsg(e) || 'Nepovedlo se převzít účet. Zkus to znovu.' }); }
  }, [ob, setOb]);

  // ── putyky
  const openPs = useCallback((mode: PsMode, patch: Partial<PsState> = {}) => setPs({ mode, name: '', emoji: '🏚️', code: '', error: '', pubId: null, inv: { name: '', kg: 80, sex: 'm' }, done: null, ...patch }), []);
  const createPub = useCallback(async () => {
    if (!ps) return; const name = (ps.name || '').trim(); if (!name || ps.busy) return;
    if (isOffensive(name)) { setPs(p => p && { ...p, error: 'Tenhle název neprojde. Zkus něco slušnějšího.' }); return; }
    setPs(p => p && { ...p, busy: true });
    try { const r = await call<{ name: string; emoji: string }, { id: string; code: string }>('createPub')({ name, emoji: ps.emoji || '🏚️' }); setPubSel(r.data.id); setPs(p => p && { ...p, mode: 'detail', pubId: r.data.id, busy: false }); }
    catch (e) { console.error(e); setPs(p => p && { ...p, busy: false, error: limited(e) ? 'Na dnešek už jsi založil dost putyk.' : 'Nepovedlo se založit putyku. Zkus to znovu.' }); }
  }, [ps]);
  const joinPub = useCallback(async (codeArg?: string) => {
    const raw = codeArg ?? ps?.code ?? ''; const code = raw.trim().toUpperCase().replace(/\s+/g, '').replace(/^.*\//, '');
    if (!code) return;
    if (pubs.some(p => p.code === code)) { setPs(p => p && { ...p, error: 'V týhle putyce už sedíš.' }); return; }
    setPs(p => p && { ...p, busy: true, error: '' });
    try {
      const r = await call<{ code: string }, { id: string; name: string; emoji: string; code: string }>('joinPub')({ code });
      setPubSel(r.data.id); setPs(p => p && { ...p, mode: 'detail', pubId: r.data.id, error: '', busy: false });
      toast({ kicker: 'Vítej', title: `Jsi v putyce ${r.data.name}`, glyph: r.data.emoji });
    } catch (e) {
      const c = errCode(e), msg = c.includes('already-exists') ? 'V týhle putyce už sedíš.' : limited(e) ? TOO_MANY : 'Takovou putyku neznáme. Zkontroluj kód.';
      setPs(p => p && { ...p, busy: false, error: msg });
    }
  }, [ps, pubs, toast]);
  const leavePub = useCallback(async () => {
    if (!ps?.pubId) return; const id = ps.pubId;
    setPs(p => p && { ...p, busy: true });
    try { await call<{ pubId: string }, unknown>('leavePub')({ pubId: id }); if (pubSel === id) setPubSel('main'); setPs(null); }
    catch (e) { console.error(e); setPs(p => p && { ...p, busy: false, error: 'Nepovedlo se. Zkus to znovu.' }); }
  }, [ps, pubSel]);
  const kickMember = useCallback(async (target: string, name: string) => {
    if (!ps?.pubId) return;
    try { await call<{ pubId: string; uid: string }, unknown>('kickMember')({ pubId: ps.pubId, uid: target }); toast({ kicker: 'Hospodský rozhodl', title: `${name} letí z putyky`, glyph: '🚪' }); }
    catch (e) { console.error(e); }
  }, [ps, toast]);
  const createInvite = useCallback(async () => {
    if (!ps) return; const name = (ps.inv.name || '').trim(); if (!name || ps.busy) return;
    if (isOffensive(name)) { setPs(p => p && { ...p, error: OFFENSIVE_MSG }); return; }
    setPs(p => p && { ...p, busy: true });
    try { const r = await call<{ name: string; kg: number | string; sex: Sex }, Invite>('createInvite')({ name, kg: ps.inv.kg, sex: ps.inv.sex }); setPs(p => p && { ...p, mode: 'inviteDone', done: r.data, busy: false }); }
    catch (e) { console.error(e); setPs(p => p && { ...p, busy: false, error: limited(e) ? 'Na dnešek už jsi vytvořil dost pozvánek.' : 'Nepovedlo se vytvořit pozvánku.' }); }
  }, [ps]);

  // ── kolo
  const openEnd = useCallback(() => setEnd({ q: makeQ(), answer: '', error: '', tries: 0, scope: pubSel === 'main' ? 'global' : 'pub', pass: '', passError: false }), [pubSel]);
  const confirmEnd = useCallback(async () => {
    const e = end; if (!e || e.busy) return;
    if (e.scope === 'global' && !(e.pass || '')) { setEnd({ ...e, passError: true, error: 'Špatný admin heslo. Hlavní lokál zavírá jen hospodský.' }); return; }
    if (Number(e.answer) !== e.q.ans) {
      const tries = e.tries + 1, msgs = ['Hmm, to nesedí. Ještě jednou.', 'Zkus to jako střízlivej.', 'Tak to asi ještě nekončíš. Nový příklad.'];
      setEnd({ ...e, q: tries >= 3 ? makeQ() : e.q, answer: '', tries: tries >= 3 ? 0 : tries, error: msgs[Math.min(tries - 1, 2)] }); return;
    }
    setEnd({ ...e, busy: true, error: '' });
    try {
      const r = await call<{ scope: string; pubId?: string; adminPass?: string }, { session: Session }>('closeRound')({ scope: e.scope, pubId: e.scope === 'pub' ? pubSel : undefined, adminPass: e.scope === 'global' ? e.pass : undefined });
      const s = r.data.session;
      setEnd(null); setQuote(null); setLastAdd(null); setForgotOpen(false); setSheet(null); setMoved({}); setSessionNote(true);
      toast({ kicker: 'Kolo zavřeno', title: 'Nové kolo běží', glyph: '🔄' });
      void s;
    } catch (err) {
      const c = errCode(err), m = errMsg(err);
      if (c.includes('permission-denied') && m.includes('bad-pass')) setEnd({ ...e, busy: false, passError: true, error: 'Špatný admin heslo. Hlavní lokál zavírá jen hospodský.' });
      else if (limited(err)) setEnd({ ...e, busy: false, passError: true, error: TOO_MANY });
      else if (c.includes('failed-precondition') && m.includes('already-closed')) { setEnd(null); toast({ kicker: 'Pozdě', title: 'Kolo už dneska někdo zavřel', glyph: '🛏️' }); }
      else setEnd({ ...e, busy: false, error: 'Nepovedlo se zavřít kolo. Zkus to znovu.' });
    }
  }, [end, pubSel, toast]);

  // ── účet
  const linkWith = useCallback(async (provider: GoogleAuthProvider | OAuthProvider, label: string) => {
    const u = auth.currentUser; if (!u) return;
    try {
      await linkWithPopup(u, provider);
      toast({ kicker: 'Účet zamčenej', title: 'Čárky jsou v bezpečí', glyph: '🔐' });
    } catch (e) {
      const c = errCode(e);
      if (c === 'auth/credential-already-in-use' || c === 'auth/email-already-in-use') {
        const cred = provider instanceof GoogleAuthProvider ? GoogleAuthProvider.credentialFromError(e as never) : OAuthProvider.credentialFromError(e as never);
        if (cred) { await signInWithCredential(auth, cred); toast({ kicker: 'Vítej zpátky', title: `Přihlášeno přes ${label}`, glyph: '🔐' }); return; }
      }
      if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') { await linkWithRedirect(u, provider); return; }
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
      console.error(e); toast({ kicker: 'Nepovedlo se', title: `Přihlášení přes ${label} selhalo`, glyph: '⚠️' });
    }
  }, [toast]);
  const loginGoogle = useCallback(() => linkWith(new GoogleAuthProvider(), 'Google'), [linkWith]);
  const loginApple = useCallback(() => { const p = new OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return linkWith(p, 'Apple'); }, [linkWith]);
  const resetLocal = useCallback(() => { setTab('count'); setPubSel('main'); setObState({ step: 'form', name: '', kg: 80, sex: 'm', code: '', found: null, error: '' }); }, []);
  const logout = useCallback(async () => { resetLocal(); await signOut(auth); }, [resetLocal]);
  const deleteAccount = useCallback(async () => {
    try { await call<void, unknown>('deleteAccount')(); } catch (e) { console.error(e); }
    resetLocal(); await signOut(auth);
  }, [resetLocal]);

  const value: Store = {
    authUser, uid, authReady, profile, profileLoaded, drinks, pubs, pubDir, mainSession, members, events, invites, now, cut, activeSession, sessionOver, stats,
    theme, setTheme, tab, goTab, def, setDef, pubSel, setPubSel: (id) => { setPubSel(id); setMoved({}); }, range, setRange,
    toasts, toast, popToast, quote, lastAdd, sheet, setSheet, saveSheet, ps, setPs, openPs, end, setEnd, openEnd, confirmEnd, listek, setListek,
    forgotOpen, setForgotOpen: (b) => { setForgotOpen(b); if (b) setForgotTime(hhmm(Date.now() - 30 * 6e4)); }, forgotTime, setForgotTime, addForgot,
    sessionNote, setSessionNote, moved, flash, setMoved, ob, setOb, pendingJoin, setPendingJoin,
    addAt, deleteDrink, setProfile, finishOb, obFind, obClaim, createPub, joinPub, leavePub, kickMember, createInvite, loginGoogle, loginApple, logout, deleteAccount, copy,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

