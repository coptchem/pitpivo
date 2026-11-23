import { bacNow, dayKey, tempoOf, type Stats } from './calc';
import type { Member, Pub, Range } from './types';
import { AVATARS } from './catalog';
import { avatarOf } from './format';

export interface Row { id: string; name: string; emoji: string; me: boolean; today: number; week: number; total: number; shots: number; bac: number; rate: number; value: number }

/** Řádky žebříčku: ostatní z users/*.stats, já z lokálních statistik (okamžitá odezva). */
export function buildBoard(members: Member[], uid: string | null, myName: string, mine: Stats, myShots: number, myBac: number, myRate: number, pub: Pub | null, range: Range, now: number): Row[] {
  const tk = dayKey(now);
  const rows: Row[] = [];
  for (const m of members) {
    if (pub && !pub.memberIds.includes(m.uid)) continue;
    if (!m.name) continue;
    if (m.uid === uid) continue;
    const s = m.stats, todayOk = !!s && s.dayKey === tk;
    rows.push({
      id: m.uid, name: m.name, emoji: m.emoji || avatarOf(m.uid, AVATARS), me: false,
      today: todayOk ? s!.today : 0, week: s?.week || 0, total: s?.total || 0, shots: todayOk ? s!.shots : 0,
      bac: bacNow(s?.bac, now),
      rate: todayOk ? tempoOf(s!.today, s!.firstAlcoAt, now) : 0, value: 0,
    });
  }
  if (uid && (!pub || pub.memberIds.includes(uid))) {
    rows.push({ id: uid, name: myName, emoji: '🍺', me: true, today: mine.today.beers, week: mine.week, total: mine.totalBeers, shots: myShots, bac: myBac, rate: myRate, value: 0 });
  }
  rows.forEach(r => { r.value = r[range]; });
  return rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'cs'));
}
