// Play.tsx

import { useState } from 'react';
import GameSetup from '../Components/PlayComponents/GameSetup';
import GameScreen from '../Components/PlayComponents/GameScreen';
import type { GameMode } from '../Types/chess';
import Box from '@mui/material/Box';
import AppBarComponent from '../Components/AppBarComponent';

type Screen = 'setup' | 'game';

interface GameConfig {
  gameMode: GameMode;
  difficulty: number;
  timerEnabled: boolean;
  timerDuration: number;
}


const Play = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    gameMode: 'ai',
    difficulty: 750,
    timerEnabled: false,
    timerDuration: 600
  });
  const [myColor, setMyColor] = useState<'white' | 'black'>('white');
  const [myName, setMyName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    // Always transition to game screen after starting (AI or PvP)
    setCurrentScreen('game');
  };

  const handleBackToSetup = () => {
    setCurrentScreen('setup');
  };

  const handleRoomJoined = (joinedRoomId: string, name: string, color: 'white' | 'black', host: boolean, timerDuration?: number, timerEnabled?: boolean) => {
    setRoomId(joinedRoomId);
    setMyName(name);
    setMyColor(color);
    setIsHost(host);
    setGameConfig(cfg => ({ 
      ...cfg, 
      gameMode: 'pvp',
      timerDuration: timerDuration ?? cfg.timerDuration,
      timerEnabled: timerEnabled ?? cfg.timerEnabled
    }));
    setCurrentScreen('game');
  };

  if (currentScreen === 'setup') {
    return (
      <Box>
        <AppBarComponent title="Game Setup" isBackButton={true} isSettings={true} isExit={true}/>
        <Box sx={{ mt: 2 }}>
          <GameSetup onStartGame={handleStartGame} onRoomJoined={handleRoomJoined} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <AppBarComponent title={`Player vs ${gameConfig.gameMode}`} isBackButton={false} isSettings={false} isExit={false}/>
      <GameScreen
        gameMode={gameConfig.gameMode}
        difficulty={gameConfig.difficulty}
        timerEnabled={gameConfig.timerEnabled}
        timerDuration={gameConfig.timerDuration}
        onBackToSetup={handleBackToSetup}
        myColor={myColor}
        myName={myName}
        roomId={roomId}
        isHost={isHost}
        // multiplayer props can be passed here in future
      />
    </Box>
  );
};

export default Play;