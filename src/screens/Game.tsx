import { useMemo } from 'react';
import { useStore } from '../state/store';
import { buildBoard } from '../lib/board';
import { titleOf } from '../lib/calc';
import { BADGES } from '../lib/catalog';
import { pctW } from '../lib/format';
import { S } from '../components/ui';

export function Game() {
  const { stats, members, uid, profile, pubs, pubSel, now } = useStore();
  const pub = pubSel === 'main' ? null : pubs.find(p => p.id === pubSel) || null;
  const wk = useMemo(() => buildBoard(members, uid, profile?.name || 'Ty', stats, 0, 0, 0, pub, 'week', now), [members, uid, profile?.name, stats, pub, now]);
  const wi = wk.findIndex(r => r.me), above = wi > 0 ? wk[wi - 1] : null;
  const lvl = { pct: pctW(stats.xp - stats.lvlStart, stats.lvlNext - stats.lvlStart), inLevel: stats.xp - stats.lvlStart, need: stats.lvlNext - stats.lvlStart, nextTitle: titleOf(stats.level + 1) };
  const wg = stats.waterGoal, tb = stats.today.beers, tn = stats.today.nealko;
  const challenges = [
    { emoji: '🍺', title: 'Pivní týden', desc: '15 piv za posledních 7 dní', reward: '+150 XP', pct: pctW(stats.week, 15), status: stats.ch1 ? 'Hotovo ✓' : `${stats.week}/15` },
    { emoji: '💧', title: 'Pivo a voda', desc: 'Ke každejm třem dnešním pivům jedno nealko', reward: '+60 XP', pct: pctW(Math.min(tb, 3 * wg) + Math.min(tn, wg), 4 * wg), status: stats.ch2 ? 'Hotovo ✓' : `${Math.min(tb, 3 * wg)}/${3 * wg} piv · ${Math.min(tn, wg)}/${wg} nealko` },
    above ? { emoji: '🏁', title: `Předběhni: ${above.name}`, desc: 'V týdenním žebříčku', reward: 'Sláva', pct: pctW(stats.week, above.week + 1), status: `chybí ${above.week - stats.week + 1}` }
      : { emoji: '👑', title: 'Udrž korunu', desc: 'Jsi první v týdenním žebříčku', reward: 'Sláva', pct: '100%', status: '1. místo' },
  ];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 22, padding: 18, display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 16, alignItems: 'center' }}>
        <span style={{ ...S.gradCircle(84, 38), boxShadow: '0 8px 24px var(--glow)' }}>{stats.level}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={S.kicker}>Tvoje úroveň</span>
          <span style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>{stats.title}</span>
          <span style={S.progress(10)}><span style={S.progressFill(lvl.pct)} /></span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{lvl.inLevel} / {lvl.need} XP · další: {lvl.nextTitle}</span>
        </span>
      </div>
      <span style={{ ...S.kicker12, marginTop: 6 }}>Týdenní výzvy</span>
      {challenges.map(c => (
        <div key={c.title} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={S.row(10)}>
            <span style={{ fontSize: 22 }}>{c.emoji}</span>
            <span style={{ fontWeight: 800, fontSize: 16, marginRight: 'auto' }}>{c.title}</span>
            <span style={{ padding: '3px 9px', borderRadius: 99, background: 'var(--amber-tint)', color: 'var(--amber-text)', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{c.reward}</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{c.desc}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
            <span style={S.progress(8)}><span style={S.progressFill(c.pct)} /></span>
            <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{c.status}</span>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}><span style={S.kicker12}>Odznaky</span><span style={{ fontSize: 13, color: 'var(--muted)' }}>{stats.badgeCount} z {BADGES.length}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        {stats.badges.map(b => (
          <div key={b.id} style={{ background: 'var(--card)', border: `1px solid ${b.done ? 'var(--line)' : 'var(--line-soft)'}`, borderRadius: 16, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, background: b.done ? 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))' : 'var(--card-2)', color: b.done ? 'var(--on-amber)' : 'var(--muted)' }}>{b.glyph}</span>
            <span style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>{b.name}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>{b.desc}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: b.done ? 'var(--amber-text)' : 'var(--muted)' }}>{b.done ? 'Získáno ✓' : `${b.cur}/${b.goal}`}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
