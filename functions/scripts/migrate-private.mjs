// One-off migration (Nov 2026): moves kg/sex/met/invitedBy from public users/{uid} into users/{uid}/private/profile
// and removes the old public drink timeline (stats.recent). Writing the private doc triggers a server-side stats recompute.
// Run from the functions folder with a service-account key:  GOOGLE_APPLICATION_CREDENTIALS=... node scripts/migrate-private.mjs
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'pit-pivo' });
const db = getFirestore();
const users = await db.collection('users').get();
let n = 0;
for (const u of users.docs) {
  const d = u.data();
  const priv = {};
  for (const k of ['kg', 'sex', 'met', 'invitedBy']) if (d[k] !== undefined) priv[k] = d[k];
  priv.kg ??= 80; priv.sex ??= 'm'; priv.met ??= 'normal';
  await db.doc(`users/${u.id}/private/profile`).set(priv, { merge: true });
  await u.ref.update({ kg: FieldValue.delete(), sex: FieldValue.delete(), met: FieldValue.delete(), invitedBy: FieldValue.delete(), emoji: FieldValue.delete(), 'stats.recent': FieldValue.delete() });
  n++;
}
const ev = await db.collection('events').get();
for (const e of ev.docs) if (!e.data().aud && !e.data().members) await e.ref.delete();
console.log(`migrated ${n} users, cleaned ${ev.size} legacy events`);
process.exit(0);
