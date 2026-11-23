import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { AppProvider, useStore } from './state/store';
import { Header } from './components/Header';
import { Nav } from './components/Nav';
import { ToastView } from './components/ToastView';
import { Onboarding } from './screens/Onboarding';
import { Pipa } from './screens/Pipa';
import { Board } from './screens/Board';
import { Game } from './screens/Game';
import { Profile } from './screens/Profile';
import { DrinkSheet } from './sheets/DrinkSheet';
import { PubSheet } from './sheets/PubSheet';
import { EndDialog } from './sheets/EndDialog';
import { Listek } from './sheets/Listek';
import { normCode } from './lib/format';

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <span style={{ width: 84, height: 84, borderRadius: 26, display: 'grid', placeItems: 'center', fontSize: 46, background: 'linear-gradient(180deg,var(--amber-hi),var(--amber-lo))', boxShadow: '0 12px 36px var(--glow)', animation: 'pp-pulse 1.4s ease-in-out infinite' }}>🍺</span>
    </div>
  );
}

function Shell({ mode }: { mode: 'home' | 'join' | 'pub' }) {
  const st = useStore();
  const { authReady, uid, profileLoaded, profile, tab, ob, setOb, openPs, pendingJoin, setPendingJoin, toast } = st;
  const { code } = useParams();
  const nav = useNavigate();
  const onboarded = !!(profile && profile.name);
  const handled = useRef<string | null>(null);

  // /j/KÓD — pozvánka: onboarding rovnou ve variantě „Mám pozvánku“ s předvyplněným kódem
  useEffect(() => {
    if (!profileLoaded || mode !== 'join' || !code) return;
    const key = 'j:' + code; if (handled.current === key) return; handled.current = key;
    if (onboarded) { toast({ kicker: 'Pozvánka', title: 'Už máš vlastní účet', glyph: '👋' }); nav('/', { replace: true }); return; }
    setOb({ step: 'invite', code: normCode(code), error: '', found: null });
    nav('/', { replace: true });
  }, [profileLoaded, mode, code, onboarded, setOb, nav, toast]);
  const autoFind = useRef(false);
  useEffect(() => { if (!onboarded && ob.step === 'invite' && ob.code && !ob.found && !autoFind.current) { autoFind.current = true; void st.obFind(); } }, [onboarded, ob.step, ob.code, ob.found, st]);

  // /p/KÓD — putyka: po onboardingu otevřít sheet „Vstoupit kódem“ s předvyplněným kódem
  useEffect(() => {
    if (mode !== 'pub' || !code) return;
    const key = 'p:' + code; if (handled.current === key) return; handled.current = key;
    setPendingJoin(normCode(code)); nav('/', { replace: true });
  }, [mode, code, setPendingJoin, nav]);
  useEffect(() => {
    if (!onboarded || !pendingJoin) return;
    openPs('join', { code: pendingJoin }); setPendingJoin(null);
  }, [onboarded, pendingJoin, openPs, setPendingJoin]);

  if (!authReady || !uid || !profileLoaded) return <Splash />;
  if (!onboarded) return <><ToastView /><Onboarding /></>;
  return (
    <>
      {tab !== 'count' && <ToastView />}
      <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '6px 16px 28px' }}>
          {tab === 'count' && <Pipa />}
          {tab === 'board' && <Board />}
          {tab === 'game' && <Game />}
          {tab === 'profile' && <Profile />}
        </main>
        <Nav />
      </div>
      <DrinkSheet />
      <PubSheet />
      <EndDialog />
      <Listek />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/j/:code" element={<Shell mode="join" />} />
          <Route path="/p/:code" element={<Shell mode="pub" />} />
          <Route path="*" element={<Shell mode="home" />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
