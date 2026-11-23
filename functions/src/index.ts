// Čas pro „dneska“, týden a půlnoc počítáme v pražském čase stejně jako klient.
process.env.TZ = 'Europe/Prague';

import { onCall, HttpsError, type CallableRequest, type CallableOptions } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp, type Transaction, type DocumentReference } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { computeStats, publicStats, type Drink, type Profile } from './shared/calc.js';
import { CATS, type CatKey } from './shared/catalog.js';

initializeApp();
setGlobalOptions({ region: 'europe-west3', maxInstances: 10 });
const db = getFirestore();

// Admin heslo pro zavření Hlavního lokálu — secret v Google Secret Manageru, nikdy v klientu ani v repu.
const ADMIN_PASS = defineSecret('ADMIN_PASS');

// App Check: zapne se nastavením ENFORCE_APPCHECK=true ve functions/.env.pit-pivo (až bude klient posílat tokeny).
const CALL: CallableOptions = { enforceAppCheck: process.env.ENFORCE_APPCHECK === 'true' };

const TZ = 'Europe/Prague';
const HOUR = 36e5, DAY = 24 * HOUR;
const PUB_EMOJIS = ['🏚️', '🍻', '🛖', '🏕️', '🏠', '🎱', '⚽', '🎸'];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const dayKey = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const slug = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase();
const normCode = (c: unknown) => String(c || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^.*\//, '').slice(0, 24);
const randomCode = (name: string) => {
  const p = (slug(name) || 'PUTYKA').slice(0, 5); let r = '';
  for (let i = 0; i < 4; i++) r += ALPHABET[randomInt(ALPHABET.length)];
  return p + '-' + r;
};
const pl = (n: number, a: string, b: string, c: string) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);
const word = (n: number) => pl(n, 'pivo', 'piva', 'piv');

const uidOf = (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Nejsi přihlášenej.');
  return req.auth.uid;
};
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const kgOf = (v: unknown) => Math.min(250, Math.max(35, Math.round(Number(v) || 80)));
const sexOf = (v: unknown): 'm' | 'f' => (v === 'f' ? 'f' : 'm');
const privRef = (uid: string) => db.doc(`users/${uid}/private/profile`);

// ───────────────────────────── Rate limiting ─────────────────────────────
// Kolekce `ratelimits` je pro klienty zavřená (pravidla ji nepovolují). Klíč = `${uid}_${akce}` nebo `global_${akce}`.
const RL = db.collection('ratelimits');
async function rlCount(key: string, windowMs: number) {
  const d = (await RL.doc(key).get()).data();
  return d && Date.now() - d.start < windowMs ? Number(d.count) || 0 : 0;
}
async function rlBump(key: string, windowMs: number) {
  const ref = RL.doc(key), now = Date.now();
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data();
    const fresh = !d || now - d.start >= windowMs;
    tx.set(ref, { count: fresh ? 1 : (Number(d!.count) || 0) + 1, start: fresh ? now : d!.start, expireAt: Timestamp.fromMillis(now + windowMs) });
  });
}
/** Vyhodí resource-exhausted, pokud uživatel (nebo všichni dohromady) vyčerpal limit neúspěšných pokusů. */
async function rlGuard(uid: string, action: string, perUser: number, global: number, windowMs = HOUR) {
  const [u, g] = await Promise.all([rlCount(`${uid}_${action}`, windowMs), rlCount(`global_${action}`, windowMs)]);
  if (u >= perUser || g >= global) throw new HttpsError('resource-exhausted', 'too-many-attempts');
}
async function rlFail(uid: string, action: string, windowMs = HOUR) {
  await Promise.all([rlBump(`${uid}_${action}`, windowMs), rlBump(`global_${action}`, windowMs)]);
}

async function uniquePubCode(name: string) {
  for (let i = 0; i < 20; i++) {
    const code = randomCode(name);
    const q = await db.collection('pubs').where('code', '==', code).limit(1).get();
    if (q.empty) return code;
  }
  throw new HttpsError('internal', 'Nepovedlo se vygenerovat kód.');
}
async function uniqueInviteCode(name: string) {
  for (let i = 0; i < 20; i++) {
    const code = randomCode(name);
    if (!(await db.doc(`invites/${code}`).get()).exists) return code;
  }
  throw new HttpsError('internal', 'Nepovedlo se vygenerovat kód.');
}

/** Událost do feedu. `members` = jen pro členy putyky; bez něj ji vidí všichni (Hlavní lokál). */
async function addEvent(pubId: string, uid: string, type: string, text: string, accent = false, members?: string[]) {
  const ts = Date.now();
  const audience = members ? { members } : { aud: 'all' };
  await db.collection('events').add({ pubId, uid, type, text, accent, ts, expireAt: Timestamp.fromMillis(ts + DAY), ...audience });
}

// ───────────────────────────── Statistiky (server je jediný zdroj pravdy) ─────────────────────────────
async function recomputeStats(uid: string) {
  const userRef = db.doc(`users/${uid}`);
  return db.runTransaction(async (tx: Transaction) => {
    const [user, priv, drinksSnap] = await Promise.all([tx.get(userRef), tx.get(privRef(uid)), tx.get(db.collection(`users/${uid}/drinks`))]);
    if (!user.exists) return null;
    const now = Date.now(), today = dayKey(now);
    const old = user.data()?.stats || {};
    const cut = old.dayKey === today ? Number(old.cut) || 0 : 0;
    const p = priv.data() || {};
    const prof: Profile = { kg: kgOf(p.kg), sex: sexOf(p.sex), met: (['fast', 'normal', 'slow'].includes(p.met) ? p.met : 'normal') as Profile['met'] };
    const drinks: Drink[] = drinksSnap.docs.map(d => {
      const x = d.data();
      return { id: d.id, cat: x.cat as CatKey, v: String(x.v), ml: typeof x.ml === 'number' ? x.ml : null, ts: Number(x.ts) };
    }).filter(d => CATS[d.cat] && d.ts <= now + 60000);
    const stats = publicStats(drinks, cut, prof, now);
    tx.update(userRef, { stats }); // update = celé pole stats se nahradí (žádné staré klíče)
    return { stats, drinks, cut, name: String(user.data()?.name || 'Někdo') };
  });
}

export const onDrinkWritten = onDocumentWritten('users/{uid}/drinks/{drinkId}', async (event) => {
  const uid = event.params.uid;
  const res = await recomputeStats(uid);
  const created = !event.data?.before.exists && event.data?.after.exists;
  if (!res || !created) return;
  const d = event.data!.after.data()!;
  if (Number(d.ts) < Date.now() - 3 * HOUR) return; // zpětné/importované zápisy nespamují feed
  const c = CATS[d.cat as CatKey]; if (!c) return;
  const v = c.vars.find(x => x.id === d.v) || c.vars[0];
  const ml = (typeof d.ml === 'number' && d.ml) || v.ml || c.ml;
  const name = c.sizes ? `${v.name} · ${ml >= 40 ? 'velkej' : 'malej'}` : v.name;
  const today = computeStats(res.drinks, res.cut, Date.now()).today.beers;
  const text = c.beer ? `${res.name} si dává ${today}. pivo` : d.cat === 'shot' ? `${res.name} kopnul ${v.name.toLowerCase()}` : `${res.name} · ${name.toLowerCase()}`;
  await addEvent('main', uid, 'drink', text);
});

export const onPrivateProfileWritten = onDocumentWritten('users/{uid}/private/{docId}', async (event) => {
  await recomputeStats(event.params.uid);
});

/** Klient si jednou denně (po půlnoci) nechá přepočítat „dneska“ a „týden“. */
export const refreshStats = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  await rlGuard(uid, 'refresh', 30, 100000);
  await rlFail(uid, 'refresh');
  await recomputeStats(uid);
  return { ok: true };
});

// ───────────────────────────── Kolo („Končím s pivkem“) ─────────────────────────────
export const closeRound = onCall({ ...CALL, secrets: [ADMIN_PASS] }, async (req) => {
  const uid = uidOf(req);
  const scope = req.data?.scope === 'pub' ? 'pub' : 'global';
  const now = Date.now(), today = dayKey(now);

  const meSnap = await db.doc(`users/${uid}`).get();
  if (!meSnap.exists) throw new HttpsError('failed-precondition', 'Nejdřív si založ účet.');
  const me = meSnap.data()!;
  const byName: string = me.name || 'Někdo';

  let pubRef = db.doc('pubs/main');
  let pubName = 'Hlavní lokál';
  let memberIds: string[] | null = null;
  if (scope === 'global') {
    // Max 5 špatných hesel za hodinu na uživatele a 30 za hodinu celkem (proti hádání přes víc anonymních účtů).
    await rlGuard(uid, 'adminpass', 5, 30);
    const expected = ADMIN_PASS.value() || '';
    const given = String(req.data?.adminPass ?? '').slice(0, 200);
    const a = Buffer.from(given), b = Buffer.from(expected);
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
      await rlFail(uid, 'adminpass');
      throw new HttpsError('permission-denied', 'bad-pass');
    }
  } else {
    const pubId = str(req.data?.pubId, 64);
    if (!pubId || pubId === 'main') throw new HttpsError('invalid-argument', 'Chybí putyka.');
    pubRef = db.doc(`pubs/${pubId}`);
    const pubSnap = await pubRef.get();
    if (!pubSnap.exists) throw new HttpsError('not-found', 'Takovou putyku neznáme.');
    const pub = pubSnap.data()!;
    memberIds = (pub.memberIds || []) as string[];
    if (!memberIds.includes(uid)) throw new HttpsError('permission-denied', 'V týhle putyce nesedíš.');
    pubName = pub.name;
  }

  const stats = me.stats || {};
  const closed = stats.dayKey === today ? { beers: Number(stats.today) || 0, liters: Number(stats.liters) || 0 } : { beers: 0, liters: 0 };
  const session = { end: now, by: uid, byName, scope, pubId: scope === 'pub' ? pubRef.id : 'main', pubName, closed, closedAt: FieldValue.serverTimestamp() };

  await db.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(pubRef);
    const cur = snap.exists ? snap.data()?.session : null;
    if (cur && dayKey(Number(cur.end)) === today) throw new HttpsError('failed-precondition', 'already-closed');
    tx.set(pubRef, { session }, { merge: true });
  });

  // Vynulovat „dneska“ dotčeným uživatelům (globálně všem, jinak členům putyky).
  const reset = { stats: { dayKey: today, today: 0, shots: 0, nealko: 0, liters: 0, firstAlcoAt: null, cut: now } };
  const targets: DocumentReference[] = [];
  if (memberIds) memberIds.forEach(id => targets.push(db.doc(`users/${id}`)));
  else (await db.collection('users').select().get()).docs.forEach(d => targets.push(d.ref));
  for (let i = 0; i < targets.length; i += 400) {
    const batch = db.batch();
    targets.slice(i, i + 400).forEach(ref => batch.set(ref, reset, { merge: true }));
    await batch.commit();
  }

  const where = scope === 'global' ? 'celej lokál' : pubName;
  await addEvent(session.pubId, uid, 'round', `${byName} zavřel kolo pro ${where} (${closed.beers} ${word(closed.beers)}). Jede se nanovo.`, true, memberIds || undefined);
  return { session: { ...session, closedAt: now } };
});

// ───────────────────────────── Pozvánky („Účty pro kámoše“) ─────────────────────────────
export const createInvite = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const name = str(req.data?.name, 24);
  if (!name) throw new HttpsError('invalid-argument', 'Chybí přezdívka.');
  await rlGuard(uid, 'createInvite', 20, 2000, DAY);
  await rlFail(uid, 'createInvite', DAY);
  const kg = kgOf(req.data?.kg), sex = sexOf(req.data?.sex);
  const code = await uniqueInviteCode(name);
  const rec = { name, kg, sex, createdBy: uid, claimedBy: null, createdAt: Date.now() };
  await db.doc(`invites/${code}`).set(rec);
  return { code, ...rec };
});

/** Najde nepřevzatou pozvánku podle kódu. Klient na kolekci invites přímo nesáhne (žádné hádání kódů). */
export const findInvite = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const code = normCode(req.data?.code);
  if (!code) throw new HttpsError('invalid-argument', 'Chybí kód.');
  await rlGuard(uid, 'code', 10, 300);
  const snap = await db.doc(`invites/${code}`).get();
  const d = snap.data();
  if (!snap.exists || !d || (d.claimedBy && d.claimedBy !== uid)) {
    await rlFail(uid, 'code');
    throw new HttpsError('not-found', 'Takovej kód neznáme.');
  }
  return { name: d.name, kg: d.kg, sex: d.sex };
});

export const claimInvite = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const code = normCode(req.data?.code);
  if (!code) throw new HttpsError('invalid-argument', 'Chybí kód.');
  await rlGuard(uid, 'code', 10, 300);
  const invRef = db.doc(`invites/${code}`), userRef = db.doc(`users/${uid}`);
  const now = Date.now();
  try {
    return await db.runTransaction(async (tx) => {
      const [inv, user] = await Promise.all([tx.get(invRef), tx.get(userRef)]);
      if (!inv.exists) throw new HttpsError('not-found', 'Takovej kód neznáme.');
      const d = inv.data()!;
      if (d.claimedBy && d.claimedBy !== uid) throw new HttpsError('failed-precondition', 'Tuhle pozvánku už někdo použil.');
      if (user.exists && user.data()?.name && d.claimedBy !== uid) throw new HttpsError('failed-precondition', 'Už máš vlastní účet.');
      tx.set(userRef, { name: d.name, createdAt: now }, { merge: true });
      tx.set(privRef(uid), { kg: d.kg, sex: d.sex, met: 'normal', invitedBy: d.createdBy }, { merge: true });
      tx.update(invRef, { claimedBy: uid, claimedAt: now });
      return { name: d.name, kg: d.kg, sex: d.sex };
    });
  } catch (e) {
    if (e instanceof HttpsError && e.code === 'not-found') await rlFail(uid, 'code');
    throw e;
  }
});

// ───────────────────────────── Putyky ─────────────────────────────
export const createPub = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const name = str(req.data?.name, 28);
  if (!name) throw new HttpsError('invalid-argument', 'Chybí název.');
  await rlGuard(uid, 'createPub', 10, 1000, DAY);
  await rlFail(uid, 'createPub', DAY);
  const emoji = PUB_EMOJIS.includes(req.data?.emoji) ? req.data.emoji : '🏚️';
  const code = await uniquePubCode(name);
  const ref = db.collection('pubs').doc();
  await ref.set({ name, emoji, code, ownerId: uid, memberIds: [uid], createdAt: Date.now(), session: null });
  return { id: ref.id, code };
});

export const joinPub = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const code = normCode(req.data?.code);
  if (!code) throw new HttpsError('invalid-argument', 'Chybí kód.');
  await rlGuard(uid, 'code', 10, 300);
  const q = await db.collection('pubs').where('code', '==', code).limit(1).get();
  if (q.empty) { await rlFail(uid, 'code'); throw new HttpsError('not-found', 'not-found'); }
  const snap = q.docs[0], pub = snap.data();
  if ((pub.memberIds || []).includes(uid)) throw new HttpsError('already-exists', 'already');
  if ((pub.memberIds || []).length >= 200) throw new HttpsError('resource-exhausted', 'pub-full');
  await snap.ref.update({ memberIds: FieldValue.arrayUnion(uid) });
  const me = (await db.doc(`users/${uid}`).get()).data();
  await addEvent(snap.id, uid, 'join', `${me?.name || 'Někdo'} přisedl do putyky ${pub.name}`, false, [...(pub.memberIds || []), uid]);
  return { id: snap.id, name: pub.name, emoji: pub.emoji, code: pub.code };
});

export const leavePub = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const pubId = str(req.data?.pubId, 64);
  if (!pubId || pubId === 'main') throw new HttpsError('invalid-argument', 'Chybí putyka.');
  const ref = db.doc(`pubs/${pubId}`), snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Takovou putyku neznáme.');
  const pub = snap.data()!;
  if (!(pub.memberIds || []).includes(uid)) throw new HttpsError('permission-denied', 'V týhle putyce nesedíš.');
  if (pub.ownerId === uid) { await ref.delete(); return { deleted: true }; }
  await ref.update({ memberIds: FieldValue.arrayRemove(uid) });
  return { deleted: false };
});

export const kickMember = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  const pubId = str(req.data?.pubId, 64), target = str(req.data?.uid, 128);
  if (!pubId || pubId === 'main') throw new HttpsError('invalid-argument', 'Chybí putyka.');
  const ref = db.doc(`pubs/${pubId}`), snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Takovou putyku neznáme.');
  const pub = snap.data()!;
  if (pub.ownerId !== uid) throw new HttpsError('permission-denied', 'Vyhazuje jen hospodský.');
  if (target === uid) throw new HttpsError('invalid-argument', 'Sám sebe nevyhodíš.');
  await ref.update({ memberIds: FieldValue.arrayRemove(target) });
  return { ok: true };
});

// ───────────────────────────── Smazání účtu ─────────────────────────────
async function deleteQuery(q: FirebaseFirestore.Query) {
  const snap = await q.select().get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = db.batch(); snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit();
  }
}
export const deleteAccount = onCall(CALL, async (req) => {
  const uid = uidOf(req);
  await deleteQuery(db.collection(`users/${uid}/drinks`));
  await deleteQuery(db.collection(`users/${uid}/private`));
  const pubs = await db.collection('pubs').where('memberIds', 'array-contains', uid).get();
  for (const p of pubs.docs) {
    if (p.data().ownerId === uid) await p.ref.delete(); else await p.ref.update({ memberIds: FieldValue.arrayRemove(uid) });
  }
  await deleteQuery(db.collection('events').where('uid', '==', uid));
  await deleteQuery(db.collection('invites').where('createdBy', '==', uid).where('claimedBy', '==', null));
  await db.doc(`users/${uid}`).delete();
  await getAuth().deleteUser(uid).catch(() => undefined);
  return { ok: true };
});

// ───────────────────────────── Úklid (feed 24 h, rate-limit záznamy, staré anonymní účty) ─────────────────────────────
export const cleanupEvents = onSchedule({ schedule: 'every 6 hours', timeZone: TZ }, async () => {
  await deleteQuery(db.collection('events').where('ts', '<', Date.now() - DAY).limit(500));
  await deleteQuery(db.collection('ratelimits').where('expireAt', '<', Timestamp.now()).limit(500));
});

// ───────────────────────────── Boti („štamgasti“, aby lokál žil) ─────────────────────────────
// Serverové profily, které po večerech popíjejí. Pijí přes users/{id}/drinks jako lidi, takže se jim počítají
// statistiky, objevují se v žebříčku i ve feedu. Klient je od lidí neodliší, jen dokument má `bot: true`.
interface BotDef {
  id: string; name: string; kg: number; sex: 'm' | 'f'; met: 'fast' | 'normal' | 'slow';
  from: number; to: number;   // okno pití v hodinách (to > 24 = přes půlnoc)
  beers: [number, number];    // kolik piv za večer (min, max)
  goOut: number;              // pravděpodobnost, že ten den vůbec dorazí (všední den; o víkendu +0,25)
  mix: Partial<Record<CatKey, number>>; // podíl jiných kategorií než velké pivo
}
const BOTS: BotDef[] = [
  { id: 'bot-karel', name: 'Karel', kg: 95, sex: 'm', met: 'normal', from: 17, to: 23, beers: [4, 8], goOut: 0.6, mix: { shot: 0.1 } },
  { id: 'bot-anna', name: 'Anna', kg: 62, sex: 'f', met: 'normal', from: 19, to: 25, beers: [2, 5], goOut: 0.45, mix: { wine: 0.35, small: 0.2, nealko: 0.1 } },
  { id: 'bot-franta', name: 'Franta', kg: 105, sex: 'm', met: 'slow', from: 15, to: 22, beers: [5, 10], goOut: 0.55, mix: { shot: 0.08 } },
  { id: 'bot-zdena', name: 'Zdena', kg: 70, sex: 'f', met: 'fast', from: 18, to: 23, beers: [2, 4], goOut: 0.4, mix: { small: 0.4, nealko: 0.15 } },
  { id: 'bot-pepa', name: 'Pepa', kg: 82, sex: 'm', met: 'fast', from: 20, to: 27, beers: [3, 7], goOut: 0.35, mix: { shot: 0.2, small: 0.1 } },
  { id: 'bot-mirka', name: 'Mirka', kg: 58, sex: 'f', met: 'normal', from: 17, to: 22, beers: [1, 4], goOut: 0.4, mix: { wine: 0.2, small: 0.3, nealko: 0.2 } },
];
const BOT_VARIANT: Record<CatKey, string[]> = {
  big: ['12', '12', '11', '10'], small: ['12', '11', '10'], wine: ['white', 'red', 'spritz', 'rose'],
  shot: ['becher', 'slivo', 'rum', 'fernet', 'vodka', 'jager'], nealko: ['water', 'kofola', 'nealko'],
};
/** Deterministický „náhodný“ zlomek 0–1 pro daný den a bota (stejný při každém běhu v ten den). */
const seeded = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };
const pick = <T,>(xs: T[]) => xs[randomInt(xs.length)];

async function ensureBot(b: BotDef) {
  const ref = db.doc(`users/${b.id}`);
  if ((await ref.get()).exists) return;
  await privRef(b.id).set({ kg: b.kg, sex: b.sex, met: b.met });
  await ref.set({ name: b.name, createdAt: Date.now() - 10 * DAY, bot: true });
  // Zpětná historie za posledních 10 večerů, ať mají boti hned čísla v „Týden“ a „Celkem“.
  const batch = db.batch(), today0 = new Date(); today0.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 10; i++) {
    const evening = dayKey(today0.getTime() - i * DAY + 12 * HOUR);
    if (seeded(evening + b.id) > b.goOut + 0.15) continue;
    const n = Math.round(b.beers[0] + seeded(evening + b.id + 'n') * (b.beers[1] - b.beers[0]));
    const start = today0.getTime() - i * DAY + b.from * HOUR;
    for (let j = 0; j < n; j++) {
      const ts = start + (j + Math.random() * 0.6) * ((b.to - b.from) * HOUR / Math.max(n, 1));
      batch.set(db.collection(`users/${b.id}/drinks`).doc(), { cat: 'big', v: pick(BOT_VARIANT.big), ml: null, ts: Math.round(ts) });
    }
  }
  await batch.commit();
}

export const botsTick = onSchedule({ schedule: 'every 10 minutes', timeZone: TZ, maxInstances: 1 }, async () => {
  const now = Date.now(), d = new Date(now);
  const hour = d.getHours() + d.getMinutes() / 60, weekend = [0, 5, 6].includes(d.getDay());
  for (const b of BOTS) {
    await ensureBot(b);
    // Večer přes půlnoc patří ke dni, kdy začal.
    const h = hour < b.from && hour + 24 < b.to ? hour + 24 : hour;
    if (h < b.from || h >= b.to) continue;
    const evening = dayKey(h >= 24 ? now - DAY : now);
    if (seeded(evening + b.id) > Math.min(0.95, b.goOut + (weekend ? 0.25 : 0))) continue; // dnes nedorazil
    const target = Math.round(b.beers[0] + seeded(evening + b.id + 'n') * (b.beers[1] - b.beers[0]));
    const since = now - (h - b.from) * HOUR - 60000;
    const tonight = (await db.collection(`users/${b.id}/drinks`).where('ts', '>=', since).get()).size;
    if (tonight >= target) continue;
    const slotsLeft = Math.max(1, (b.to - h) * 6);
    if (Math.random() > Math.min(0.9, (target - tonight) / slotsLeft * 1.3)) continue;
    let cat: CatKey = 'big';
    const r = Math.random(); let acc = 0;
    for (const [k, p] of Object.entries(b.mix) as [CatKey, number][]) { acc += p; if (r < acc) { cat = k; break; } }
    const v = pick(BOT_VARIANT[cat]);
    const ml = cat === 'shot' ? (Math.random() < 0.6 ? 40 : 20) : null;
    await db.collection(`users/${b.id}/drinks`).add({ cat, v, ml, ts: now - randomInt(9 * 60000) });
  }
});

/** Úklid botích zápisů starších 40 dní (statistiky „celkem“ jim tím mírně klesají, ať neutečou lidem). */
export const botsCleanup = onSchedule({ schedule: 'every day 05:00', timeZone: TZ }, async () => {
  for (const b of BOTS) await deleteQuery(db.collection(`users/${b.id}/drinks`).where('ts', '<', Date.now() - 40 * DAY).limit(500));
});
