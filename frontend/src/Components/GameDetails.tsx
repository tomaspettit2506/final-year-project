import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import HandshakeIcon from "@mui/icons-material/Handshake";
import FlagIcon from "@mui/icons-material/Flag";
import { useTheme } from "../Context/ThemeContext";

interface DetailsProps {
  open: boolean;
  onClose: () => void;
  gameDetails: {
    _id?: string;
    id?: string;
    playerColor?: 'white' | 'black';
    myRating?: number;
    opponent?: string;
    opponentRating?: number;
    date?: string;
    result?: 'win' | 'loss' | 'draw';
    timeControl?: number;
    termination?: string;
    moves?: number;
    duration?: number;
    myAccuracy?: number;
    opponentAccuracy?: number;
    pgn?: string;
  } | null;
}

const GameDetails: React.FC<DetailsProps> = ({ open, onClose, gameDetails }) => {
  const { isDark } = useTheme();

  // Add this to debug
  React.useEffect(() => {
    if (gameDetails) {
      console.log('Game details:', gameDetails);
      console.log('Player rating:', gameDetails.myRating);
    }
  }, [gameDetails]);

  if (!gameDetails) return null;

  const safeResult = gameDetails.result ?? 'draw';
  const safeOpponent = gameDetails.opponent ?? 'Unknown';
  const safeOpponentRating = gameDetails.opponentRating ?? 0;
  const safeDate = gameDetails.date ? new Date(gameDetails.date) : null;
  const safeTermination = gameDetails.termination ?? 'Unknown';
  const safeMoves = gameDetails.moves ?? 0;
  const safeDuration = gameDetails.duration ?? 0;
  const safeTimeControl = gameDetails.timeControl ?? 0;

  const getResultIcon = (result: string | undefined) => {
    switch (result) {
      case 'win': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'loss': return <CancelIcon sx={{ color: 'error.main' }} />;
      case 'draw': return <RemoveCircleIcon sx={{ color: 'warning.main' }} />;
      default: return null;
    }
  };

  const getTerminationText = (termination: string) => {
    switch (termination) {
      case 'checkmate': return { icon: <GavelIcon fontSize="small" />, text: 'Checkmate' };
      case 'resignation': return { icon: <FlagIcon fontSize="small" />, text: 'Resignation' };
      case 'timeout': return { icon: <TimerOffIcon fontSize="small" />, text: 'Timeout' };
      case 'draw': return { icon: <HandshakeIcon fontSize="small" />, text: 'Draw' };
      case 'abandonment': return { icon: <FlagIcon fontSize="small" />, text: 'Abandonment' };
      default: return { icon: null, text: termination };
    }
  };

  const getResultLabel = () => {
    switch (safeResult) {
      case 'win': return 'Victory';
      case 'loss': return 'Defeat';
      case 'draw': return 'Draw';
      default: return 'Unknown';
    }
  };

  // Ensure accuracy values are valid numbers between 0-100
  const myAccuracy = Math.min(100, Math.max(0, gameDetails.myAccuracy || 0));
  const opponentAccuracy = Math.min(100, Math.max(0, gameDetails.opponentAccuracy || 0));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getResultIcon(safeResult)}
          <Typography variant="h6" component="span">
            {getResultLabel()}
          </Typography>
          {safeResult === 'win' && (
            <EmojiEventsIcon sx={{ color: 'warning.main', ml: 'auto' }} />
          )}
          <IconButton
            onClick={onClose}
            sx={{ ml: safeResult !== 'win' ? 'auto' : 0 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Game played on {safeDate ? safeDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }) : 'Unknown date'}
          {safeDate && safeDate.toLocaleTimeString ? ` at ${safeDate.toLocaleTimeString()}` : ''}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Players Section */}
          <Box sx={{ bgcolor: isDark ? 'grey.900' : 'grey.50', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Matchup
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (gameDetails.playerColor || 'white') === 'white' ? 'white' : 'grey.800',
                      border: (gameDetails.playerColor || 'white') === 'white' ? '2px solid' : 'none',
                      borderColor: 'grey.300',
                    }}
                  >
                    <Typography sx={{ color: (gameDetails.playerColor || 'white') === 'white' ? 'grey.800' : 'white' }}>
                      ♔
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1">You</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating: {gameDetails.myRating || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                {safeResult === 'win' && (
                  <Chip label="Winner" color="success" size="small" />
                )}
                {safeResult === 'loss' && (
                  <Chip label="Loser" color="error" size="small" />
                )}
              </Box>

              <Divider />

              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (gameDetails.playerColor || 'white') === 'black' ? 'white' : 'grey.800',
                      border: (gameDetails.playerColor || 'white') === 'black' ? '2px solid' : 'none',
                      borderColor: 'grey.300',
                    }}
                  >
                    <Typography sx={{ color: (gameDetails.playerColor || 'white') === 'black' ? 'grey.800' : 'white' }}>
                      ♔
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1">{safeOpponent}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating: {safeOpponentRating || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                {safeResult === 'loss' && (
                  <Chip label="Winner" color="success" size="small" />
                )}
                {safeResult === 'win' && (
                  <Chip label="Loser" color="error" size="small" />
                )}
              </Box>
            </Box>
          </Box>

          {/* Game Details */}
          <Grid container spacing={2}>
            <Grid size={{xs: 6}}>
              <Typography variant="body2" color="text.secondary">
                Termination
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {getTerminationText(safeTermination).icon}
                <Typography variant="body1">
                  {getTerminationText(safeTermination).text}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{xs: 6}}>
              <Typography variant="body2" color="text.secondary">
                Total Moves
              </Typography>
              <Typography variant="body1">{safeMoves || 'N/A'}</Typography>
            </Grid>
            <Grid size={{xs: 6}}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1">{safeDuration || 'N/A'}</Typography>
            </Grid>
            <Grid size={{xs: 6}}>
              <Typography variant="body2" color="text.secondary">
                Time Control
              </Typography>
              <Typography variant="body1">{safeTimeControl || 'N/A'}</Typography>
            </Grid>
            <Grid size={{xs: 6}}>
              <Typography variant="body2" color="text.secondary">
                Game Type
              </Typography>
              <Typography variant="body1">Rated</Typography>
            </Grid>
          </Grid>

          {/* Accuracy */}
          <Box sx={{ bgcolor: isDark ? 'grey.900' : 'grey.50', color: isDark ? 'white' : 'grey.800', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Game Accuracy
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, color: isDark ? 'white' : 'grey.800' }}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Your Accuracy</Typography>
                  <Typography variant="body2">{myAccuracy}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={myAccuracy}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: isDark ? 'grey.800' : 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'success.main',
                    },
                  }}
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Opponent Accuracy</Typography>
                  <Typography variant="body2">{opponentAccuracy}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={opponentAccuracy}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: isDark ? 'grey.800' : 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'info.main',
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GameDetails;