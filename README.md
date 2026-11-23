# Handoff: Pit Pivo — hospodský počítač piv s živým žebříčkem

## Overview
Pit Pivo (pitpivo.cz) je mobile-first webová aplikace pro partu kamarádů: každý si jedním ťuknutím zapisuje vypitá piva (a víno, panáky, nealko), vidí odhad promile, porovnává se v reálném čase se zbytkem party v žebříčku a sbírá XP, úrovně a odznaky. Funguje bez registrace (anonymní účet), účet se dá kdykoli „zamknout“ přes Google/Apple. Parta může zakládat vlastní „putyky“ (místnosti); kdo není v žádné, soutěží v Hlavním lokále se všemi.

Tón copy je neformální, hospodský, česky (tykání, „kámoš“, „štamgast“, „Dej si pivko“). Veškerý text převezmi doslova z prototypu.

## About the Design Files
Soubory v tomto balíčku jsou **designové reference vytvořené v HTML** (interaktivní prototyp). Nejsou to produkční zdrojáky k přímému nasazení. Úkolem je **znovu implementovat tento design v cílovém prostředí** s jeho zavedenými vzory. Doporučený stack (nic jiného zatím neexistuje, starý Angular projekt na doméně je nedokončený a lze ho zahodit):

- **Frontend:** React + TypeScript + Vite, PWA (manifest + service worker, „Přidat na plochu“), mobile-first do 480 px, desktop = stejný layout vycentrovaný.
- **Backend:** Firebase (Auth anonymní + Google + Apple, Firestore s realtime listenery, Cloud Functions pro serverové operace — zavření kola, pozvánky, kódy putyk). Prototyp přítele už běží na `*.web.app`, takže Firebase Hosting je přirozená volba.
- **Styling:** CSS custom properties přesně podle tokenů níže, `data-theme="dark|light"` na rootu. Nepoužívat UI knihovnu — komponenty jsou jednoduché a specifické.

## Fidelity
**High-fidelity.** Barvy, typografie, rozestupy, rádiusy, copy i interakce jsou finální. Implementuj 1:1 podle `Pit Pivo v2.dc.html` (otevři v prohlížeči a proklikej; všechny styly jsou inline, takže hodnoty přímo odečteš z markupu).

## Design Tokens

### Barvy — tmavý režim (`[data-theme="dark"]`, výchozí)
```
--bg          #14100c   pozadí stránky i hlavičky
--card        #1f1811   karty
--card-2      #2a2017   vnořené plochy (řádky logu, segmenty, inputy)
--sheet       #1c150f   bottom sheety
--glass       rgba(20,16,12,.84)  spodní navigace (blur 14px)
--line        rgba(246,168,33,.32) okraj karet (jantarový)
--line-soft   rgba(255,236,210,.09) jemný okraj
--text        #f8efe4
--muted       #b4a491
--amber       #f6a821   primární akcent
--amber-hi    #ffc844   horní barva gradientu
--amber-lo    #e07800   spodní barva gradientu
--amber-text  #ffbd3a   akcentový text na tmavém
--amber-tint  rgba(246,168,33,.14)
--on-amber    #1d1206   text na jantarové
--glow        rgba(246,168,33,.28) stín CTA
--danger      #ff7a7a  --danger-tint rgba(255,90,90,.13)  --danger-line rgba(255,90,90,.35)
--ok          #3ddc84  --ok-tint rgba(61,220,132,.13)
--bar         rgba(246,168,33,.28)  neaktivní sloupce grafu
```
### Barvy — světlý režim (`[data-theme="light"]`)
```
--bg #fbf4e9  --card #ffffff  --card-2 #f6ecdd  --sheet #fffaf3  --glass rgba(251,244,233,.86)
--line rgba(205,130,10,.32)  --line-soft rgba(60,35,10,.09)
--text #2b1b0c  --muted #7c6650
--amber #f6a821  --amber-hi #ffc844  --amber-lo #e07800  --amber-text #a35400  --amber-tint rgba(246,168,33,.16)
--on-amber #1d1206  --glow rgba(224,120,0,.25)
--danger #c93434  --danger-tint rgba(214,60,60,.09)  --danger-line rgba(214,60,60,.3)
--ok #1b8a4a  --ok-tint rgba(31,157,85,.12)  --bar rgba(205,130,10,.25)
```
Lístek (papír) je v obou režimech stejný: papír `#fbfaf6`, inkoust `#1e2a6b`.
Medaile v žebříčku: 1. `#f6c544`/text `#2a1c00`, 2. `#d5dbe2`/`#1e2530`, 3. `#d98a3a`/`#2a1400`.

### Typografie
- Rodina: prototyp používá `var(--font-body)` z připojeného design systému (Archivo). Pro produkci zvol **Archivo** (Google Fonts) nebo systémový sans. Rukopis na lístku: `'Segoe Print','Bradley Hand','Comic Sans MS',cursive` — v produkci nahraď webfontem typu *Caveat* nebo *Patrick Hand*.
- Váhy: 800 pro všechny nadpisy, čísla, tlačítka, jména; 700 pro labely formulářů; 600 pro meta; 400 jinak.
- Velikosti: kickery/labely 11–12 px uppercase letter-spacing .06em; body 13–14 px; položky 15 px; nadpis sekce 16–17 px; H1 28 px; titulek sheetu 21 px; velká čísla 34 px (letter-spacing −.02em); CTA 38 px uppercase.
- `text-wrap: pretty` na delších odstavcích.

### Rádiusy
CTA 26 px · karty 18–20 px · sheet 26 px (jen horní rohy) · tlačítka/segmenty 10–16 px · chipy a pilulky 99 px · kruhové avatary/ranky 50 %.

### Rozestupy
Vnější okraj 16 px; mezery mezi kartami 10–14 px; padding karet 14–16 px; gap uvnitř karet 6–10 px. Minimální výška dotykových cílů 44 px (segmenty 40–42 px jsou uvnitř 48px kontejneru).

### Stíny / efekty
- CTA: `0 14px 40px var(--glow)`; primární tlačítka v sheetech `0 8px 24px var(--glow)`.
- Sheet: `0 -20px 60px rgba(0,0,0,.45)`; backdrop `rgba(0,0,0,.6)` + `blur(3px)`.
- Toast: `0 12px 36px rgba(0,0,0,.4)`.
- Focus: `outline:2px solid #f6a821; outline-offset:2px`.

### Animace (keyframes v prototypu)
- `pp-pop` 380 ms cubic-bezier(.2,.9,.3,1.5) — číslo „Dnes vypito“ po přidání (scale .6→1).
- `pp-float` 1400 ms ease-out — „+10 XP“ pilulka pod CTA (vyjede 46 px nahoru a zmizí).
- `pp-bubble` 420 ms cubic-bezier(.2,.9,.3,1.3) — bublina s hláškou (translateY −10 px, scale .96→1).
- `pp-toast` 380 ms cubic-bezier(.2,.9,.3,1.2) — toast sjede shora.
- `pp-pulse` 1.4 s infinite — zelená tečka „Online“.
- Řádky žebříčku: `transition: background .5s, border-color .5s` (flash při změně).
- CTA: `transform .12s`, při stisku `scale(.975)`; haptika `navigator.vibrate(18)`.

## Screens / Views

Jedna stránka s rootem `max-width:480px; margin:0 auto`, sticky hlavičkou nahoře a sticky spodní navigací (4 taby). Hlavička má barvu `--bg` (ne glass), navigace glass + `border-top: 1px solid --line-soft` + `env(safe-area-inset-bottom)`.

### Hlavička (všechny taby)
`flex; gap 12px; padding 12px 16px`. Zleva: logo 44×44, radius 14, gradient amber-hi→amber-lo, emoji 🍺 24 px. Blok: „Pit Pivo“ 20 px/800 + zelený pill `Online · N u pípy` (pulzující tečka, border 1px --ok, bg --ok-tint, 11 px/800). Vpravo: kulaté 40px tlačítko přepnutí motivu (ikona slunce/měsíc, Lucide), pill s iniciálami (30px amber kruh) + přezdívkou, border 1.5px --amber — otevře Profil.
`N u pípy` = počet uživatelů, kteří dnes něco zapsali (včetně mě).

### Spodní navigace
4 tlačítka v gridu: Pípa (ikona pivní sklenice), Žebříček (trofej), Výzvy (medaile), Profil (uživatel). Lucide ikony 22 px, label 12 px/800. Aktivní: bg --amber-tint, text --amber-text; neaktivní --muted. Výška ≥ 52 px, radius 14.

### 00 Vítej (onboarding, jen při prvním spuštění)
Centrované logo 84×84 (radius 26), H1 „Pit Pivo“ 34 px, podtitul „Počítej piva, měř se s kámošema a sbírej odznaky. Bez registrace, bez hesla.“
Karta s formulářem: „Jak ti říkaj u pípy?“ (text, max 24, placeholder „třeba Kopec“), „Váha (kvůli promile)“ (− / number / + stepper, 35–250, default 80), „Pohlaví“ segment Chlap / Ženská. Tlačítko „Jdu pít 🍻“ (58 px, gradient; opacity .5 dokud není jméno). Pod kartou outline tlačítko „Mám pozvánku od kámoše“.
Varianta pozvánka: input „Kód z pozvánky“ (uppercase, placeholder KOTEL-7F2X) + „Najít“; chyba „Takovej kód neznáme. Zkontroluj ho, nebo si založ vlastní účet.“; po nalezení karta s iniciálami, jménem, „95 kg · chlap · účet založil kámoš“ a tlačítko „To jsem já 👋“. Odkaz zpět „← Zpět, založím si vlastní“.
Patička: „Účet si můžeš kdykoli zamknout přes Google nebo Apple, aby ti čárky nezmizely při výměně telefonu.“
Pozvánkový odkaz `pitpivo.cz/j/KÓD` má otevřít aplikaci rovnou v této variantě s předvyplněným kódem.

### 01 Pípa (hlavní tab)
Pořadí shora:
1. **Bublina s hláškou** (jen po přidání pití): karta border 1.5px --amber, radius 18, šipka dolů na CTA, text „„citát““ 16 px/800 + „— Autor (Seriál)“ 13 px italic --amber-text. Náhodná z `QUOTES` (26 hlášek ze Simpsonových a Hospody, viz prototyp; neopakovat stejnou dvakrát po sobě). **Hlášky jsou v prototypu psané zpaměti — před nasazením ověřit znění.**
2. **Karta „Nové kolo běží“** (po zavření kola, zavíratelná křížkem): „Minulé kolo: 5 piv, 2,5 l · zavřel Kopec v 21:14“.
3. **Hlavní CTA**: plná šířka, radius 26, bez okraje, gradient 180° amber-hi 0 % → amber 50 % → amber-lo 100 %, stín glow, text --on-amber. Obsah: ikona 56 px (viz ikony kategorií), label 38 px uppercase, podtitul 14 px/600 opacity .82 např. „Velká 12° (0,5 l · 5,0 %)“. Label podle zvoleného druhu: `big` „Dej si pivko“, `small` „Dej si malý“, `wine` „Dej si vínko“, `shot` „Kopni panáka“, `nealko` „Piju vodu“.
4. **+XP pilulka** pod CTA, centrovaná, animace pp-float.
5. **„Dát si něco jinýho“** — 5 sloupců: Pivo 0,5 l / Malý 0,3 l / Víno 0,2 l / Panák 2–4 cl / Nealko za řidiče. Karta radius 16, ikona ~30 px, label 13 px/800, sub 10,5 px --muted. Zvolená kategorie: bg --amber-tint, border --amber. Klik otevře **sheet výběru druhu**.
   Ikony: Pivo 🍺 plná velikost; Malý 🍺 68 %; Víno 🍷 92 %; Panák 🥃 62 %; Nealko vlastní SVG PET lahve (modrá #3aa8e6, viz `catIcon` v prototypu). V produkci lze nahradit konzistentní sadou vlastních SVG, poměr velikostí zachovat.
6. **Statistiky 2×2** (karty radius 18, border --line): „Dnes vypito“ N ks + „3× pivo (1,5 l)“ + „1× panák · 1× nealko“; „Piv za hodinu / minutu“ 1,8 piv/h, 0,03 piv/min, „Piješ už 1 h 40 min“; „Odhad promile“ 0,84 ‰ + „80 kg · Muž · normálně ✏️“ (klik → Profil); „Vystřízlivění za“ 5 h 36 min + „Cca v 02:50“.
   Pod gridem přes oba sloupce: **„🛏️ Končím s pivkem“** + „Zavře kolo pro celou partu a hned začne nové. Jen jednou za den.“ Po zavření se nahradí neaktivním boxem „🛏️ Kolo už dneska zavřel Kopec / Příště zase zítra.“
7. **Karta úrovně** (klik → Výzvy): kruh 48 px s číslem úrovně, titul („Štamgast“), „420 / 500 XP“, progress bar 8 px, „🔥 5 dní v řadě · tenhle týden 14 piv“.
8. **„📋 Moje čárky (N) / LÍSTEK“** + vpravo outline „+ Zapomenutý pivo“ (rozbalí řádek s time inputem „Kdy jsi do sebe hodil velká 12°?“ + „Zapsat“). Položky: emoji 26 px, „Velká 12° (0,5 l · 5,0 %)“, „🕐 Vypito v 20:15“, tlačítko „✕ Smazat“ (danger tint). Prázdný stav: „Zatím suchej jak Sahara. Dej si první!“ Řazení od nejnovějšího.

### Sheet výběru druhu (bottom sheet)
Handle 44×5, titulek 21 px + křížek, hint 14 px --muted. U panáků segment „Malej · 2 cl / Velkej · 4 cl“. Grid 2 sloupců s kartami variant: emoji 26 px, badge s % vpravo nahoře, název 15 px/800, objem 12 px. Vybraná = tint + amber border. Text „Uložením se tahle volba nastaví na hlavní tlačítko na Pípě.“ Primární tlačítko **„Uložit“** (56 px) → uloží výchozí druh, zavře sheet, přepne na Pípu (nic nezapisuje).
Data variant (název, ABV, objem) viz `CATS` v prototypu: piva 10°/11°/12° (4,3/4,7/5,0 %), vína (bílé 11,5 %, červené 13 %, růžové 12 %, šampus 11 %/150 ml, svařák 10 %, střik 6 %/300 ml), panáky (vodka 40, rum 37,5, tuzemák 37,5, whiskey 40, becherovka 38, fernet 38, slivovice 50, jäger 35, tequila 38, zelená 20 %), nealko (voda 0 %/300 ml, kofola 0 %/500 ml, nealko pivo 0,5 %/500 ml). Titulky/hinty/CTA kopie v `CATS[*].title/hint`.

### Lístek (modal, mobilní velikost)
Backdrop `rgba(0,0,0,.62)` blur 4. Papírová karta max 360 px, bg #fbfaf6, radius 3, „bloček“ efekt stínem `0 2px 0 #e9e6dd, 0 4px 0 #dedbd2, 0 6px 0 #d3d0c7, 0 24px 60px rgba(0,0,0,.5)`. Nahoře kicker „TAHEM PRSTU UDĚLEJ ČÁRKU“ + křížek. 5 řádků vždy: „Pivko:“, „Malý:“, „Vínko:“, „Panák:“, „Voda:“ v rukopisném fontu 22 px, za nimi čárky jako SVG tahy (4 svislé lehce roztřesené + 5. šikmý škrt, stroke 2,6, #1e2a6b, výška 42 px; generátor `tallySvg`). Dole „Celkem 12 čárek“ a centrované outline „← Zpět“.
**Gesto:** pointerdown na řádku začne kreslit čáru (živě vykreslovaný path za prstem, `touch-action:none`, setPointerCapture); pointerup s délkou ≥ 22 px zapíše jedno pití dané kategorie (s aktuálním výchozím druhem) = stejný efekt jako CTA. Kratší tah = nic.

### 02 Žebříček
H1 „🏆 Žebříček štamgastů“ + „Živě. Kdo si dá, ten se hned posune.“
Řada chipů (horizontální scroll): „🌍 Hlavní lokál“, pak putyky uživatele, nakonec dashed „+ Putyka“. Aktivní chip plná amber.
Info karta aktuální putyky: název + „5 štamgastů · tvoje putyka“ + tlačítko „Pozvat · KÓD“ (u Hlavního lokálu: „Všichni, co jsou zrovna online. Tady jsi vždycky.“).
Segment Dnes / Týden / Celkem.
Banner pozice: „Vedeš! 👑 Náskok 2 piva dneska. Nepolevuj.“ nebo „Jsi 3. Na Nugát ti chybí 2 piva. Tak šup!“
Řádky: rank kruh 30 px (medaile 1–3), emoji + jméno (moje „Kopec (ty)“ s amber borderem a tintem), sub „4 piva · 1 panák · 1,8 piv/h“, vpravo „4 ks“ 20 px --amber-text + „0,84 ‰“. Šipky ▲ (ok) / ▼ (danger) 4,5 s po změně pořadí; flash tint 1,3 s po novém zápisu.
Karta „🍻 Kdo právě nasává“: posledních 6 událostí („Živňák si dal 5. pivo“, „Nugát získal odznak Hattrick“, „Kupis kopnul slivovici“, „Kopec zavřel kolo (5 piv). Jede se nanovo.“) s relativním časem („teď“, „před 25 s“, „před 3 min“).

### 03 Výzvy
Karta úrovně (kruh 84 px, titul 22 px, progress 10 px, „420 / 500 XP · další: Pivní znalec“).
„TÝDENNÍ VÝZVY“: Pivní týden (15 piv za 7 dní, +150 XP), Pivo a voda (ke každým 3 dnešním pivům 1 nealko, +60 XP), Předběhni: {jméno nad tebou v týdnu} / Udrž korunu. Každá: emoji, název, badge odměny, popis, progress + status („Hotovo ✓“ / „12/15“).
„ODZNAKY X z 9“ — grid 3 sloupce: kruh 52 px s glyfem (získaný gradient, jinak --card-2), název 13 px, popis 11 px, „Získáno ✓“ / „3/7“. Seznam: První doušek (1 pivo), Hattrick (3/den), Desítka (10), Stovka (100), Týdenní série (7 dní), Degustátor (5 druhů), Hydratace (3 nealka/den), Noční sova (pivo po půlnoci), Půltisícovka (500).

### 04 Profil
- Karta: avatar 64 px + input „Přezdívka u pípy“.
- 2×2 statistiky: Piv celkem, Litrů celkem, Celkem XP, Odznaky.
- „🧍 Profil pijana“: váha stepper, segment Chlap/Ženská, segment „Jak rychle to z tebe vyprchá“ Rychle −0,20 ‰/h („Spaluješ jak kamna v kotelně.“) / Normálně −0,15 („Průměrnej štamgast, nic extra.“) / Pomalu −0,10 („Drží se tě to jak klíště.“) + disclaimer o Widmarkově vzorci.
- „📊 Posledních 7 dní“: sloupcový graf (dnes gradient, ostatní --bar), hodnoty nad sloupci, zkratky dnů.
- „🔐 Zamkni si účet“: text + tlačítka Google / Apple (s logy). Po přihlášení zelený box „✓ Zamčeno přes Google / email“ + „Odhlásit“.
- „🏚️ Moje putyky“ + „+ Nová“: řádky s emoji, názvem, „5 štamgastů · tvoje putyka“, kód. Poznámka „Hlavní lokál je pro všechny a zůstáváš v něm vždycky.“
- „👥 Účty pro kámoše“ + „+ Založit“: text „Pro líný kamarády. Vyplníš jim profil, pošleš odkaz a oni jen kliknou „To jsem já“.“; řádky s iniciálami, jménem, „95 kg · chlap · KOTEL-7F2X“, status „Čeká“ (amber) / „Převzato ✓“ (ok).
- „🔑 Admin heslo“: text + password input (demo-only; v produkci sekci vypusť nebo nahraď informací, kdo je admin).
- „🌗 Vzhled“: segment Tmavý / Světlý.
- Odkaz „Smazat a obnovit demo data“ (v produkci: „Smazat účet“ s potvrzením).

### Sheet putyk (jeden sheet, 6 režimů)
- **menu** „Putyka / Kde dneska pijeme?“: dvě velké volby „🏚️ Založit putyku“ a „🔑 Vstoupit kódem“.
- **create** „Nová putyka“: název (max 28), výběr emoji z `🏚️ 🍻 🛖 🏕️ 🏠 🎱 ⚽ 🎸`, „Založit putyku“ → přejde na detail.
- **join** „Vstoupit do putyky“: kód + „Vstoupit“; chyby „V týhle putyce už sedíš.“ / „Takovou putyku neznáme. Zkontroluj kód.“
- **detail** „{emoji} {název} / Kdo má kód, může dovnitř.“: velký kód 32 px letter-spacing .08em, `pitpivo.cz/p/KÓD`, „Kopírovat odkaz“ (clipboard + toast „Odkaz zkopírován“), seznam členů (já „hospodský“), u hospodského u každého člena tlačítko „Vyhodit“ (danger, toast „{jméno} letí z putyky“), dole „Zrušit putyku“ (owner) / „Odejít z putyky“.
- **invite** „Účet pro kámoše“: přezdívka, váha, pohlaví → „Vytvořit pozvánku“.
- **inviteDone** „Pozvánka je hotová“: kód, `pitpivo.cz/j/KÓD`, kopírovat, text „Pošli to kámošovi. Otevře odkaz, klikne „To jsem já“ a může pít. Heslo řešit nemusí, účet si může zamknout později sám.“, „Hotovo“.
Formát kódu: prvních 5 písmen názvu bez diakritiky + „-“ + 4 znaky z `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

### Modal „Fakt končíme?“ (zavření kola)
Centrovaný dialog max 400 px, radius 26. 🛏️ 40 px, titulek 22 px, text „Čárky se uloží do historie a všichni začínají od nuly. Jde to jen jednou za den.“
**Přepínač rozsahu** (segment, 2 volby s podtitulkem): „{název putyky} / jen naše parta“ a „Hlavní lokál / všichni · admin heslo“. Předvolený je rozsah podle aktuálně zvolené putyky v žebříčku; volba putyky je neaktivní (šedá), když uživatel v žádné není. Při „Hlavní lokál“ se zobrazí pole **„Heslo hospodského (admin)“** (type=password). Špatné heslo: červený okraj + „Špatný admin heslo. Hlavní lokál zavírá jen hospodský.“
Pak „Nejdřív dokaž, že ještě vidíš na čísla:“ a box „HOSPODSKÁ MATIKA“ s příkladem 30 px (sčítání 2–9 + 2–9, odčítání 5–14 − menší, nebo násobení 2–5 × 2–6). Number input 54 px centrovaný. Chyby postupně: „Hmm, to nesedí. Ještě jednou.“ → „Zkus to jako střízlivej.“ → „Tak to asi ještě nekončíš. Nový příklad.“ (po 3. chybě nový příklad). „Zavřít kolo“ (primární) / „Ještě ne, dáme jedno“ (ghost).

### Toasty
Fixní nahoře, max 456 px, radius 18, border 1.5px amber, kruh 48 px s glyfem, kicker 11 px uppercase --amber-text + titulek 17 px. Auto-zavření 2,8 s, klik zavře. Typy: nový odznak („Nový odznak · +50 XP“), výzva splněna, postup úrovně („Postup!“ / „Úroveň 5 · Štamgast“), kolo zavřeno, odkaz zkopírován, účet zamčen, člen vyhozen.

## Interactions & Behavior

### Zápis pití
`addDrink({cat, variantId, ml, ts})`. Spustí: záznam do logu, přepočet statistik, pp-pop na čísle, +XP pilulku, bublinu s hláškou, flash mého řádku v žebříčku, položku do feedu („Kopec si dává 4. pivo“ / „Kopec kopnul vodka“ / „Kopec · bílé víno“), haptiku, a toasty za nově splněné odznaky/výzvy/úroveň (porovnáním stavu před a po). Zapomenuté pivo = stejný zápis se zadaným časem (pokud je v budoucnu, odečti den).

### XP a úrovně
XP za zápis: pivo 10, malé 6, víno 8, panák 5, nealko 4. Odznak +50, výzva Pivní týden +150, Pivo a voda +60. Úroveň L vyžaduje `50·L·(L+1)` XP kumulativně (L1 0, L2 100, L3 300, L4 600, L5 1000 …). Tituly: Nováček, Ochutnávač, Hospodský host, Pivař, Štamgast, Pivní znalec, Mistr čepu, Sládek, Legenda hospody, Pivní bůh.

### Promile (Widmark)
`BAC = Σ (ml · ABV · 0,789) / (kg · r)` kde r = 0,68 muž / 0,55 žena; mezi jednotlivými drinky i od posledního do teď odečítej β ‰/h (0,20 / 0,15 / 0,10 podle nastavení), nikdy pod 0. Bere se posledních 36 h. „Vystřízlivění za“ = BAC / β. Přepočítávat každou sekundu (tick) nebo alespoň každou minutu.

### Tempo
`piv/h = dnešní piva / max(hodiny od prvního alkoholického zápisu v kole, 0,5)`.

### Kolo (session) a „Končím s pivkem“
Kolo má dva rozsahy, uživatel volí v dialogu:
- **Per putyka** — kdokoli z členů putyky, bez hesla. Vynuluje dnešní stav jen členům dané putyky.
- **Globální (Hlavní lokál)** — vyžaduje **admin heslo**. Vynuluje dnešní stav všem uživatelům.
V obou případech jen jednou za kalendářní den (serverová kontrola v Cloud Function `closeRound({scope, pubId?, adminPass?})`). Zavření uloží `sessionEnd`, `sessionBy`, `sessionScope`; dnešní statistiky/žebříček „Dnes“/tempo/lístek dotčených uživatelů začínají od nuly; historie (celkem, týden, XP, odznaky) zůstává; promile se počítají dál. Hlavní CTA zůstává aktivní. Po zavření se tlačítko nahradí boxem „Kolo už dneska zavřel {jméno} ({Hlavní lokál | název putyky})“. Druhý den (lokální půlnoc) se stav resetuje.

**Admin heslo:** v prototypu je výchozí `pivo123` (konstanta `ADMIN_PASS_DEFAULT` v kódu) a dá se změnit v Profilu v sekci „🔑 Admin heslo“ (jen pro demo). **V produkci heslo nikdy nedávej do klienta:** ulož ho jako secret Cloud Functions (`firebase functions:secrets:set ADMIN_PASS`) nebo do Firestore dokumentu `config/admin` čitelného jen z Functions; klient ho pošle jen jako parametr `closeRound`, server porovná (ideálně hash) a odmítne s chybou, kterou UI zobrazí jako „Špatný admin heslo…“. Alternativa: místo hesla nastav vybraným uid custom claim `admin: true`; dialog pak heslo nevyžaduje. Vyber jedno a zaznamenej do konfigurace.

### Žebříček a realtime
Hodnoty: today / week (posledních 7 dní) / total. Řazení sestupně, ties podle jména (cs locale). Realtime přes Firestore onSnapshot; při změně pořadí ukaž ▲/▼ na 4,5 s a flash řádku na 1,3 s. „Online“ = zapsal něco dnes. Při filtru putyky zobrazuj jen členy.

### Onboarding a identita
1. Při prvním spuštění `signInAnonymously()`; po „Jdu pít“ vytvoř `users/{uid}` s přezdívkou, kg, pohlavím.
2. „Zamkni si účet“ = `linkWithPopup(GoogleAuthProvider | OAuthProvider('apple.com'))` na stávající anonymní uid — data zůstávají.
3. Pozvánka: správce vytvoří `invites/{code}` {name, kg, sex, createdBy}; kamarád otevře `/j/KÓD`, aplikace zavolá Cloud Function `claimInvite(code)` která přepíše profil anonymního uid daty z pozvánky a označí pozvánku `claimedBy`. Jednorázové.
4. Putyky: `pubs/{id}` {name, emoji, code, ownerId, memberIds[]}; `joinPub(code)` a `kickMember` přes Cloud Functions s kontrolou práv. Odkaz `/p/KÓD` otevře join s předvyplněným kódem.

### Perzistence
Vše v Firestore; lokálně cache přes Firestore offline persistence. Motiv a výchozí druh pití v `localStorage`. V prototypu je vše v `localStorage` pod klíčem `pitpivo-demo-v2` — simulovaní pijani (`PEOPLE`), náhodný tick 2,5–5 s a demo kódy `KOTEL-7F2X`, `SKLEP-9Q` jsou jen pro demo a v produkci se vypouští.

## State Management (klientský)
```
tab: 'count'|'board'|'game'|'profile'
theme: 'dark'|'light'
user: {uid, name, kg, sex, met: 'fast'|'normal'|'slow', provider?, email?}
def: {cat, v, ml?}                      // výchozí druh pro CTA
drinks: Drink[] {id, cat, v, ml?, ts}   // moje zápisy
members: Member[]                       // ostatní v aktuálním lokálu/putyce (realtime)
pubs: Pub[]; pub: 'main'|pubId
invites: Invite[]
session: {end, by, scope:'global'|pubName, closed:{beers,liters}} | null
adminPass (demo only)
feed: Event[] (posledních 6)
ui: sheet | pubSheet | endDialog | listek | draw | toasts[] | quote | lastAdd | forgotOpen
```
Odvozené (memo): stats (today, week, streak, chart7, badges, xp, level), bac, tempo, board rows, position banner.

## Data model (Firestore návrh)
```
users/{uid}            name, kg, sex, met, xpBonus, createdAt, provider
users/{uid}/drinks/{id} cat, v, ml, ts, pubId?
pubs/{pubId}           name, emoji, code, ownerId, memberIds[], session:{end, by, closedAt}
pubs/main              (virtuální — všichni) session:{end, by, closedAt}   // globální kolo
config/admin           passHash   (čte jen Cloud Function; nebo použij secret ADMIN_PASS)
invites/{code}         name, kg, sex, createdBy, claimedBy?, createdAt
events/{id}            pubId, type, text, uid, ts   (feed; TTL 24 h)
```
Security rules: uživatel zapisuje jen své `drinks`; `pubs` a `invites` mění jen Functions; čtení žebříčku přes agregovaný dokument `pubs/{id}/board/today` aktualizovaný Function trigger (šetří čtení).

## Assets
- Emoji: 🍺 🍷 🥃 🥂 ♨️ 🧊 🌿 🔥 🦌 🌵 🍃 💧 🥤 🏆 🔥 📋 🛏️ 🔄 🌍 🏚️ 🔑 👥 🔐 🌗 🧍 📊 👑 — systémová emoji; pro konzistenci napříč OS zvaž Twemoji/Noto Emoji.
- Ikony UI: Lucide (sun, moon, x, clock, arrow-left, beer, trophy, medal, user).
- Loga Google / Apple pro přihlašovací tlačítka: oficiální brand assets (v prototypu inline SVG).
- Ikona PET lahve: inline SVG v `catIcon()`.
- Žádné bitmapy.

## Files
- `Pit Pivo v2.dc.html` — kompletní interaktivní prototyp (všechny obrazovky, sheety, logika, copy, hlášky, data variant). Otevřít v prohlížeči; vyžaduje `support.js` ve stejné složce.
- `support.js` — runtime prototypu (není součást produktu).
- `Pit Pivo.dc.html` — starší verze 1, jen pro referenci vývoje.
