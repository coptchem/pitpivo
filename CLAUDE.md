# CLAUDE.md — Pit Pivo

Přečti si nejdřív `README.md` v této složce (kompletní specifikace). Pak otevři `Pit Pivo v2.dc.html` v prohlížeči a proklikej prototyp — je to zdroj pravdy pro vzhled, copy a chování.

## Zadání v jedné větě
Postav produkční verzi prototypu: React + TypeScript + Vite PWA, Firebase (anonymní Auth + Google/Apple link, Firestore realtime, Cloud Functions), nasazení na Firebase Hosting pro doménu pitpivo.cz.

## Pravidla
- Copy přebírej doslova z prototypu (česky, hospodsky, tykání). Nic nepřepisuj do spisovné češtiny.
- Barvy, rádiusy, rozestupy a typografie 1:1 podle tokenů v README (tmavý i světlý režim).
- Mobile-first do 480 px; desktop zobrazuje stejný layout vycentrovaný.
- Žádná UI knihovna; CSS custom properties + `data-theme` na rootu.
- Simulovaní pijani, náhodný tick, demo kódy (`KOTEL-7F2X`, `SKLEP-9Q`) a `localStorage` klíč `pitpivo-demo-v2` jsou jen demo — nahraď Firestore daty.
- Kolo („Končím s pivkem“) zavírej přes Cloud Function s kontrolou „jednou za den“; nikdy jen na klientu. Dva rozsahy: per putyka (bez hesla) a globální Hlavní lokál (admin heslo).
- Admin heslo nikdy do klientského kódu. V prototypu je demo konstanta `ADMIN_PASS_DEFAULT='pivo123'` – v produkci secret Cloud Functions (`ADMIN_PASS`) nebo `config/admin` čitelný jen serverem; viz README.
- Hlášky ze Simpsonových a Hospody jsou v prototypu psané zpaměti — před spuštěním je nech ověřit.

## Doporučené pořadí
1. Scaffold (Vite, TS, router pro `/`, `/j/:code`, `/p/:code`), tokeny, layout s hlavičkou a spodní navigací.
2. Auth (anonymní → onboarding → link Google/Apple) a `users/{uid}`.
3. Pípa: CTA, sheet výběru druhu, statistiky, promile, log, zapomenuté pivo, lístek s gestem.
4. Firestore model + žebříček s realtime listenery + feed.
5. Putyky, pozvánky, vyhození člena (Functions).
6. Gamifikace: XP, úrovně, odznaky, výzvy, toasty.
7. Kolo (session) přes Function.
8. PWA manifest, ikony, service worker, Hosting, pravidla Firestore.
