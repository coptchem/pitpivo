# Pit Pivo — nasazení a provoz

Produkce: React + Vite PWA (statické soubory na webhostingu přes FTPS), backend Firebase
(Anonymous/Google/Apple Auth, Firestore, Cloud Functions v regionu `europe-west3`).
Nasazuje se automaticky z GitHubu při pushi do `main` (GitHub Actions).

> Konkrétní provozní údaje (účty, cesty, identifikátory) patří do lokálního souboru `DEPLOY.private.md`,
> který je v `.gitignore` a do repa se nikdy necommituje.

## Bezpečnostní model

- **Žádná tajemství v repu.** `.env.production` obsahuje jen veřejnou konfiguraci Firebase web SDK
  (ta je stejně vidět v klientském bundlu). Ochranu zajišťují pravidla Firestore, App Check a omezení
  API klíče na naše domény v Google Cloud Console.
- **Tajemství** žijí jen v GitHub Secrets (CI) a v Google Secret Manageru (`ADMIN_PASS`).
- **Server je zdroj pravdy.** Klient smí zapsat jen svou přezdívku, soukromý profil a své zápisy pití.
  Statistiky pro žebříček (`users/{uid}.stats`) a feed (`events`) počítají a zapisují výhradně Cloud Functions.
- **Soukromá data** (váha, pohlaví, metabolismus) jsou v `users/{uid}/private/profile` a čte je jen majitel.
  Veřejný agregát neobsahuje časovou osu jednotlivých drinků.
- **Kódy** putyk a pozvánek se ověřují jen přes Cloud Functions s limitem neúspěšných pokusů
  (na uživatele i globálně). Admin heslo pro Hlavní lokál má stejný limit a porovnává se v konstantním čase.

## GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Obsah |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON klíč service accountu pro deploy (role viz níže) |
| `FTP_USERNAME`, `FTP_PASSWORD` | FTP účet omezený jen na složku webu |
| `FTP_SERVER` | hostname FTP serveru |
| `FTP_SERVER_DIR` | cílová složka na FTP (u účtu omezeného na web root `/`) |

Service account pro CI potřebuje jen: Firebase Admin, Cloud Functions Admin, Cloud Run Admin,
Service Account User, Artifact Registry Administrator, Cloud Scheduler Admin, Secret Manager Viewer,
Service Usage Consumer, Eventarc Admin. Nikdy ne Owner/Editor. Lepší varianta je Workload Identity
Federation (GitHub OIDC), pak žádný dlouhodobý klíč neexistuje.

## Admin heslo (zavření kola v Hlavním lokále)

Heslo není v klientu ani v repu. Cloud Function `closeRound` ho čte ze secretu `ADMIN_PASS`
v Google Secret Manageru. Změna = nová verze secretu (Secret Manager → `ADMIN_PASS` → New version)
a redeploy functions. Použij dlouhé náhodné heslo.

## Deploy

Workflow `.github/workflows/deploy.yml`: `npm ci` → build webu → build functions → FTP upload `dist/`
→ `firebase deploy --only hosting,firestore` → `firebase deploy --only functions`.
Akce a `firebase-tools` jsou připnuté na konkrétní verze; aktualizace hlídá Dependabot.

Ruční deploy z počítače (klíč service accountu mimo repo):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/cesta/mimo/repo/sa.json
npm run build && npx firebase-tools deploy --only firestore,functions --project <projekt>
```

## App Check

Klient zapne App Check, když je v `.env.production` vyplněný `VITE_APPCHECK_SITE_KEY`
(veřejný klíč reCAPTCHA Enterprise). Vynucení na serveru:
- Cloud Functions: `ENFORCE_APPCHECK=true` ve `functions/.env.<projekt>` a redeploy.
- Firestore: Firebase Console → App Check → APIs → Cloud Firestore → Enforce.
Nejdřív pár dní sleduj metriky App Check (podíl ověřených požadavků), teprve pak vynucuj.

## Webhosting

`public/.htaccess` řeší HTTPS, `www` → bez `www`, SPA fallback, cache a bezpečnostní hlavičky
(HSTS, CSP, X-Frame-Options, Permissions-Policy). Stejné hlavičky má `firebase.json` pro zrcadlo na Firebase Hosting.

## Lokální vývoj

```bash
npm install && npm --prefix functions install
cp .env.example .env    # vyplnit
npm run dev             # http://localhost:5173
```

Emulátory (`VITE_USE_EMULATORS=1`, `firebase emulators:start`) vyžadují Javu 11+.
Build functions kopíruje sdílený výpočet (`src/lib/calc.ts`, `catalog.ts`) do `functions/src/shared` (generováno, v `.gitignore`).

## Co kde je

- `src/lib/catalog.ts` — druhy pití, hlášky, odznaky, tituly.
- `src/lib/calc.ts` — Widmark (promile), statistiky, XP/úrovně, výzvy; sdílí ho klient i server.
- `src/state/store.tsx` — auth, Firestore listenery, akce, UI stav.
- `functions/src/index.ts` — statistiky a feed (triggery), kolo, putyky, pozvánky, smazání účtu, rate limiting, úklid.
- `firestore.rules` — co smí klient číst a zapisovat.

### Datový model
```
users/{uid}                  name, createdAt, stats{dayKey,today,shots,nealko,liters,firstAlcoAt,lastAt,week,total,xp,cut,bac{v,at,beta}}  ← stats píše jen server
users/{uid}/private/profile  kg, sex, met, invitedBy        ← jen majitel
users/{uid}/drinks/{id}      cat, v, ml, ts                 ← jen majitel
pubs/main                    session{…}
pubs/{pubId}                 name, emoji, code, ownerId, memberIds[], session   ← jen server, čtou členové
invites/{code}               name, kg, sex, createdBy, claimedBy, createdAt     ← jen server, autor vidí své
events/{id}                  pubId, uid, type, text, accent, ts, expireAt, aud='all' | members[]  ← jen server
ratelimits/{key}             count, start, expireAt          ← jen server
```

### Známé zbytky `npm audit`
`@grpc/grpc-js` ve webovém SDK Firebase (v prohlížeči se nepoužívá, oprava by byla downgrade SDK)
a `glob`/`minimatch`/`rimraf` uvnitř `firebase-admin` (nástroje bez uživatelského vstupu). Řeší je upstream.
