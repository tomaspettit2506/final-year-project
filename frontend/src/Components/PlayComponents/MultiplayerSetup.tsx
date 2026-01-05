import { useState } from 'react';
import { socket } from '../../Services/socket';
import { Box, Button, Card, CardContent, Typography, TextField, Grid, Alert } from '@mui/material';

interface MultiplayerSetupProps {
  onRoomJoined: (roomId: string, name: string, color: 'white' | 'black', isHost: boolean) => void;
}

const MultiplayerSetup: React.FC<MultiplayerSetupProps> = ({ onRoomJoined }) => {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Room
  const handleCreateRoom = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    socket.connect();
    socket.emit('createRoom', { name }, (res: { success: boolean; roomId?: string; color?: 'white' | 'black' }) => {
      if (res.success && res.roomId && res.color) {
        setCreatedRoomId(res.roomId);
        setStep('create');
        onRoomJoined(res.roomId, name, res.color, true);
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
    socket.emit('joinRoom', { name, roomId }, (res: { success: boolean; color?: 'white' | 'black'; message?: string }) => {
      setJoining(false);
      if (res.success && res.color) {
        onRoomJoined(roomId, name, res.color, false);
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
              {createdRoomId && (
                <Alert severity="success" sx={{ my: 2 }}>
                  Room created! Share this Room ID: <strong>{createdRoomId}</strong>
                </Alert>
              )}
              {!createdRoomId && (
                <Button fullWidth variant="contained" color="primary" onClick={handleCreateRoom} sx={{ mt: 2 }}>Create</Button>
              )}
              <Button fullWidth variant="text" color="secondary" onClick={() => setStep('choose')} sx={{ mt: 2 }}>Back</Button>
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
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MultiplayerSetup;
