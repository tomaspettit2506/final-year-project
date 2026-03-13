import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from "@mui/material";
import Landing from './Pages/Landing'
import Home from './Pages/Home'
import Settings from './Pages/Settings'
import Profile from './Pages/Profile'
import Play from './Pages/Play'
import Tutorial from './Pages/Tutorial'
import Friends from './Pages/Friends'
import BottomNav from './Components/BottomNav';
import Loading from './Components/Loading';
import { useTheme as useAppTheme} from './Context/ThemeContext';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from './firebase';
import { getRandomPageLoadingDelayMs, waitForMinimumDuration } from './Utils/loadingDelay';
import { clearLogoutLoadingWindow, getRemainingLogoutLoadingMs } from './Utils/logoutLoading';
import './App.css'

function App() {
  const location = useLocation();
  const muiTheme = useAppTheme();
  const [user, loading] = useAuthState(auth);
  const [showAppLoader, setShowAppLoader] = useState(true);
  const [showLogoutLoader, setShowLogoutLoader] = useState(false);
  const appLoadingStartedAt = useRef(Date.now());
  const appLoadingDelayMs = useRef(getRandomPageLoadingDelayMs());

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const finishAppLoading = async () => {
      await waitForMinimumDuration(appLoadingStartedAt.current, appLoadingDelayMs.current);
      if (!cancelled) {
        setShowAppLoader(false);
      }
    };

    finishAppLoading();

    return () => {
      cancelled = true;
    };
  }, [loading]);

  useEffect(() => {
    const remainingMs = getRemainingLogoutLoadingMs();

    if (remainingMs <= 0) {
      clearLogoutLoadingWindow();
      setShowLogoutLoader(false);
      return;
    }

    setShowLogoutLoader(true);

    const timeoutId = window.setTimeout(() => {
      clearLogoutLoadingWindow();
      setShowLogoutLoader(false);
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loading, user, location.pathname]);

  if (showLogoutLoader) {
    return <Loading isLoggingOut />;
  }

  if (loading || showAppLoader) {
    return (
      <Loading />
    );
  }

  return (
    <ThemeProvider theme={muiTheme.theme}>
      <CssBaseline />
        <div>
          <Routes>
            <Route path="/" element={user ? <Home /> : <Landing />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
            <Route path="/play" element={user ? <Play /> : <Navigate to="/" />} />
            <Route path="/tutorial" element={user ? <Tutorial /> : <Navigate to="/" />} />
            <Route path="/friends" element={user ? <Friends /> : <Navigate to="/" />} />
          </Routes>
          {user && location.pathname !== "/play" && <BottomNav />}
        </div>
    </ThemeProvider>
  );
}

export default App;
