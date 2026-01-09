import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CircularProgress, Box, Fade, CssBaseline, ThemeProvider } from "@mui/material";
import Landing from './Pages/Landing'
import Home from './Pages/Home'
import Settings from './Pages/Settings'
import Profile from './Pages/Profile'
import Play from './Pages/Play'
import Tutorial from './Pages/Tutorial'
import Friends from './Pages/Friends'
import BottomNav from './Components/BottomNav';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from './firebase';
import './App.css'
import { useTheme } from "./Context/ThemeContext"; // <-- Import your custom hook

function App() {
  const location = useLocation();
  const [user, loading] = useAuthState(auth);
  const { theme } = useTheme(); // <-- Use theme from context

  if (loading) {
    return (
      <Fade in={loading} timeout={{ enter: 500, exit: 500 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <CircularProgress />
        </Box>
      </Fade>
    );
  }

  return (
    <ThemeProvider theme={theme}>
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
