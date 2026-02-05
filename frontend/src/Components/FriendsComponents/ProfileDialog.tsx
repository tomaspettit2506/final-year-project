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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{friendName}'s Profile</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Typography>Loading profile...</Typography>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="start" gap={2}>
            <Avatar
              src={`https://www.gravatar.com/avatar/${friendEmail}`}
              alt={friendName}
              sx={{ width: 100, height: 100 }}
            >
              {friendName.charAt(0)}
            </Avatar>
            <Typography variant="h6">{friendName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {friendEmail}
            </Typography>
            <Box>
              <Typography variant="h6">Rating</Typography>
              <Chip label={`${friendRating}`} color="primary" size="small" />
            </Box>
            <Box mt={1}>
              <Typography variant="h6">Game Record</Typography>
              <Typography variant="body2">Wins: {wins}</Typography>
              <Typography variant="body2">Losses: {losses}</Typography>
              <Typography variant="body2">Draws: {draws}</Typography>
              <Typography variant="body2" fontWeight={600}>
                Total: {totalGames}
              </Typography>
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