import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../Services/socket';
import type { GameMode } from '../../Types/chess';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { Users, Bot, Crown, Clock } from 'lucide-react';
import { Box, Grid, TextField, Alert, CircularProgress, Switch } from '@mui/material';

interface RoomUser {
  id: string;
  name: string;
  color: 'white' | 'black';
}

interface GameSetupProps {
  onStartGame: (config: {
    gameMode: GameMode;
    difficulty: number;
    difficultyName: string;
    timerEnabled: boolean;
    timerDuration: number;
  }) => void;
  onRoomJoined?: (roomId: string, name: string, color: 'white' | 'black', isHost: boolean, timerDuration?: number, timerEnabled?: boolean) => void;
}

const GameSetup = ({ onStartGame, onRoomJoined }: GameSetupProps) => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<number>(750);
  const [difficultyName, setDifficultyName] = useState<string>('Medium');
  
  // Multiplayer states
  const [mpStep, setMpStep] = useState<'choose' | 'create' | 'join' | 'waiting'>('choose');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(600); // 10 minutes default
  const [waitingTime, setWaitingTime] = useState(0); // seconds
  const [socketReady, setSocketReady] = useState(false);

  const getTimerLabel = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatWaitingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Ensure socket is connected and ready FIRST
  useEffect(() => {
    console.log('[GameSetup] Initializing socket connection');
    if (!socket.connected) {
      console.log('[GameSetup] Connecting socket...');
      socket.connect();
    } else {
      console.log('[GameSetup] Socket already connected');
    }
    setSocketReady(true);

    return () => {
      // Don't disconnect - keep socket alive
    };
  }, []);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    // If switching to PvP, show multiplayer setup
    if (mode === 'pvp') {
      setMpStep('choose');
    }
  };

  // Multiplayer socket listeners
  useEffect(() => {
    const handleGameReady = (data: { players: RoomUser[]; status: string; startTime: number; timerEnabled?: boolean; timerDuration?: number }) => {
      console.log('Game is ready, both players have joined!', data);
      setRoomUsers(data.players);
      if (data.timerEnabled !== undefined) setTimerEnabled(data.timerEnabled);
      if (data.timerDuration !== undefined) setTimerDuration(data.timerDuration);

      // Resolve the current player details from the payload (helps Player 2 who may receive
      // gameReady before the join callback finishes setting state)
      const myPlayer = data.players.find(p => p.id === socket.id);
      const resolvedColor = myPlayer?.color || playerColor || 'white';
      const resolvedName = myPlayer?.name || name;

      // Persist derived values so UI stays in sync
      if (!playerColor && myPlayer?.color) {
        setPlayerColor(myPlayer.color);
      }
      if (!name && myPlayer?.name) {
        setName(myPlayer.name);
      }

      const actualRoomId = createdRoomId || roomId;

      // Schedule the callback after state updates
      setTimeout(() => {
        if (onRoomJoined && actualRoomId) {
          console.log('Calling onRoomJoined with:', { actualRoomId, resolvedName, resolvedColor, isHost });
          onRoomJoined(
            actualRoomId,
            resolvedName,
            resolvedColor,
            isHost,
            data.timerDuration || timerDuration,
            data.timerEnabled !== undefined ? data.timerEnabled : timerEnabled
          );
        }
      }, 0);
    };

    const handleRoomUpdated = (data: { roomId: string; users: RoomUser[]; status: string }) => {
      console.log('Room updated:', data);
      setRoomUsers(data.users);
    };

    const handleRoomTimeout = (data: { message: string }) => {
      console.log('Room timeout:', data.message);
      setError(data.message);
      setMpStep('choose');
    };

    const handleOpponentDisconnected = (data: { remainingPlayers: RoomUser[] }) => {
      console.log('Opponent disconnected:', data);
      setError('Opponent disconnected. Waiting for new player to join or timeout in 5 minutes...');
      setRoomUsers(data.remainingPlayers);
      setWaitingTime(0);
    };

    socket.on('gameReady', handleGameReady);
    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomTimeout', handleRoomTimeout);
    socket.on('opponentDisconnected', handleOpponentDisconnected);

    return () => {
      socket.off('gameReady', handleGameReady);
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomTimeout', handleRoomTimeout);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
    };
  }, [playerColor, createdRoomId, roomId, name, isHost, onRoomJoined, timerDuration, timerEnabled]);

  // Create Room
  const handleCreateRoom = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('[handleCreateRoom] Connecting socket before creating room');
      socket.connect();
    }
    
    console.log('[handleCreateRoom] Emitting createRoom with name:', name);
    socket.emit('createRoom', { name, timerEnabled, timerDuration }, (res: { success: boolean; roomId?: string; color?: 'white' | 'black' }) => {
      console.log('[handleCreateRoom] Received callback:', res);
      if (res.success && res.roomId && res.color) {
        setCreatedRoomId(res.roomId);
        setPlayerColor(res.color);
        setIsHost(true);
        setRoomUsers([{ id: socket.id || '', name, color: res.color }]);
        setMpStep('waiting');
        console.log(`Room created: ${res.roomId}. You are ${res.color}. Waiting for opponent...`);
      } else {
        setError('Failed to create room.');
      }
    });
  };

  // Join Room
  const handleJoinRoom = () => {
    setError('');
    if (!name.trim() || !roomId.trim()) {
      setError('Please enter your name and Room ID.');
      return;
    }
    
    setJoining(true);
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('[handleJoinRoom] Connecting socket before joining room');
      socket.connect();
    }
    
    console.log('[handleJoinRoom] Socket state:', {
      connected: socket.connected,
      id: socket.id,
      roomId: roomId
    });
    
    console.log('[handleJoinRoom] Emitting joinRoom with roomId:', roomId, 'name:', name);
    
    // Add a timeout to catch if the callback never fires
    const timeoutId = setTimeout(() => {
      console.error('[handleJoinRoom] No response from server after 10 seconds');
      setJoining(false);
      setError('Server did not respond. Check your Room ID and try again.');
    }, 10000);
    
    socket.emit('joinRoom', { name, roomId }, (res: { success: boolean; color?: 'white' | 'black'; users?: RoomUser[]; message?: string }) => {
      clearTimeout(timeoutId);
      console.log('[handleJoinRoom] Received callback:', res);
      setJoining(false);
      
      if (res.success && res.color) {
        console.log('[handleJoinRoom] Join successful! Color:', res.color);
        setPlayerColor(res.color);
        setIsHost(false);
        if (res.users) {
          console.log('[handleJoinRoom] Room users:', res.users);
          setRoomUsers(res.users);
        }
        setMpStep('waiting');
        console.log(`Joined room: ${roomId}. You are ${res.color}. Waiting for game to start...`);
      } else {
        console.error('[handleJoinRoom] Join failed:', res.message);
        setError(res.message || 'Failed to join room. Make sure the Room ID is correct.');
      }
    });
  };

  // Handle waiting time countdown
  useEffect(() => {
    if (mpStep !== 'waiting') {
      setWaitingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [mpStep]);

  const handleCancelWaiting = () => {
    const actualRoomId = createdRoomId || roomId;
    if (actualRoomId) {
      socket.emit('cancelRoom', { roomId: actualRoomId }, (res: { success: boolean }) => {
        if (res.success) {
          console.log('Room cancelled successfully');
        }
      });
    }
    socket.disconnect();
    setMpStep('choose');
    setCreatedRoomId('');
    setRoomId('');
    setRoomUsers([]);
    setPlayerColor(null);
    setWaitingTime(0);
    setError('');
  };

  const handleStartGame = () => {
    onStartGame({
      gameMode: selectedMode,
      difficulty,
      difficultyName,
      timerEnabled: false,
      timerDuration: 600
    });
  };

  return (
    <Box
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(135deg, #0f172a, #6d28d9, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 8
      }}
    >
      <Box maxWidth="md" width="100%">
        <Box textAlign="center" mb={8}>
          {/* If you not ready to play, Tutorial Btn */}
          <Box mb={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/tutorial')}
            >
              Need Help? View Tutorial
            </Button>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={4}>
            <Crown className="w-12 h-12" style={{ color: '#facc15' }} />
            <Typography variant="h3" color="white">Are you ready to play?</Typography>
          </Box>
          <Typography color="text.secondary">Configure your game settings and start playing</Typography>
        </Box>

        <Card sx={{ p: 8, bgcolor: 'blue', borderColor: 'divider', backdropFilter: 'blur(4px)' }}>
          <CardContent>
            <Box display="flex" flexDirection="column" gap={8}>
              {/* Game Mode Selection */}
              <Box>
                <Typography variant="h6" color="white" mb={4}>Select Game Mode</Typography>
                <Grid container spacing={4}>
                  <Grid size={{xs:6}}>
                    <Button
                      onClick={() => handleModeChange('ai')}
                      variant={selectedMode === 'ai' ? 'contained' : 'outlined'}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        borderWidth: 2,
                        bgcolor: selectedMode === 'ai' ? 'primary.main' : 'background.paper',
                        color: 'white',
                        boxShadow: selectedMode === 'ai' ? 3 : 0,
                        width: '100%',
                        "&:hover": {
                          bgcolor: selectedMode === 'ai' ? 'primary.dark' : 'background.paper',
                        }
                      }}
                    >
                      <Box>
                        <Bot className="w-12 h-12 mx-auto mb-3" style={{ color: selectedMode === 'ai' ? '#a78bfa' : '#94a3b8' }} />
                        <Typography color="text.secondary" mb={1}>Play vs AI</Typography>
                        <Typography variant="body1" color="text.secondary">Challenge the computer</Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid size={{xs:6}}>
                    <Button
                      onClick={() => handleModeChange('pvp')}
                      variant={selectedMode === 'pvp' ? 'contained' : 'outlined'}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        borderWidth: 2,
                        bgcolor: selectedMode === 'pvp' ? 'primary.main' : 'background.paper',
                        color: selectedMode === 'pvp' ? 'white' : 'text.secondary',
                        boxShadow: selectedMode === 'pvp' ? 3 : 0,
                        width: '100%',
                        "&:hover": {
                          bgcolor: selectedMode === 'pvp' ? 'primary.dark' : 'background.paper',
                        }
                      }}
                    >
                      <Box>
                        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: selectedMode === 'pvp' ? '#a78bfa' : '#94a3b8' }} />
                        <Typography color="text.secondary" mb={1}>Player vs Player</Typography>
                        <Typography variant="body2" color="text.secondary">Play with a friend</Typography>
                      </Box>
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* AI Difficulty (only shown for AI mode) */}
              {selectedMode === 'ai' && (
                <Box>
                  <Typography color="white" mb={2}>Select Difficulty</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 250 && difficultyName === 'Easy' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(250);
                          setDifficultyName('Easy');
                        }}
                        sx={{ py: 1.5,
                          ...(difficulty === 250 && difficultyName === 'Easy' && {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white'
                          }) }}
                      >
                        🎯 Easy
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 550 && difficultyName === 'Medium' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(550);
                          setDifficultyName('Medium');
                        }}
                        sx={{ py: 1.5,
                          ...(difficulty === 550 && difficultyName === 'Medium' && {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white'
                          }) }}
                      >
                        🧠 Medium
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 900 && difficultyName === 'Hard' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(900);
                          setDifficultyName('Hard');
                        }}
                        sx={{ py: 1.5,
                          ...(difficulty === 900 && difficultyName === 'Hard' && {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white'
                          }) }}
                      >
                        ⭐ Hard
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 1300 && difficultyName === 'Expert' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(1300);
                          setDifficultyName('Expert');
                        }}
                        sx={{ py: 1.5,
                          ...(difficulty === 1300 && difficultyName === 'Expert' && {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white'
                          }) }}
                      >
                        🏆 Expert
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 1700 && difficultyName === 'Master' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(1700);
                          setDifficultyName('Master');
                        }}
                        sx={{ py: 1.5,
                          ...(difficulty === 1700 && difficultyName === 'Master' && {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white'
                          }) }}
                      >
                        🤖 Master
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 2200 && difficultyName === 'Rocket' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setDifficulty(2200);
                          setDifficultyName('Rocket');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontWeight: 'bold',
                          ...(difficulty === 2200 && difficultyName === 'Rocket' && {
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          })
                        }}
                      >
                        🚀🦝 Rocket
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* PvP Multiplayer Setup */}
              {selectedMode === 'pvp' && (
                <Box>
                  {mpStep === 'choose' && (
                    <>
                      <Typography variant="h6" color="white" mb={3}>Multiplayer Setup</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <Button fullWidth variant="contained" color="primary" onClick={() => setMpStep('create')}>Create Room</Button>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Button fullWidth variant="outlined" color="primary" onClick={() => setMpStep('join')}>Join Room</Button>
                        </Grid>
                      </Grid>
                    </>
                  )}

                  {mpStep === 'create' && (
                    <>
                      <Typography variant="h6" color="white" mb={2}>Create Room</Typography>
                      <TextField
                        label="Your Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={!!createdRoomId}
                        sx={{ color: 'white' }}
                      />
                      
                      {!createdRoomId && (
                        <>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mt={3} mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Clock className="w-5 h-5" style={{ color: 'white' }} />
                              <Typography color="white">Enable Timer</Typography>
                            </Box>
                            <Switch
                              checked={timerEnabled}
                              onChange={(_, checked) => setTimerEnabled(checked)}
                            />
                          </Box>
                          {timerEnabled && (
                            <Box mb={3}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography color="text.secondary">Time per player</Typography>
                                <Typography color="primary">{getTimerLabel(timerDuration)}</Typography>
                              </Box>
                              <Slider
                                value={timerDuration}
                                onChange={(_, value) => setTimerDuration(value as number)}
                                min={300}
                                max={3600}
                                step={60}
                                sx={{ width: '100%' }}
                              />
                              <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography variant="caption" color="text.secondary">5 min</Typography>
                                <Typography variant="caption" color="text.secondary">60 min</Typography>
                              </Box>
                            </Box>
                          )}
                        </>
                      )}
                      
                      {createdRoomId && (
                        <Alert severity="success" sx={{ my: 2 }}>
                          Room created! Share this Room ID: <strong>{createdRoomId}</strong>
                        </Alert>
                      )}
                      {!createdRoomId && (
                        <Button fullWidth variant="contained" color="primary" onClick={handleCreateRoom} sx={{ mt: 2 }}>Create</Button>
                      )}
                      <Button fullWidth variant="text" color="secondary" onClick={() => { setMpStep('choose'); setCreatedRoomId(''); }} sx={{ mt: 2 }}>Back</Button>
                    </>
                  )}

                  {mpStep === 'join' && (
                    <>
                      <Typography variant="h6" color="white" mb={2}>Join Room</Typography>
                      <TextField
                        label="Your Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        sx={{ color: 'white' }}
                      />
                      <TextField
                        label="Room ID"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value.toUpperCase())}
                        fullWidth
                        margin="normal"
                        sx={{ color: 'white' }}
                      />
                      <Button fullWidth variant="contained" color="primary" onClick={handleJoinRoom} sx={{ mt: 2 }} disabled={joining}>
                        {joining ? 'Joining...' : 'Join'}
                      </Button>
                      <Button fullWidth variant="text" color="secondary" onClick={() => setMpStep('choose')} sx={{ mt: 2 }}>Back</Button>
                    </>
                  )}

                  {mpStep === 'waiting' && (
                    <>
                      <Typography variant="h6" color="white" mb={3}>
                        {roomUsers.length === 2 ? 'Starting Game...' : 'Waiting for opponent...'}
                      </Typography>
                      <Box display="flex" justifyContent="center" mb={3}>
                        <CircularProgress />
                      </Box>
                      <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                        <CardContent>
                          <Typography variant="body2" color="textSecondary" mb={1}>Room ID: <strong>{createdRoomId || roomId}</strong></Typography>
                          <Typography variant="body2" color="textSecondary" mb={1}>Your Color: <strong>{playerColor?.toUpperCase()}</strong></Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: roomUsers.length === 2 ? 'bold' : 'normal' }}>
                            Players in room: {roomUsers.length}/2
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                            Waiting time: <strong>{formatWaitingTime(waitingTime)}</strong> / 5m 0s
                          </Typography>
                        </CardContent>
                      </Card>
                      {roomUsers.length > 0 && (
                        <Alert severity={roomUsers.length === 2 ? 'success' : 'info'} sx={{ mb: 2 }}>
                          {roomUsers.map(u => `${u.name} (${u.color})`).join(' vs ')}
                        </Alert>
                      )}
                      <Typography variant="caption" color="textSecondary" align="center" display="block" mb={2}>
                        {roomUsers.length === 2 ? 'Both players ready! Game starting...' : 'Waiting for the other player to join...'}
                      </Typography>
                      {roomUsers.length < 2 && (
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          color="error" 
                          onClick={handleCancelWaiting}
                          sx={{ mt: 2 }}
                        >
                          Cancel Waiting
                        </Button>
                      )}
                    </>
                  )}

                  {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
              )}

              <Typography sx={{ fontSize: "18px"}} variant="body2" color="text.secondary">How To Play:
              <ul>
                <li>Choose your game mode: Play against AI or a friend.</li>
                <li>If playing against AI, select your desired difficulty level.</li>
                <li>If playing with a friend, create or join a room using the Room ID.</li>
                <li>Once everything is set, start the game and enjoy!</li>
                <li>Click a piece to select it</li>
                <li>Green dots show legal moves</li>
                <li>Click a highlighted square to move</li>
                <li>White starts, players alternate turns</li>
              </ul>
        </Typography>

              {/* Start Game Button */}
              {selectedMode === 'ai' && (
                <Button
                  onClick={handleStartGame}
                  variant="contained"
                  color="primary"
                  sx={{ width: '100%', height: 48, bgcolor: 'purple.600', ':hover': { bgcolor: 'purple.700' } }}
                  size="large"
                >
                  Start Game
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>


        <Box mt={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Use drag & drop or click to move pieces
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default GameSetup;