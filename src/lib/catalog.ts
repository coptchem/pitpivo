// Katalog pití, hlášek, odznaků, titulů — copy doslova z prototypu (Pit Pivo v2).
export type CatKey = 'big' | 'small' | 'wine' | 'shot' | 'nealko';
export type Sex = 'm' | 'f';
export type Met = 'fast' | 'normal' | 'slow';

export interface Variant { id: string; name: string; abv: number; ml?: number; emoji?: string }
export interface Cat {
  label: string; sub: string; emoji: string; beer: 0 | 1; xp: number; ml: number; def: string;
  sizes?: boolean; title: string; hint: string; cta: string; vars: Variant[];
}

export const CATS: Record<CatKey, Cat> = {
  big: { label: 'Pivo', sub: '0,5 l', emoji: '🍺', beer: 1, xp: 10, ml: 500, def: '12', title: 'Velký pivko? 🍺', hint: 'Desítka, jedenáctka, nebo poctivá dvanáctka?', cta: 'Natočit a vypít! 🍺',
    vars: [{ id: '10', name: 'Velká 10°', abv: .043 }, { id: '11', name: 'Velká 11°', abv: .047 }, { id: '12', name: 'Velká 12°', abv: .05 }] },
  small: { label: 'Malý', sub: '0,3 l', emoji: '🍺', beer: 1, xp: 6, ml: 300, def: '12', title: 'Jen malý? 🍺', hint: 'Na rozjezd nebo na cestu. Jaký stupeň?', cta: 'Natočit a vypít! 🍺',
    vars: [{ id: '10', name: 'Malá 10°', abv: .043 }, { id: '11', name: 'Malá 11°', abv: .047 }, { id: '12', name: 'Malá 12°', abv: .05 }] },
  wine: { label: 'Víno', sub: '0,2 l', emoji: '🍷', beer: 0, xp: 8, ml: 200, def: 'white', title: 'Vínečko? 🍷', hint: 'Bílý, červený, nebo střik pro sportovce?', cta: 'Nalejt a vypít! 🍷',
    vars: [{ id: 'white', name: 'Bílé víno', abv: .115 }, { id: 'red', name: 'Červené víno', abv: .13 }, { id: 'rose', name: 'Růžové víno', abv: .12 }, { id: 'sekt', name: 'Šampus', abv: .11, ml: 150, emoji: '🥂' }, { id: 'mulled', name: 'Svařák', abv: .10, emoji: '♨️' }, { id: 'spritz', name: 'Vinný střik', abv: .06, ml: 300, emoji: '🧊' }] },
  shot: { label: 'Panák', sub: '2–4 cl', emoji: '🥃', beer: 0, xp: 5, ml: 40, def: 'vodka', sizes: true, title: 'Co ti mám nalejt? 🥃', hint: 'Vyber kořalku a jestli malýho, nebo pořádnýho.', cta: 'Nalejt a kopnout! 🥃',
    vars: [{ id: 'vodka', name: 'Vodka', abv: .40 }, { id: 'rum', name: 'Rum', abv: .375 }, { id: 'tuzemak', name: 'Tuzemák', abv: .375 }, { id: 'whiskey', name: 'Whiskey', abv: .40 }, { id: 'becher', name: 'Becherovka', abv: .38, emoji: '🌿' }, { id: 'fernet', name: 'Fernet', abv: .38, emoji: '🌿' }, { id: 'slivo', name: 'Slivovice', abv: .50, emoji: '🔥' }, { id: 'jager', name: 'Jägermeister', abv: .35, emoji: '🦌' }, { id: 'tequila', name: 'Tequila', abv: .38, emoji: '🌵' }, { id: 'zelena', name: 'Zelená', abv: .20, emoji: '🍃' }] },
  nealko: { label: 'Nealko', sub: 'za řidiče', emoji: '🥤', beer: 0, xp: 4, ml: 300, def: 'water', title: 'Dneska za řidiče? 🥤', hint: 'Nealko se počítá do hydratace a dává body taky.', cta: 'Dát si! 🥤',
    vars: [{ id: 'water', name: 'Voda', abv: 0, ml: 300, emoji: '💧' }, { id: 'kofola', name: 'Kofola', abv: 0, ml: 500 }, { id: 'nealko', name: 'Nealko pivo', abv: .005, ml: 500, emoji: '🍺' }] },
};
export const ORDER: CatKey[] = ['big', 'small', 'wine', 'shot', 'nealko'];
export const CTA: Record<CatKey, string> = { big: 'Dej si pivko', small: 'Dej si malý', wine: 'Dej si vínko', shot: 'Kopni panáka', nealko: 'Piju vodu' };
export const LISTEK_LABEL: Record<CatKey, string> = { big: 'Pivko', small: 'Malý', wine: 'Vínko', shot: 'Panák', nealko: 'Voda' };

// Hlášky – v prototypu psané zpaměti; znění si nech ověřit před ostrým spuštěním (viz README).
export const QUOTES: { t: string; who: string; src: string }[] = [
  { t: 'Hmmm, pivo – příčina a řešení všech životních problémů.', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Perte mi to rovnou do žíly.', who: 'Barney Gumble', src: 'Simpsonovi' },
  { t: 'Homere, Vočko, ááá píívo!', who: 'Barney Gumble', src: 'Simpsonovi' },
  { t: 'Kdy se jen poučím? Odpovědi na složité otázky bytí a nebytí přece nenajdu na dně půllitru, ale v televizi!', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Dobře, přestaňte panikařit. Vydělám nějaké peníze tím, že prodám jedno ze svých jater. Jedno mi stačí.', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Počkejte, já bych neměl řídit. Vždyť jsem opilý jako prase.', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Poslední bar ve Springfieldu. Jestli mě nepustí dovnitř, budu asi muset přestat s pitím!', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Ticho, játra!', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Nemůžeš zavřít, budu muset domů a pít lepší pivo za poloviční cenu v přirozeném světle!', who: 'Homer Simpson', src: 'Simpsonovi' },
  { t: 'Gin a tonik? Ty se míchaj?', who: 'Vočko Szyslak', src: 'Simpsonovi' },
  { t: 'Pijte Duff! Ale s mírou!', who: 'Maskot Duff', src: 'Simpsonovi' },
  { t: 'S pivem Duff odlétnou všechny starosti jako motýlci!', who: 'Reklama na Duff', src: 'Simpsonovi' },
  { t: 'Kdo nepije s námi, pije proti nám!', who: 'Kotlolepič Babula', src: 'Hospoda' },
  { t: 'Zdar a sílu najdeš v pívu.', who: 'Babula', src: 'Hospoda' },
  { t: 'Co je to dvanáct piv? To je jako když ještěrka přeběhne přes palouček.', who: 'Babula', src: 'Hospoda' },
  { t: 'S pivíčkem je to jako se ženskejma. První pivo je jako první rande.', who: 'Babula', src: 'Hospoda' },
  { t: 'Chmelomok, božský lok!', who: 'Motto', src: 'Hospoda' },
  { t: 'V hospodě je líp, než na světě.', who: 'Dr. Zatloukal', src: 'Hospoda' },
  { t: 'Já bych zase to pivo zrzavé a mokřejší.', who: 'Dr. Zatloukal', src: 'Hospoda' },
  { t: 'Tak pánové, tady vám nesu ty vaše zrzavý štěstíčka.', who: 'Jarda Dušek', src: 'Hospoda' },
  { t: 'Stejně, když tě vidím, Tomáši, jak piješ, tak bych chtěl, aby mi takhle odtejkala vana.', who: 'Jarda Dušek', src: 'Hospoda' },
  { t: 'Tankoval jak raketoplán.', who: 'Jarda Dušek', src: 'Hospoda' },
  { t: 'Všichni chlastaj, aby si někdo předplatil třeba Vesmír, to nikdo.', who: 'Jarda Dušek', src: 'Hospoda' },
  { t: 'Protože je pátek a ze záchytky pouštěli dřív.', who: 'Jarda Dušek', src: 'Hospoda' },
  { t: 'Přece tady nebudu cucat lahváče jako nějakej puberťák!', who: 'Venca Novák', src: 'Hospoda' },
  { t: 'Alkohol nepatří mezi doporučené prostředky stresových situací.', who: 'Dr. Prášek', src: 'Hospoda' },
];

export const TITLES = ['Nováček', 'Ochutnávač', 'Hospodský host', 'Pivař', 'Štamgast', 'Pivní znalec', 'Mistr čepu', 'Sládek', 'Legenda hospody', 'Pivní bůh'];

export interface BadgeInput { totalBeers: number; maxDayBeers: number; streak: number; distinct: number; maxDayNealko: number; owl: boolean }
export interface BadgeDef { id: string; name: string; glyph: string; desc: string; f: (s: BadgeInput) => [number, number] }
export const BADGES: BadgeDef[] = [
  { id: 'first', name: 'První doušek', glyph: '01', desc: 'První zapsaný pivo', f: s => [s.totalBeers, 1] },
  { id: 'hat', name: 'Hattrick', glyph: '×3', desc: '3 piva za den', f: s => [s.maxDayBeers, 3] },
  { id: 'ten', name: 'Desítka', glyph: '10', desc: '10 piv celkem', f: s => [s.totalBeers, 10] },
  { id: 'hundred', name: 'Stovka', glyph: '100', desc: '100 piv celkem', f: s => [s.totalBeers, 100] },
  { id: 'streak', name: 'Týdenní série', glyph: '7D', desc: '7 dní v kuse', f: s => [s.streak, 7] },
  { id: 'taster', name: 'Degustátor', glyph: '5×', desc: '5 různých pitíček', f: s => [s.distinct, 5] },
  { id: 'water', name: 'Hydratace', glyph: 'H₂O', desc: '3 nealka za den', f: s => [s.maxDayNealko, 3] },
  { id: 'owl', name: 'Noční sova', glyph: '0:00', desc: 'Pivo po půlnoci', f: s => [s.owl ? 1 : 0, 1] },
  { id: 'k500', name: 'Půltisícovka', glyph: '500', desc: '500 piv celkem', f: s => [s.totalBeers, 500] },
];

export const MET: Record<Met, { label: string; b: number; desc: string }> = {
  fast: { label: 'Rychle', b: 0.2, desc: 'Spaluješ jak kamna v kotelně.' },
  normal: { label: 'Normálně', b: 0.15, desc: 'Průměrnej štamgast, nic extra.' },
  slow: { label: 'Pomalu', b: 0.1, desc: 'Drží se tě to jak klíště.' },
};

export const PUB_EMOJIS = ['🏚️', '🍻', '🛖', '🏕️', '🏠', '🎱', '⚽', '🎸'];
// Emoji avatarů ostatních v žebříčku (přiřazeno deterministicky z uid)
export const AVATARS = ['🧑‍🚀', '😎', '🐵', '🦊', '👑', '🐻', '🦁', '🔥', '🐌', '🐺', '🦉', '🐗', '🐸', '🦄', '🐧', '🦖'];
