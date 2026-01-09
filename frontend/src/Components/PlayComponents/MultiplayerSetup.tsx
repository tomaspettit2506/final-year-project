// MultiplayerSetup.tsx

import { useState, useEffect } from 'react';
import { socket } from '../../Services/socket';
import { Box, Button, Card, CardContent, Typography, TextField, Grid, Alert, CircularProgress, Slider, Switch } from '@mui/material';
import { Clock } from 'lucide-react';

interface MultiplayerSetupProps {
  onRoomJoined: (roomId: string, name: string, color: 'white' | 'black', isHost: boolean, timerDuration?: number, timerEnabled?: boolean) => void;
}

interface RoomUser {
  id: string;
  name: string;
  color: 'white' | 'black';
}

const MultiplayerSetup: React.FC<MultiplayerSetupProps> = ({ onRoomJoined }) => {
  const [step, setStep] = useState<'choose' | 'create' | 'join' | 'waiting'>('choose');
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

  const getTimerLabel = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  useEffect(() => {
    // Only set up listeners when in waiting state
    if (step !== 'waiting') return;

    // Listen for game ready event (when both players join)
    const handleGameReady = (data: { players: RoomUser[]; status: string; startTime: number; timerEnabled?: boolean; timerDuration?: number }) => {
      console.log('Game is ready, both players have joined!', data);
      // Update room users
      setRoomUsers(data.players);
      // Update timer settings from host's configuration
      if (data.timerEnabled !== undefined) {
        setTimerEnabled(data.timerEnabled);
      }
      if (data.timerDuration !== undefined) {
        setTimerDuration(data.timerDuration);
      }
      // Automatically transition to game once both players are ready
      if (playerColor) {
        const actualRoomId = createdRoomId || roomId;
        console.log('Transitioning to game with roomId:', actualRoomId);
        onRoomJoined(actualRoomId, name, playerColor, isHost, data.timerDuration || timerDuration, data.timerEnabled !== undefined ? data.timerEnabled : timerEnabled);
      }
    };

    // Listen for room updates (to see other player joining)
    const handleRoomUpdated = (data: { roomId: string; users: RoomUser[]; status: string }) => {
      console.log('Room updated:', data);
      setRoomUsers(data.users);
    };

    socket.on('gameReady', handleGameReady);
    socket.on('roomUpdated', handleRoomUpdated);

    return () => {
      socket.off('gameReady', handleGameReady);
      socket.off('roomUpdated', handleRoomUpdated);
    };
  }, [step, playerColor, createdRoomId, roomId, name, isHost, onRoomJoined]);

  // Create Room
  const handleCreateRoom = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    socket.connect();
    socket.emit('createRoom', { name, timerEnabled, timerDuration }, (res: { success: boolean; roomId?: string; color?: 'white' | 'black' }) => {
      if (res.success && res.roomId && res.color) {
        setCreatedRoomId(res.roomId);
        setPlayerColor(res.color);
        setIsHost(true);
        setRoomUsers([{ id: socket.id || '', name, color: res.color }]);
        setStep('waiting');
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
    socket.connect();
    socket.emit('joinRoom', { name, roomId }, (res: { success: boolean; color?: 'white' | 'black'; users?: RoomUser[]; message?: string }) => {
      setJoining(false);
      if (res.success && res.color) {
        setPlayerColor(res.color);
        setIsHost(false);
        if (res.users) {
          setRoomUsers(res.users);
        }
        setStep('waiting');
        console.log(`Joined room: ${roomId}. You are ${res.color}. Waiting for game to start...`);
      } else {
        setError(res.message || 'Failed to join room.');
      }
    });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <Card sx={{ minWidth: 350, p: 4 }}>
        <CardContent>
          {step === 'choose' && (
            <>
              <Typography variant="h5" mb={2}>Multiplayer Setup</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Button fullWidth variant="contained" color="primary" onClick={() => setStep('create')}>Create Room</Button>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button fullWidth variant="outlined" color="primary" onClick={() => setStep('join')}>Join Room</Button>
                </Grid>
              </Grid>
            </>
          )}
          {step === 'create' && (
            <>
              <Typography variant="h6" mb={2}>Create Room</Typography>
              <TextField
                label="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
                margin="normal"
                disabled={!!createdRoomId}
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
              <Button fullWidth variant="text" color="secondary" onClick={() => { setStep('choose'); setCreatedRoomId(''); }} sx={{ mt: 2 }}>Back</Button>
            </>
          )}
          {step === 'join' && (
            <>
              <Typography variant="h6" mb={2}>Join Room</Typography>
              <TextField
                label="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Room ID"
                value={roomId}
                onChange={e => setRoomId(e.target.value.toUpperCase())}
                fullWidth
                margin="normal"
              />
              <Button fullWidth variant="contained" color="primary" onClick={handleJoinRoom} sx={{ mt: 2 }} disabled={joining}>
                {joining ? 'Joining...' : 'Join'}
              </Button>
              <Button fullWidth variant="text" color="secondary" onClick={() => setStep('choose')} sx={{ mt: 2 }}>Back</Button>
            </>
          )}
          {step === 'waiting' && (
            <>
              <Typography variant="h6" mb={3}>
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
                </CardContent>
              </Card>
              {roomUsers.length > 0 && (
                <Alert severity={roomUsers.length === 2 ? 'success' : 'info'} sx={{ mb: 2 }}>
                  {roomUsers.map(u => `${u.name} (${u.color})`).join(' vs ')}
                </Alert>
              )}
              <Typography variant="caption" color="textSecondary" align="center" display="block">
                {roomUsers.length === 2 ? 'Both players ready! Game starting...' : 'Waiting for the other player to join...'}
              </Typography>
            </>
          )}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MultiplayerSetup;
