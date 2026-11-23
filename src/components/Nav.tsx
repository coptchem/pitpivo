import type { ReactNode } from 'react';
import { useStore } from '../state/store';
import type { Tab } from '../lib/types';
import { Icon } from './ui';

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: 'count', label: 'Pípa', icon: () => Icon.beer(22) },
  { id: 'board', label: 'Žebříček', icon: () => Icon.trophy(22) },
  { id: 'game', label: 'Výzvy', icon: () => Icon.medal(22) },
  { id: 'profile', label: 'Profil', icon: () => Icon.user(22) },
];

export function Nav() {
  const { tab, goTab } = useStore();
  return (
    <nav style={{ position: 'sticky', bottom: 0, zIndex: 30, display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', background: 'var(--glass)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid var(--line-soft)', padding: '6px 8px calc(6px + env(safe-area-inset-bottom))' }}>
      {TABS.map(t => {
        const on = tab === t.id;
        return (
          <button key={t.id} type="button" onClick={() => goTab(t.id)} aria-current={on ? 'page' : undefined}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', minHeight: 52, borderRadius: 14, border: 0, font: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer', background: on ? 'var(--amber-tint)' : 'transparent', color: on ? 'var(--amber-text)' : 'var(--muted)' }}>
            {t.icon()}
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
