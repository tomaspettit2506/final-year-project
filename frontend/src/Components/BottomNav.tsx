import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeIcon from "@mui/icons-material/Home";
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const getIconColor = (path: string) => {
    return location.pathname === path ? "#dfd0ef" : "#f8f4f4";
  };

  return (
    <BottomNavigation value={location.pathname} onChange={handleChange} showLabels
      sx={{
        width: "100%",
        position: "fixed",
        bottom: 0,
        bgcolor: "transparent",
        backgroundImage: `
          radial-gradient(120px 80px at 10% 20%, rgba(118, 86, 255, 0.45), transparent 60%),
          radial-gradient(140px 100px at 90% 30%, rgba(255, 140, 200, 0.35), transparent 65%),
          radial-gradient(200px 120px at 30% 80%, rgba(70, 180, 255, 0.35), transparent 70%),
          linear-gradient(180deg, #0b0b1e 0%, #12122a 50%, #0a0a18 100%)
        `,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.25)",
        paddingBottom: "env(safe-area-inset-bottom, 34px)",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        marginBottom: 0,
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
    >
      <BottomNavigationAction label="Home" value="/"
        icon={<HomeIcon sx={{ color: getIconColor("/") }} />}
        className="icon-button"
        sx={{
          color: location.pathname === "/" ? "#dfd0ef" : "#ffffff",
          "&.Mui-selected": { color: "#dfd0ef" }
        }} />

      <BottomNavigationAction label="Play" value="/play"
        icon={<PlayCircleFilledWhiteIcon sx={{ color: getIconColor("/play") }} />}
        className="icon-button"
        sx={{
          color: location.pathname === "/play" ? "#dfd0ef" : "#ffffff",
          "&.Mui-selected": { color: "#dfd0ef" }
        }} />

      <BottomNavigationAction label="Tutorial" value="/tutorial"
        icon={<SchoolIcon sx={{ color: getIconColor("/tutorial") }} />}
        className="icon-button"
        sx={{
          color: location.pathname === "/tutorial" ? "#dfd0ef" : "#ffffff",
          "&.Mui-selected": { color: "#dfd0ef" }
        }} />

      <BottomNavigationAction label="Friends" value="/friends"
        icon={<GroupIcon sx={{ color: getIconColor("/friends") }} />}
        className="icon-button"
        sx={{
          color: location.pathname === "/friends" ? "#dfd0ef" : "#ffffff",
          "&.Mui-selected": { color: "#dfd0ef" }
        }} />

      <BottomNavigationAction label="Profile" value="/profile"
        icon={<AccountCircleIcon sx={{ color: getIconColor("/profile") }} />}
        className="icon-button"
        sx={{
          color: location.pathname === "/profile" ? "#dfd0ef" : "#ffffff",
          "&.Mui-selected": { color: "#dfd0ef" }
        }} />

    </BottomNavigation>
  );
};

export default BottomNav;