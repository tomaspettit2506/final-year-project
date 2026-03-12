import { useEffect, useState } from 'react';
import GameSetup from '../Components/PlayComponents/GameSetup';
import GameScreen from '../Components/PlayComponents/GameScreen';
import type { GameMode } from '../Types/chess';
import { Box, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import AppBar from '../Components/AppBar';
import GameSetupTheme from '../assets/img-theme/GameSetupTheme.jpeg';

type Screen = 'setup' | 'game';

interface GameConfig {
  gameMode: GameMode;
  difficulty: number;
  timerEnabled: boolean;
  timerDuration: number;
  difficultyName: string;
  isRated?: boolean;
}


const Play = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Example breakpoint for mobile

  const [loading, setLoading] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    gameMode: 'ai',
    difficulty: 750, difficultyName: 'Easy',
    timerEnabled: false, timerDuration: 600,
    isRated: false
  });
  const [myColor, setMyColor] = useState<'white' | 'black'>('white');
  const [myName, setMyName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);

  useEffect(() => {
    // Whatever async setup Play needs (e.g. fetching user name/rating)
    const init = async () => {
      try {
        // Simulate async setup with a timeout (replace with real async calls if needed)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    // Always transition to game screen after starting (AI or PvP)
    setCurrentScreen('game');
  };

  const handleBackToSetup = () => {
    setCurrentScreen('setup');
  };

  const handleRoomJoined = (joinedRoomId: string, name: string, color: 'white' | 'black', host: boolean, timerDuration?: number, timerEnabled?: boolean, isRated?: boolean) => {
    console.log('[Play] Room joined with timer settings:', { timerEnabled, timerDuration, isRated });
    console.log('[Play] Setting gameConfig.isRated to:', isRated);
    setRoomId(joinedRoomId);
    setMyName(name);
    setMyColor(color);
    setIsHost(host);
    setGameConfig(cfg => ({ 
      ...cfg, 
      gameMode: 'pvp',
      timerDuration: timerDuration ?? cfg.timerDuration,
      timerEnabled: timerEnabled ?? cfg.timerEnabled,
      isRated: isRated ?? false  // Use explicit fallback to false instead of cfg.isRated
    }));
    setCurrentScreen('game');
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", mt: isMobile ? 20 : 15 }}>
        <CircularProgress sx={{ color: "#ffffff", fontSize: isMobile ? 10 : 20 }} />
      </Box>
    );
  }

  if (currentScreen === 'setup') {
    return (
      <Box>
        <AppBar title="Game Setup" isBackButton={true} isSettings={true} isExit={true}/>
        <Box sx={{ backgroundImage: `url(${GameSetupTheme})`, backgroundSize: 'cover', minHeight: '100vh' }}>
          <GameSetup onStartGame={handleStartGame} onRoomJoined={handleRoomJoined} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar title={`Player vs ${gameConfig.gameMode.toUpperCase()}`} isBackButton={false} isSettings={false} isExit={false}/>
      <GameScreen
        gameMode={gameConfig.gameMode}
        difficulty={gameConfig.difficulty} difficultyName={gameConfig.difficultyName}
        timerEnabled={gameConfig.timerEnabled} timerDuration={gameConfig.timerDuration}
        onBackToSetup={handleBackToSetup}
        myColor={myColor} myName={myName}
        roomId={roomId} isHost={isHost}
        isRated={gameConfig.isRated}
        // multiplayer props can be passed here in future
      />
    </Box>
  );
};
export default Play;