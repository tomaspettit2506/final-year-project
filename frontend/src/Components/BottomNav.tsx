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

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const getIconColor = (path: string) => {
    return location.pathname === path ? "#5500aa" : "#666666";
  };

  return (
    <BottomNavigation
      value={location.pathname}
      onChange={handleChange}
      showLabels
      sx={{
        width: "100%",
        position: "fixed",
        bottom: 0,
        bgcolor: "#ffffff",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 34px)",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        marginBottom: 0,
        zIndex: 1000,
      }}
    >
      <BottomNavigationAction
        label="Home"
        value="/"
        icon={<HomeIcon sx={{ color: getIconColor("/") }} />}
        sx={{
          color: location.pathname === "/" ? "#5500aa" : "#666666",
          "&.Mui-selected": {
            color: "#5500aa",
          }
        }}
      />
      <BottomNavigationAction
        label="Play"
        value="/play"
        icon={<PlayCircleFilledWhiteIcon sx={{ color: getIconColor("/play") }} />}
        sx={{
          color: location.pathname === "/play" ? "#5500aa" : "#666666",
          "&.Mui-selected": {
            color: "#5500aa",
          }
        }}
      />
      <BottomNavigationAction
        label="Tutorial"
        value="/tutorial"
        icon={<SchoolIcon sx={{ color: getIconColor("/tutorial") }} />}
        sx={{
          color: location.pathname === "/tutorial" ? "#5500aa" : "#666666",
          "&.Mui-selected": {
            color: "#5500aa",
          }
        }}
      />
      <BottomNavigationAction
        label="Friends"
        value="/friends"
        icon={<GroupIcon sx={{ color: getIconColor("/friends") }} />}
        sx={{
          color: location.pathname === "/friends" ? "#5500aa" : "#666666",
          "&.Mui-selected": {
            color: "#5500aa",
          }
        }}
      />
      <BottomNavigationAction
        label="Profile"
        value="/profile"
        icon={<AccountCircleIcon sx={{ color: getIconColor("/profile") }} />}
        sx={{
          color: location.pathname === "/profile" ? "#5500aa" : "#666666",
          "&.Mui-selected": {
            color: "#5500aa",
          }
        }}
      />
    </BottomNavigation>
  );
};

export default BottomNav;