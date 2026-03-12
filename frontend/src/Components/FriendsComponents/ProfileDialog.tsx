// Profile dialog component: Looking at a friend's profile
import React from "react";
import { Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Avatar, Box
} from "@mui/material";
import { formatMemberSinceDate } from "../../Utils/memberSince";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  friendName: string;
  friendEmail: string;
  friendRating: number;
  friendAvatarColor?: string;
  games?: { result?: string; date?: string }[];
  wins: number;
  losses: number;
  draws: number;
  friendMemberSince?: string;
  timePlayedMinutes?: number;
  isLoading?: boolean;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose,
  friendName, friendEmail, friendRating, friendAvatarColor,
  games,
  wins, losses, draws, friendMemberSince, timePlayedMinutes, isLoading,
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
  const formatTimePlayed = (minutes: number): string => {
    if (minutes <= 0) return '0m';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${remainingMinutes}m`;
  };

  const timePlayedLabel = formatTimePlayed(Math.max(0, Math.floor(timePlayedMinutes ?? 0)));

  const memberSince = formatMemberSinceDate(friendMemberSince) || 'Unknown';

  const getCurrentWinStreak = (recentGames: { result?: string; date?: string }[]): number => {
    let streak = 0;

    const gamesWithIndex = recentGames.map((game, index) => {
      const parsedDate = game?.date ? new Date(game.date).getTime() : Number.NaN;
      return {
        game,
        index,
        hasValidDate: Number.isFinite(parsedDate),
        dateValue: Number.isFinite(parsedDate) ? parsedDate : 0
      };
    });

    const hasAnyValidDate = gamesWithIndex.some((entry) => entry.hasValidDate);

    const orderedGames = hasAnyValidDate
      ? [...gamesWithIndex]
          .sort((a, b) => {
            if (b.dateValue !== a.dateValue) return b.dateValue - a.dateValue;
            // Preserve original order for equal dates
            return a.index - b.index;
          })
          .map((entry) => entry.game)
      : [...recentGames].reverse();

    for (const game of orderedGames) {
      const result = (game?.result || '').toLowerCase().trim();
      if (result === 'win' || result === 'won') {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  };

  const getBestWinStreak = (recentGames: { result?: string; date?: string }[]): number => {
    if (!Array.isArray(recentGames) || recentGames.length === 0) return 0;

    let bestStreak = 0;
    let currentStreak = 0;

    for (const game of recentGames) {
      const result = (game?.result || '').toLowerCase().trim();
      if (result === 'win' || result === 'won') {
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return bestStreak;
  };

  const winStreak = getCurrentWinStreak(games || []);
  const bestStreak = getBestWinStreak(games || []);

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
                sx={{ width: 72, height: 72, backgroundColor: friendAvatarColor }}
              >
                {friendName.charAt(0).toUpperCase()}{friendName.split(' ')[1]?.charAt(0).toUpperCase() || ''}
              </Avatar>
              <Box>
                <Typography variant="h6">{friendName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {friendEmail}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
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
                <Typography variant="h6">{timePlayedLabel}</Typography>
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
              <Typography variant="body2">Member since {memberSince}</Typography>
              <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600 }}>
                  Current streak: 🔥 {winStreak} {winStreak === 1 ? 'game' : 'games'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 600 }}>
                  Best streak: 🏆 {bestStreak} {bestStreak === 1 ? 'game' : 'games'}
                </Typography>
              </Box>
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