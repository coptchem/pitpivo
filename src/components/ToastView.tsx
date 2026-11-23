import { useStore } from '../state/store';

export function ToastView() {
  const { toasts, popToast } = useStore();
  const t = toasts[0];
  if (!t) return null;
  return (
    <div key={t.id} onClick={popToast} role="status"
      style={{ position: 'fixed', top: 12, left: 12, right: 12, maxWidth: 456, margin: '0 auto', zIndex: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px 10px 10px', borderRadius: 18, background: 'var(--card)', border: '1.5px solid var(--amber)', color: 'var(--text)', boxShadow: '0 12px 36px rgba(0,0,0,.4)', animation: 'pp-toast 380ms cubic-bezier(.2,.9,.3,1.2) both', cursor: 'pointer' }}>
      <div style={{ width: 48, height: 48, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', color: 'var(--on-amber)', fontWeight: 800, fontSize: 16 }}>{t.glyph}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--amber-text)' }}>{t.kicker}</div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{t.title}</div>
      </div>
    </div>
  );
}
