import React from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FlagIcon from '@mui/icons-material/Flag';
import CachedIcon from '@mui/icons-material/Cached';

interface GameControllerProps {
  gameMode: 'ai' | 'pvp';
  onUndo?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onRedo?: () => void;
  onResign?: () => void;
  onFlip?: () => void;
  isPaused?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

const GameController: React.FC<GameControllerProps> = ({
  gameMode,
  onUndo,
  onPlay,
  onPause,
  onRedo,
  onResign,
  onFlip,
  isPaused = false,
  canUndo = true,
  canRedo = false,
}) => {

  const getIconColor = (disabled: boolean = false) => {
    return disabled ? "#888888" : "#f8f4f4";
  };

  // Render AI mode controls
  const renderAIControls = () => [
    <BottomNavigationAction 
      key="undo"
      label="Undo" 
      icon={<KeyboardArrowLeftIcon />} 
      sx={{ color: getIconColor(!canUndo) }} 
      onClick={onUndo}
      disabled={!canUndo}
    />,
    <BottomNavigationAction 
      key="redo"
      label="Redo" 
      icon={<KeyboardArrowRightIcon />} 
      sx={{ color: getIconColor(!canRedo) }} 
      onClick={onRedo}
      disabled={!canRedo}
    />,
    <BottomNavigationAction 
      key="resign"
      label="Resign" 
      icon={<FlagIcon />} 
      sx={{ color: getIconColor(false) }} 
      onClick={onResign}
    />,
    <BottomNavigationAction 
      key="flip"
      label="Flip" 
      icon={<CachedIcon />} 
      sx={{ color: getIconColor(false) }} 
      onClick={onFlip}
    />
  ];

  // Render PvP mode controls
  const renderPvPControls = () => [
    isPaused ? (
      <BottomNavigationAction 
        key="resume"
        label="Resume" 
        icon={<PlayArrowIcon />} 
        sx={{ color: getIconColor(false) }} 
        onClick={onPlay}
      />
    ) : (
      <BottomNavigationAction 
        key="pause"
        label="Pause" 
        icon={<PauseIcon />} 
        sx={{ color: getIconColor(false) }} 
        onClick={onPause}
      />
    ),
    <BottomNavigationAction 
      key="resign"
      label="Resign" 
      icon={<FlagIcon />} 
      sx={{ color: getIconColor(false) }} 
      onClick={onResign}
    />,
    <BottomNavigationAction 
      key="flip"
      label="Flip" 
      icon={<CachedIcon />} 
      sx={{ color: getIconColor(false) }} 
      onClick={onFlip}
    />
  ];

  return (
    <BottomNavigation sx={{
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
      }}>
      {gameMode === 'ai' ? renderAIControls() : renderPvPControls()}
    </BottomNavigation>
  );
};

export default GameController;