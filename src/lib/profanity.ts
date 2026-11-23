// Jednoduchý filtr nevhodných přezdívek a názvů (sdílí ho klient i Cloud Functions).
// Normalizuje diakritiku, velikost písmen, „leet“ náhrady (0→o, 1→i, 4→a, @→a…) a mezery/tečky mezi písmeny.

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g' };

/** Kořeny slov, které v přezdívce nechceme (česky, slovensky, anglicky, nadávky a urážky skupin). */
const ROOTS = [
  // čeština / slovenština
  'kurv', 'kurev', 'kurw', 'pica', 'picu', 'pico', 'picus', 'picov', 'kokot', 'zmrd', 'mrdat', 'mrdk', 'mrdan', 'mrdn',
  'jebat', 'jebn', 'jebe', 'vyjeb', 'zajeb', 'pojeb', 'rozjeb', 'curak', 'kunda', 'kundo', 'kundi', 'pizd', 'sukat', 'sukan', 'debil', 'kreten',
  'buzna', 'buzerant', 'teplous', 'cikan', 'cigos', 'kurwa', 'hovado', 'sracka', 'zasran', 'posran', 'hajzl', 'vyser', 'chcip',
  // angličtina
  'fuck', 'fck', 'fcuk', 'shit', 'cunt', 'bitch', 'whore', 'slut', 'nigg', 'fagg', 'faggot', 'pussy', 'asshole', 'bastard', 'retard',
  // nenávist
  'hitler', 'heil', 'nazi', 'siegheil', 'kkk', 
  // sexuální
  'penis', 'vagin', 'porn', 'sex', 'orgasm', 'kurvi',
];

/** Běžná slova a jména, která obsahují „zakázaný“ kořen, ale jsou v pořádku. */
const ALLOW = ['picass', 'spice', 'kundera', 'jebav', 'essex', 'sussex', 'middlesex'];

export function normalizeName(s: string) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[0-9!|@$]/g, c => LEET[c] || c)
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1'); // „kuuuurva“ → „kuurva“
}

/** true = přezdívka / název obsahuje nevhodné slovo. */
export function isOffensive(s: string) {
  let n = normalizeName(s);
  for (const a of ALLOW) n = n.split(a).join('');
  if (!n) return false;
  const squeezed = n.replace(/(.)\1+/g, '$1'); // „kuurva“ → „kurva“
  return ROOTS.some(r => n.includes(r) || squeezed.includes(r));
}

export const OFFENSIVE_MSG = 'Tahle přezdívka neprojde. Zkus něco slušnějšího.';
