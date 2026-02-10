// Profile dialog component: Looking at a friend's profile
import React from "react";
import { Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Avatar, Box
} from "@mui/material";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  friendName: string;
  friendEmail: string;
  friendRating: number;
  wins: number;
  losses: number;
  draws: number;
  isLoading?: boolean;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose,
  friendName, friendEmail, friendRating,
  wins, losses, draws, isLoading,
}) => {
  const totalGames = wins + losses + draws;
  const winRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;

  // Get rating title based on rating thresholds
  const getRatingTitle = (rating: number): string => {
    if (rating >= 2400) return 'Grandmaster';
    if (rating >= 2200) return 'International Master';
    if (rating >= 2000) return 'FIDE Master';
    if (rating >= 1800) return 'Candidate Master';
    if (rating >= 1600) return 'Expert';
    if (rating >= 1400) return 'Class A';
    if (rating >= 1200) return 'Class B';
    if (rating >= 1000) return 'Class C';
    if (rating >= 800) return 'Class D';
    return 'Beginner';
  };

  const ratingTitle = getRatingTitle(friendRating);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Player Profile</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Typography>Loading profile...</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ width: 72, height: 72 }}
              >
                {friendName.charAt(0).toUpperCase()}{friendName.split(' ')[1]?.charAt(0).toUpperCase() || ''}
              </Avatar>
              <Box>
                <Typography variant="h6">{friendName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {friendEmail}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip label={`Rating ${friendRating}`} color="primary" size="small" />
                  <Chip label={ratingTitle} color="secondary" size="small" />
                  <Chip label="Online" color="success" size="small" />
                </Box>
              </Box>
            </Box>

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                <Typography variant="h6">{winRate}%</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Total Games</Typography>
                <Typography variant="h6">{totalGames}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Peak Rating</Typography>
                <Typography variant="h6">{friendRating}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Time Played</Typography>
                <Typography variant="h6">{Math.max(1, Math.round(totalGames / 10))}h</Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" gutterBottom>Game Record</Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Wins</Typography>
                <Typography variant="body2" color="success.main">{wins}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Losses</Typography>
                <Typography variant="body2" color="error.main">{losses}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Draws</Typography>
                <Typography variant="body2" color="text.secondary">{draws}</Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2">Member since January 2023</Typography>
              <Typography variant="body2">Favorite: Sicilian Defense</Typography>
              <Typography variant="body2">Win streak: {Math.min(wins, 5)} games</Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog;