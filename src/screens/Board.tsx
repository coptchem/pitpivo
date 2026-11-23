import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { buildBoard } from '../lib/board';
import { bacOf, tempoOf, todayDrinks } from '../lib/calc';
import { n2, pl, rel, word } from '../lib/format';
import { S } from '../components/ui';

const RANKC: [string, string][] = [['#f6c544', '#2a1c00'], ['#d5dbe2', '#1e2530'], ['#d98a3a', '#2a1400']];

export function Board() {
  const st = useStore();
  const { members, uid, profile, stats, drinks, cut, now, pubs, pubDir, pubSel, setPubSel, range, setRange, events, moved, setMoved, flash } = st;
  const pub = pubSel === 'main' ? null : pubs.find(p => p.id === pubSel) || null;
  const prof = { kg: profile?.kg ?? 80, sex: profile?.sex ?? 'm', met: profile?.met ?? 'normal' } as const;
  const todayList = todayDrinks(drinks, cut, now);
  const firstA = todayList.find(x => x.i.alco);
  const myRate = tempoOf(stats.today.beers, firstA ? firstA.d.ts : null, now);
  const myShots = todayList.filter(x => x.i.cat === 'shot').length;
  const myBac = bacOf(drinks, prof, now).bac;
  const myName = profile?.name || 'Ty';
  const board = useMemo(() => buildBoard(members, uid, myName, stats, myShots, myBac, myRate, pub, range, now), [members, uid, myName, stats, myShots, myBac, myRate, pub, range, now]);

  // ▲/▼ při změně pořadí (4,5 s) a flash řádku při novém zápisu ostatních (1,3 s)
  const prevRank = useRef<Record<string, number> | null>(null);
  const prevKey = useRef(pubSel + range);
  const orderKey = board.map(r => r.id).join('|');
  useEffect(() => {
    const cur = Object.fromEntries(board.map((r, i) => [r.id, i]));
    if (prevKey.current !== pubSel + range) { prevKey.current = pubSel + range; prevRank.current = cur; return; }
    const before = prevRank.current; prevRank.current = cur;
    if (!before) return;
    const t = Date.now(), m: Record<string, { dir: 'up' | 'down'; t: number }> = {};
    Object.keys(cur).forEach(id => { if (before[id] == null) return; if (cur[id] < before[id]) m[id] = { dir: 'up', t }; else if (cur[id] > before[id]) m[id] = { dir: 'down', t }; });
    if (Object.keys(m).length) setMoved({ ...moved, ...m });
  }, [orderKey, pubSel, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastAtRef = useRef<Record<string, number>>({});
  const [flashes, setFlashes] = useState<Record<string, number>>({});
  useEffect(() => {
    const t = Date.now(), f: Record<string, number> = {};
    members.forEach(m => { const la = m.stats?.lastAt || 0, prev = lastAtRef.current[m.uid]; lastAtRef.current[m.uid] = la; if (prev != null && la > prev && m.uid !== uid) f[m.uid] = t; });
    if (Object.keys(f).length) setFlashes(x => ({ ...x, ...f }));
  }, [members, uid]);
  const flashOn = (id: string) => (flash && flash.id === id && now - flash.t < 1300) || (flashes[id] != null && now - flashes[id] < 1300);
  const mv = (id: string, dir: 'up' | 'down') => !!(moved[id] && moved[id].dir === dir && now - moved[id].t < 4500);

  const myI = board.findIndex(r => r.me), me = board[myI];
  const rn = { today: 'dneska', week: 'tenhle týden', total: 'celkově' }[range];
  let pos: { lead: string; rest: string };
  if (!me) pos = { lead: 'Tady nejsi.', rest: 'Vyber jinou putyku.' };
  else if (myI === 0) { const lead = me.value - (board[1] ? board[1].value : 0); pos = { lead: 'Vedeš! 👑', rest: `Náskok ${lead} ${word(lead)} ${rn}. Nepolevuj.` }; }
  else { const gap = board[myI - 1].value - me.value + 1; pos = { lead: `Jsi ${myI + 1}.`, rest: `Na ${board[myI - 1].name} ti chybí ${gap} ${word(gap)}. Tak šup!` }; }

  const chips = [{ id: 'main', name: 'Hlavní lokál', emoji: '🌍' }, ...pubs];
  const pubSub = (p: typeof pubs[number]) => { const n = p.memberIds.length; return `${n} ${pl(n, 'štamgast', 'štamgasti', 'štamgastů')} · ${p.ownerId === uid ? 'tvoje putyka' : 'jsi člen'}`; };
  const feed = events.filter(e => !pub || e.pubId === pub.id || pub.memberIds.includes(e.uid)).slice(0, 6);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
      <div style={S.col(4)}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>🏆 Žebříček štamgastů</h1>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Živě. Kdo si dá, ten se hned posune.</span>
      </div>
      <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0' }}>
        {chips.map(p => {
          const on = pubSel === p.id;
          return (
            <button key={p.id} type="button" onClick={() => setPubSel(p.id)} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 99, font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', background: on ? 'var(--amber)' : 'var(--card)', color: on ? 'var(--on-amber)' : 'var(--text)', border: `1.5px solid ${on ? 'var(--amber)' : 'var(--line-soft)'}` }}>{p.emoji} {p.name}</button>
          );
        })}
        {pubDir.filter(d => !pubs.some(p => p.id === d.id)).map(d => (
          <button key={d.id} type="button" onClick={() => st.openPs('join', { name: d.name, emoji: d.emoji })} title="Vstup na kód"
            style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 99, font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', background: 'var(--card-2)', color: 'var(--muted)', border: '1.5px solid var(--line-soft)' }}>
            {d.emoji} {d.name} <span aria-hidden="true" style={{ fontSize: 12 }}>🔒</span>
          </button>
        ))}
        <button type="button" onClick={() => st.openPs('menu')} style={{ flex: 'none', minHeight: 40, padding: '0 14px', borderRadius: 99, font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', color: 'var(--amber-text)', border: '1.5px dashed var(--amber)' }}>+ Putyka</button>
      </div>
      {pub && (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '10px 14px', borderRadius: 16, background: 'var(--card)', border: '1px solid var(--line-soft)' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{pub.emoji} {pub.name}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{pubSub(pub)}</span>
        </span>
        <button type="button" onClick={() => st.openPs('detail', { pubId: pub.id })} style={{ minHeight: 38, padding: '0 14px', borderRadius: 12, background: 'var(--amber-tint)', border: '1.5px solid var(--amber)', color: 'var(--amber-text)', font: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pozvat · {pub.code}</button>
      </div>
      )}
      <div style={{ padding: '12px 14px', borderRadius: 16, background: 'var(--amber-tint)', border: '1px solid var(--line)', fontSize: 14 }}><strong>{pos.lead}</strong> {pos.rest}</div>
      <div style={S.col(8)}>
        {board.map((r, i) => {
          const fl = flashOn(r.id);
          return (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, transition: 'background .5s,border-color .5s', background: fl || r.me ? 'var(--amber-tint)' : 'var(--card)', border: `1.5px solid ${fl || r.me ? 'var(--amber)' : 'var(--line-soft)'}` }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, background: i < 3 ? RANKC[i][0] : 'var(--card-2)', color: i < 3 ? RANKC[i][1] : 'var(--muted)' }}>{i + 1}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15, minWidth: 0 }}>
                  <span>{r.emoji}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.me ? `${r.name} (ty)` : r.name}</span>
                  {r.bot && <span title="Bot štamgast" aria-label="bot" style={{ flex: 'none', padding: '1px 6px', borderRadius: 8, background: 'var(--card-2)', color: 'var(--muted)', fontSize: 11, fontWeight: 800 }}>🤖 bot</span>}
                  {mv(r.id, 'up') && <span style={{ color: 'var(--ok)', fontSize: 12 }}>▲</span>}
                  {mv(r.id, 'down') && <span style={{ color: 'var(--danger)', fontSize: 12 }}>▼</span>}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.today} {word(r.today)} · {r.shots} {pl(r.shots, 'panák', 'panáky', 'panáků')} · {n2(r.rate, 1)} piv/h</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--amber-text)', whiteSpace: 'nowrap' }}>{r.value} ks</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{n2(r.bac, 2)} ‰</span>
              </span>
            </div>
          );
        })}
        {board.length === 0 && <div style={{ padding: 14, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--line-soft)', color: 'var(--muted)', fontSize: 14 }}>Zatím tu nikdo nesedí.</div>}
      </div>
      <div style={{ ...S.card, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🍻 Kdo právě nasává</span>
        {feed.length === 0 && <span style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0', borderTop: '1px solid var(--line-soft)' }}>Zatím klid. Dej si první a rozjeď to.</span>}
        {feed.map(f => (
          <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--line-soft)', fontSize: 14 }}>
            <span><span style={{ color: f.accent || f.uid === uid ? 'var(--amber)' : 'var(--muted)' }}>●</span> {f.text}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{rel(f.ts, now)}</span>
          </div>
        ))}
      </div>
      <div style={S.segWrap(3)}>
        {([['today', 'Dnes'], ['week', 'Týden'], ['total', 'Celkem']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setRange(id)} style={{ ...S.seg(range === id), minHeight: 40 }}>{label}</button>
        ))}
      </div>
    </section>
  );
}
