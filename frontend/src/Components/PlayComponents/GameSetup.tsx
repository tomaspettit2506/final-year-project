import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../../Services/socket';
import { useAuth } from '../../Context/AuthContext';
import type { GameMode } from '../../Types/chess';
import { Box, Button, Card, CardContent, Grid, TextField, Typography, Alert, CircularProgress, 
  Switch, Select, MenuItem, FormControl, InputLabel, useTheme, useMediaQuery } from '@mui/material';
import { useTheme as useAppTheme } from '../../Context/ThemeContext';

interface RoomUser {
  id: string;
  name: string;
  color: 'white' | 'black';
  rating?: number;
}

interface GameSetupProps {
  onStartGame: (config: {
    gameMode: GameMode;
    difficulty: number;
    difficultyName: string;
    timerEnabled: boolean;
    timerDuration: number;
  }) => void;
  onRoomJoined?: (roomId: string, name: string, color: 'white' | 'black', isHost: boolean, timerDuration?: number, timerEnabled?: boolean, isRated?: boolean) => void;
}

const GameSetup = ({ onStartGame, onRoomJoined }: GameSetupProps) => {
  const htp = [
    { rule: "Choose your game mode: Play against AI or a friend." },
    { rule: "If playing against AI, select your desired difficulty level." },
    { rule: "If playing with a friend, create or join a room using the Room ID." },
    { rule: "Once everything is set, start the game and enjoy!" },
    { rule: "Click a piece to select it" },
    { rule: "Green dots show legal moves" },
    { rule: "Click a highlighted square to move" },
    { rule: "White starts, players alternate turns" },
    { rule: "Use drag & drop or click to move pieces"}
  ];

  const theme = useTheme();
  const { isDark } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData } = useAuth();
  const accountName = (userData?.name || user?.displayName || '').trim();
  const isAuthenticated = Boolean(user);
  const hasAccountName = Boolean(accountName);

  // AI states
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
  const [timerEnabled, setTimerEnabled] = useState(true); // Timer enabled by default for multiplayer
  const [timerDuration, setTimerDuration] = useState(600); // 10 minutes default
  const [waitingTime, setWaitingTime] = useState(0); // seconds
  const [socketReady, setSocketReady] = useState(false);
  const [isRated, setIsRated] = useState(true); // Default to rated game (matches timerEnabled default)
  const autoJoinAttemptedRef = useRef(false); // Track if auto-join has been attempted
  const [inviteSettingsLoaded, setInviteSettingsLoaded] = useState(false); // Track if invite settings have been loaded

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

  useEffect(() => {
    if (isAuthenticated && hasAccountName && name !== accountName) {
      setName(accountName);
    }
  }, [isAuthenticated, hasAccountName, accountName, name]);

  // Handle URL parameters for auto-joining
  useEffect(() => {
    const roomIdParam = searchParams.get('roomId');
    const autoJoinParam = searchParams.get('autoJoin');
    const isRatedParam = searchParams.get('isRated');
    
    if (roomIdParam && autoJoinParam === 'true') {
      console.log('[GameSetup] Auto-join detected, roomId:', roomIdParam, 'isRated:', isRatedParam);
      setSelectedMode('pvp');
      setMpStep('join');
      setRoomId(roomIdParam);
      
      // Read isRated from URL parameter
      const urlIsRated = isRatedParam === 'true';
      
      // Auto-fill name from authenticated user profile
      if (isAuthenticated && hasAccountName) {
        setName(accountName);
        console.log('[GameSetup] Auto-filled name:', accountName);
      }

      // Fetch game invite settings for this room
      if (user?.uid) {
        fetch(`/game-invite/room/${roomIdParam}`)
          .then(res => res.ok ? res.json() : null)
          .then(invite => {
            if (invite) {
              console.log('[GameSetup] Loaded game invite settings:', invite);
              const isRatedGame = invite.rated === true;
              const timeControlValue = invite.timeControl || '0';
              
              // Convert timeControl (string in minutes) to seconds
              const minutes = parseInt(timeControlValue);
              const duration = minutes > 0 ? minutes * 60 : 600; // Default to 10 mins if invalid
              
              console.log('[GameSetup] Parsed timer duration:', { timeControlValue, minutes, duration, isRatedGame });
              
              // Set timer duration - for rated games use the specified duration, for casual games set to 0
              if (isRatedGame) {
                setTimerDuration(duration);
              } else {
                setTimerDuration(0); // No timer for casual games
              }
              
              // ENFORCE: Rated games MUST have timer, Casual games MUST NOT have timer
              setTimerEnabled(isRatedGame);
              setIsRated(isRatedGame);
              
              console.log('[GameSetup] Game is', isRatedGame ? `RATED (timer enabled: ${duration}s)` : 'CASUAL (timer disabled)');
              setInviteSettingsLoaded(true); // Mark settings as loaded
            } else {
              // Fallback to URL parameter if invite not found
              console.log('[GameSetup] No invite found, using URL parameter isRated:', urlIsRated);
              setTimerEnabled(urlIsRated);
              setIsRated(urlIsRated);
              if (urlIsRated) {
                setTimerDuration(600); // Default 10 minutes for rated games
              } else {
                setTimerDuration(0); // No timer for casual games
              }
              setInviteSettingsLoaded(true); // Mark settings as loaded (using defaults)
            }
          })
          .catch(err => {
            console.error('[GameSetup] Failed to load invite settings:', err);
            // Fallback to URL parameter on error
            console.log('[GameSetup] Fetch error, using URL parameter isRated:', urlIsRated);
            setTimerEnabled(urlIsRated);
            setIsRated(urlIsRated);
            if (urlIsRated) {
              setTimerDuration(600); // Default 10 minutes for rated games
            } else {
              setTimerDuration(0); // No timer for casual games
            }
            setInviteSettingsLoaded(true); // Mark settings as loaded (using defaults)
          });
      } else {
        // If not authenticated, use URL parameter
        console.log('[GameSetup] Not authenticated, using URL parameter isRated:', urlIsRated);
        setTimerEnabled(urlIsRated);
        setIsRated(urlIsRated);
        if (urlIsRated) {
          setTimerDuration(600); // Default 10 minutes for rated games
        } else {
          setTimerDuration(0); // No timer for casual games
        }
        setInviteSettingsLoaded(true); // Mark settings as loaded
      }
    }
  }, [searchParams, isAuthenticated, hasAccountName, accountName, user?.uid]);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    // If switching to PvP, show multiplayer setup
    if (mode === 'pvp') setMpStep('choose');
    // Reset invite settings loaded flag when changing modes
    setInviteSettingsLoaded(false);
  };

  // Auto-join when coming from challenge with roomId
  useEffect(() => {
    const roomIdParam = searchParams.get('roomId');
    const autoJoinParam = searchParams.get('autoJoin');
    
    // Reset auto-join flag when roomId changes
    if (roomIdParam !== roomId) {
      autoJoinAttemptedRef.current = false;
    }
    
    // Wait for invite settings to be loaded before auto-joining
    if (roomIdParam && autoJoinParam === 'true' && name && mpStep === 'join' && !joining && socketReady && inviteSettingsLoaded && !autoJoinAttemptedRef.current) {
      console.log('[GameSetup] Auto-joining room with name:', name, 'isRated:', isRated, 'timerEnabled:', timerEnabled, 'timerDuration:', timerDuration);
      autoJoinAttemptedRef.current = true;
      // Small delay to ensure socket is ready and state is updated
      setTimeout(() => {
        handleJoinRoom();
      }, 500);
    }
  }, [name, mpStep, socketReady, isRated, timerEnabled, timerDuration, roomId, inviteSettingsLoaded]);

  // Multiplayer socket listeners
  useEffect(() => {
    const handleGameReady = (data: { players: RoomUser[]; status: string; startTime: number; timerEnabled?: boolean; timerDuration?: number; rated?: boolean }) => {
      console.log('Game is ready, both players have joined!', data);
      console.log('[GameSetup] Timer settings from server:', { timerEnabled: data.timerEnabled, timerDuration: data.timerDuration, rated: data.rated });
      setRoomUsers(data.players);
      if (data.timerEnabled !== undefined) setTimerEnabled(data.timerEnabled);
      if (data.timerDuration !== undefined) setTimerDuration(data.timerDuration);
      if (data.rated !== undefined) setIsRated(data.rated);

      // Use data.rated directly from server instead of relying on potentially stale state
      const resolvedRated = data.rated !== undefined ? data.rated : isRated;

      // Resolve the current player details from the payload (helps Player 2 who may receive
      // gameReady before the join callback finishes setting state)
      const myPlayer = data.players.find(p => p.id === socket.id);
      const resolvedColor = myPlayer?.color || playerColor || 'white';
      const resolvedName = myPlayer?.name || name;

      // Persist derived values so UI stays in sync
      if (!playerColor && myPlayer?.color) setPlayerColor(myPlayer.color);
      if (!name && myPlayer?.name) setName(myPlayer.name);

      const actualRoomId = createdRoomId || roomId;

      // Schedule the callback after state updates
      setTimeout(() => {
        if (onRoomJoined && actualRoomId) {
          console.log('Calling onRoomJoined with:', { actualRoomId, resolvedName, resolvedColor, isHost, resolvedRated });
          onRoomJoined(
            actualRoomId,
            resolvedName,
            resolvedColor,
            isHost,
            data.timerDuration || timerDuration,
            data.timerEnabled !== undefined ? data.timerEnabled : timerEnabled,
            resolvedRated
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
  }, [playerColor, createdRoomId, roomId, name, isHost, onRoomJoined, timerDuration, timerEnabled, isRated]);

  // Create Room
  const handleCreateRoom = () => {
    setError('');
    if (!isAuthenticated) {
      setError('Please log in to create a room.');
      return;
    }
    if (!hasAccountName) {
      setError('Please set your profile name before creating a room.');
      return;
    }
    
    // Mark invite settings as loaded for manual room creation
    setInviteSettingsLoaded(true);
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('[handleCreateRoom] Connecting socket before creating room');
      socket.connect();
    }
    
    const rating = userData?.rating || 1200;
    const resolvedName = accountName;
    console.log('[handleCreateRoom] Emitting createRoom with:', { name: resolvedName, timerEnabled, timerDuration, isRated, rating });
    console.log('[handleCreateRoom] Game Type:', isRated ? 'RATED' : 'CASUAL', '| Timer:', timerEnabled ? `${timerDuration}s` : 'disabled');
    socket.emit('createRoom', { name: resolvedName, timerEnabled, timerDuration, isRated, rating }, (res: { success: boolean; roomId?: string; color?: 'white' | 'black' }) => {
      console.log('[handleCreateRoom] Received callback:', res);
      if (res.success && res.roomId && res.color) {
        setCreatedRoomId(res.roomId);
        setPlayerColor(res.color);
        setIsHost(true);
        setRoomUsers([{ id: socket.id || '', name: resolvedName, color: res.color }]);
        setMpStep('waiting');
        console.log(`Room created: ${res.roomId}. You are ${res.color}. Game Type: ${isRated ? 'RATED' : 'CASUAL'} (Timer: ${timerEnabled ? timerDuration + 's' : 'disabled'}). Waiting for opponent...`);
      } else {
        setError('Failed to create room.');
      }
    });
  };

  // Join Room
  const handleJoinRoom = () => {
    setError('');
    if (!isAuthenticated) {
      setError('Please log in to join a room.');
      return;
    }
    if (!hasAccountName) {
      setError('Please set your profile name before joining a room.');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter your Room ID.');
      return;
    }
    
    // Mark invite settings as loaded for manual join (if not already loaded from URL)
    if (!inviteSettingsLoaded) {
      setInviteSettingsLoaded(true);
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
    
    const rating = userData?.rating || 1200;
    const resolvedName = accountName;
    console.log('[handleJoinRoom] Emitting joinRoom with settings:', { roomId, name: resolvedName, rating, timerEnabled, timerDuration, isRated });
    console.log('[handleJoinRoom] Game Type:', isRated ? 'RATED' : 'CASUAL', '| Timer:', timerEnabled ? `${timerDuration}s` : 'disabled');
    
    // Add a timeout to catch if the callback never fires
    const timeoutId = setTimeout(() => {
      console.error('[handleJoinRoom] No response from server after 10 seconds');
      setJoining(false);
      setError('Server did not respond. Check your Room ID and try again.');
    }, 10000);
    
    socket.emit('joinRoom', { name: resolvedName, roomId, rating, timerEnabled, timerDuration, isRated }, (res: { success: boolean; color?: 'white' | 'black'; users?: RoomUser[]; message?: string }) => {
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
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: isMobile ? 2 : 4,
      }}
    >
      <Box width="100%">
        <Box textAlign="center" mb={8}>
          {/* If you not ready to play, Tutorial Btn */}
          <Box mb={isMobile ? 4 : 6}>
            <Button
              variant="contained"
              onClick={() => navigate('/tutorial')}
              sx={{ fontSize: isMobile ? '0.9rem' : '1.1rem', px: 3, py: 1.5, bgcolor: isDark ? 'rgba(79, 70, 229, 0.25)' : 'rgba(79, 70, 229, 0.75)', 
                borderColor: '#4F46E5', color: '#ebebef', boxShadow: 3,
              "&:hover": {bgcolor: isDark ? 'rgba(79, 70, 229, 0.35)' : 'rgba(79, 70, 229, 0.85)'}}
            }
            >
              🎓 Need Help? View Tutorial
            </Button>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={4}>
            <Typography variant="h3" color="white" sx={{ fontSize: isMobile ? '1.6rem' : '3.2rem', fontWeight: 600 }}>
              👑 Are you ready to play? 👑
            </Typography>
          </Box>
          <Typography color="white" sx={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>
            Configure your game settings and start playing
          </Typography>
        </Box>

        <Card sx={{ p: isMobile ? 4 : 8, bgcolor: isDark ? 'rgba(33, 34, 34, 0.92)' : 'rgba(240, 248, 255, 0.92)', borderColor: 'divider' }}>
          <CardContent>
            <Box display="flex" flexDirection="column" gap={8}>
              {/* Game Mode Selection */}
              <Box>
                <Typography variant="h6" color="text.primary" mb={4} sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 600 }}>
                  Select Game Mode
                </Typography>
                <Grid container spacing={isMobile ? 2 : 4} sx={{ justifyContent: 'center' }}>
                  <Grid size={{xs: isMobile ? 12 : 6}}>
                    <Button
                      onClick={() => handleModeChange('ai')}
                      variant={selectedMode === 'ai' ? 'contained' : 'outlined'}
                      sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: 2,
                        borderWidth: 2,
                        bgcolor: selectedMode === 'ai' ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
                        borderColor: selectedMode === 'ai' ? '#4F46E5' : '#CBD5E1',
                        color: selectedMode === 'ai' ? '#ebebef' : '#ebebef',
                        boxShadow: selectedMode === 'ai' ? 3 : 0,
                        width: '100%',
                        height: '100%',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        "&:hover": {
                          bgcolor: selectedMode === 'ai' ? 'rgba(79, 70, 229, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <Box sx={{ color: isDark ? '#f1f1f1' : '#121212' }}>
                        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🤖</Typography>
                        <Typography sx={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 600, mb: 1 }}>
                          Play vs AI
                        </Typography>
                        <Typography variant="body1" sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                          Challenge the computer
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                  <Grid size={{xs: isMobile ? 12 : 6}}>
                    <Button
                      onClick={() => handleModeChange('pvp')}
                      variant={selectedMode === 'pvp' ? 'contained' : 'outlined'}
                      sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: 2,
                        borderWidth: 2,
                        bgcolor: selectedMode === 'pvp' ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                        borderColor: selectedMode === 'pvp' ? '#4F46E5' : '#CBD5E1',
                        color: selectedMode === 'pvp' ? '#ebebef' : '#ebebef',
                        boxShadow: selectedMode === 'pvp' ? 3 : 0,
                        width: '100%',
                        height: '100%',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        "&:hover": {
                          bgcolor: selectedMode === 'pvp' ? 'rgba(79, 70, 229, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <Box sx={{ color: isDark ? '#f1f1f1' : '#121212' }}>
                        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>👥</Typography>
                        <Typography sx={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 600, mb: 1 }}>
                          Player vs Player
                        </Typography>
                        <Typography variant="body1" sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                          Play with a friend
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* AI Difficulty (only shown for AI mode) */}
              {selectedMode === 'ai' && (
                <Box sx={{ mt: 4, bgcolor: isDark ? 'rgba(230, 230, 250, 0.6)' : 'rgba(50, 50, 50, 0.6)', p: isMobile ? 3 : 4, borderRadius: 2 }}>
                  <Typography color="text.primary" mb={2} sx={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 600 }}>
                    Select Difficulty
                  </Typography>
                  <Grid container spacing={isMobile ? 2 : 4} sx={{ justifyContent: 'center' }}>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 250 && difficultyName === 'Easy' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(250);
                          setDifficultyName('Easy');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          ...(difficulty === 250 && difficultyName === 'Easy' && {
                            bgcolor: 'rgb(34, 197, 94)',
                            borderColor: '#22C55E',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(34, 197, 94)' }
                          }) 
                        }}
                      >
                        🎯 Easy
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 550 && difficultyName === 'Medium' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(550);
                          setDifficultyName('Medium');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          ...(difficulty === 550 && difficultyName === 'Medium' && {
                            bgcolor: 'rgb(59, 130, 246)',
                            borderColor: '#3B82F6',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(59, 130, 246)' }
                          }) 
                        }}
                      >
                        🧠 Medium
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 900 && difficultyName === 'Hard' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(900);
                          setDifficultyName('Hard');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          ...(difficulty === 900 && difficultyName === 'Hard' && {
                            bgcolor: 'rgb(245, 158, 11)',
                            borderColor: '#F59E0B',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(245, 158, 11)' }
                          }) 
                        }}
                      >
                        ⭐ Hard
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 1300 && difficultyName === 'Expert' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(1300);
                          setDifficultyName('Expert');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          ...(difficulty === 1300 && difficultyName === 'Expert' && {
                            bgcolor: 'rgb(239, 68, 68)',
                            borderColor: '#EF4444',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(239, 68, 68)' }
                          }) 
                        }}
                      >
                        🏆 Expert
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 1700 && difficultyName === 'Master' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(1700);
                          setDifficultyName('Master');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          ...(difficulty === 1700 && difficultyName === 'Master' && {
                            bgcolor: 'rgb(139, 92, 246)',
                            borderColor: '#8B5CF6',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(139, 92, 246)' }
                          }) 
                        }}
                      >
                        🤖 Master
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Button
                        fullWidth
                        variant={difficulty === 2200 && difficultyName === 'Rocket' ? 'contained' : 'outlined'}
                        color="inherit"
                        onClick={() => {
                          setDifficulty(2200);
                          setDifficultyName('Rocket');
                        }}
                        sx={{ 
                          py: 1.5,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          fontWeight: 600,
                          fontFamily: difficulty === 2200 && difficultyName === 'Rocket' 
                            ? '"Courier New", "Roboto Mono", "Consolas", monospace' 
                            : 'inherit',
                          letterSpacing: difficulty === 2200 && difficultyName === 'Rocket' ? '0.1em' : 'normal',
                          textTransform: difficulty === 2200 && difficultyName === 'Rocket' ? 'uppercase' : 'none',
                          ...(difficulty === 2200 && difficultyName === 'Rocket' && {
                            bgcolor: 'rgb(20, 184, 166)',
                            borderColor: '#14B8A6',
                            color: '#f9f9f9',
                            '&:hover': { bgcolor: 'rgb(20, 184, 166)' }
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
                      <Typography variant="h6" color="text.primary" mb={3} sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 600 }}>
                        Multiplayer Setup
                      </Typography>
                      <Grid container spacing={isMobile ? 2 : 4} sx={{ justifyContent: 'center' }}>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                          <Button
                            onClick={() => setMpStep('create')}
                            variant="contained"
                            sx={{
                              p: isMobile ? 2 : 3,
                              borderRadius: 2, borderWidth: 2,
                              bgcolor: 'rgba(79, 70, 229, 0.25)', borderColor: '#4F46E5',
                              color: '#ebebef', boxShadow: 3,
                              width: isMobile ? '100%' : 'auto', height: '100%',
                              fontSize: isMobile ? '1rem' : '1.1rem',
                              "&:hover": {
                                bgcolor: 'rgba(79, 70, 229, 0.35)'
                              }
                            }}
                          >
                            <Box sx={{ color: isDark ? '#f1f1f1' : '#121212' }}>
                              🏠 Create Room
                            </Box>
                          </Button>
                        </Grid>
                        <Grid sx={{ xs: 12, sm: 6 }}>
                          <Button
                            onClick={() => setMpStep('join')}
                            variant="contained"
                            sx={{
                              p: isMobile ? 2 : 3,
                              borderRadius: 2, borderWidth: 2,
                              bgcolor: 'rgba(79, 70, 229, 0.15)', borderColor: '#4F46E5',
                              color: '#ebebef', boxShadow: 3,
                              width: isMobile ? '115%' : 'auto', height: '100%',
                              fontSize: isMobile ? '1rem' : '1.1rem',
                              "&:hover": {
                                bgcolor: 'rgba(79, 70, 229, 0.25)'
                              }
                            }}
                          >
                            <Box sx={{ color: isDark ? '#f1f1f1' : '#121212' }}>
                              🔑 Join Room
                            </Box>
                          </Button>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  {mpStep === 'create' && (
                    <>
                      <Typography variant="h6" color="text.primary" mb={2} sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 600 }}>
                        Create Room
                      </Typography>
                    {!isAuthenticated && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Please log in to create a room.
                        </Alert>
                      )}
                      {isAuthenticated && !hasAccountName && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Please set your profile name before creating a room.
                        </Alert>
                      )}
                      <TextField
                        label="Your Name"
                        value={isAuthenticated ? accountName : name}
                        onChange={e => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        disabled={isAuthenticated || !!createdRoomId}
                        helperText={
                          isAuthenticated
                            ? (hasAccountName ? 'Locked to your account name.' : 'Set your profile name to continue.')
                            : 'Log in to use multiplayer rooms.'
                        }
                        sx={{ color: 'white' }}
                      />
                      
                      {!createdRoomId && (
                        <>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mt={3} mb={2}>
                            <Box display="flex" flexDirection="column">
                              <Typography color="text.primary" sx={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 500 }}>
                                ⏲️ {timerEnabled ? 'Rated Game (with Timer)' : 'Casual Game (no Timer)'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                {timerEnabled ? 'Timer enabled • Affects rating' : 'No timer • Relaxed play'}
                              </Typography>
                            </Box>
                            <Switch
                              checked={timerEnabled}
                              onChange={(_, checked) => {
                                setTimerEnabled(checked);
                                setIsRated(checked); // Rated games require a timer, casual games don't
                                if (!checked) {
                                  setTimerDuration(0); // Reset timer duration for casual games
                                } else if (timerDuration === 0) {
                                  setTimerDuration(600); // Set default timer for rated games
                                }
                              }}
                            />
                          </Box>
                          {timerEnabled && (
                            <Box mb={3}>
                              <FormControl fullWidth>
                                <InputLabel id="timer-select-label">Time per player</InputLabel>
                                <Select
                                  labelId="timer-select-label"
                                  value={timerDuration}
                                  label="Time per player"
                                  onChange={(e) => setTimerDuration(e.target.value as number)}
                                >
                                  <MenuItem value={60}>1 minute</MenuItem>
                                  <MenuItem value={600}>10 minutes</MenuItem>
                                  <MenuItem value={900}>15 minutes</MenuItem>
                                  <MenuItem value={1800}>30 minutes</MenuItem>
                                  <MenuItem value={3600}>60 minutes</MenuItem>
                                </Select>
                              </FormControl>
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
                        <Button fullWidth variant="contained" color="primary" onClick={handleCreateRoom} disabled={!isAuthenticated || !hasAccountName} sx={{ mt: 2 }}>Create</Button>
                      )}
                      <Button fullWidth variant="text" color="secondary" onClick={() => { setMpStep('choose'); setCreatedRoomId(''); }} sx={{ mt: 2 }}>Back</Button>
                    </>
                  )}

                  {mpStep === 'join' && (
                    <>
                      <Typography variant="h6" color="text.primary" mb={2} sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 600 }}>
                        Join Room
                      </Typography>
                      {!isAuthenticated && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Please log in to join a room.
                        </Alert>
                      )}
                      {isAuthenticated && !hasAccountName && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Please set your profile name before joining a room.
                        </Alert>
                      )}
                      <TextField label="Your Name" value={isAuthenticated ? accountName : name}
                        onChange={e => setName(e.target.value)} fullWidth
                        margin="normal"
                        disabled={isAuthenticated}
                        helperText={
                          isAuthenticated
                            ? (hasAccountName ? 'Locked to your account name.' : 'Set your profile name to continue.')
                            : 'Log in to use multiplayer rooms.'
                        }
                        sx={{ color: 'white' }} />
                        
                      <TextField label="Room ID" value={roomId}
                        onChange={e => setRoomId(e.target.value.toUpperCase())}
                        fullWidth margin="normal" sx={{ color: 'white' }} />
                      <Button fullWidth variant="contained" color="primary" onClick={handleJoinRoom} sx={{ mt: 2 }} disabled={!isAuthenticated || !hasAccountName || !roomId.trim() || joining}>
                        {joining ? 'Joining...' : 'Join'}
                      </Button>
                      <Button fullWidth variant="text" color="secondary" onClick={() => setMpStep('choose')} sx={{ mt: 2 }}>Back</Button>
                    </>
                  )}

                  {mpStep === 'waiting' && (
                    <>
                      <Typography variant="h6" color="text.primary" mb={3} sx={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 600 }}>
                        {roomUsers.length === 2 ? 'Starting Game...' : 'Waiting for opponent...'}
                      </Typography>
                      <Box display="flex" justifyContent="center" mb={3}>
                        <CircularProgress />
                      </Box>
                      <Card variant="outlined" sx={{ mb: 2, color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                        <CardContent sx={{ p: 2, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                          <Typography sx={{fontSize: isMobile ? '1rem' : '1.3rem'}} variant="body2" color="textSecondary" mb={1}>Room ID: <strong>{createdRoomId || roomId}</strong></Typography>
                          <Typography sx={{fontSize: isMobile ? '1rem' : '1.3rem'}} variant="body2" color="textSecondary" mb={1}>Your Color: <strong>{playerColor?.toUpperCase()}</strong></Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: roomUsers.length === 2 ? 'bold' : 'normal', fontSize: isMobile ? '1rem' : '1.3rem' }}>
                            Players in room: {roomUsers.length}/2
                          </Typography>
                          <Typography sx={{fontSize: isMobile ? '1rem' : '1.3rem'}} variant="caption" color="textSecondary" display="block" mt={1}>
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

              <Box>
                <Typography sx={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 600 }} variant="body2" color="text.primary" component="div">
                  🚀 How To Play:
                </Typography>
                <Box component="ul" sx={{ pl: 3, color: 'text.secondary', mt: 1, fontSize: isMobile ? '0.95rem' : '1.05rem' }}>
                  {htp.map((how, index) => ( <li key={index}>{how.rule}</li> ))}
                </Box>
              </Box>

              {/* Start Game Button */}
              {selectedMode === 'ai' && (
                <Button
                  onClick={handleStartGame}
                  variant="contained"
                  sx={{ width: '100%', height: 56, 
                    bgcolor: 'rgba(124, 58, 237, 0.85)', fontSize: isMobile ? '1.1rem' : '1.3rem',
                    fontWeight: 600,
                    ':hover': { bgcolor: 'rgba(109, 40, 217, 0.9)' } 
                  }}
                  size="large">Start Game</Button>
                )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default GameSetup;