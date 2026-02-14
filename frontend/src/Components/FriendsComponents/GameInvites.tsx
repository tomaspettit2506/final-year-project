import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Box, Stack, Avatar, Badge, Button, Typography, Chip } from "@mui/material";

interface GameInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarColor?: string;
  fromUserRating?: number;
  roomId: string;
  timeControl: string;
  rated: boolean;
  createdAt: string;
}

interface GameInvitesProps {
  invites: GameInvite[];
  onAccept: (invite: GameInvite) => void;
  onDecline: (inviteId: string) => void;
}

const GameInvites: React.FC<GameInvitesProps> = ({ invites, onAccept, onDecline }) => {
  const navigate = useNavigate();
  const handleAcceptInvite = (invite: GameInvite) => {
    // Navigate to Play page with the roomId
    navigate(`/play?roomId=${invite.roomId}&autoJoin=true&isRated=${invite.rated}`);
    onAccept(invite);
  };

  return (
    <Stack spacing={2}>
      {invites.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No game invites</Typography>
        </Card>
      ) : (
        <Stack
          spacing={1}
          sx={{
            maxHeight: { xs: "60vh", sm: "70vh", md: "none" },
            overflowY: { xs: "auto", md: "visible" },
            pr: { xs: 1, md: 0 }
          }}
        >
          {invites.map((invite) => (
            <Card key={invite.id} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap={{ xs: "wrap", sm: "nowrap" }}
                gap={2}
              >
                <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 0 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  >
                    <Avatar sx={{ width: 40, height: 40, backgroundColor: invite.fromUserAvatarColor }}>
                      {invite.fromUserName.charAt(0).toUpperCase()}{invite.fromUserName.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                    </Avatar>
                  </Badge>
                  <Box sx={{ minWidth: 0 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight="500">{invite.fromUserName}</Typography>
                      {invite.fromUserRating && (
                        <Chip 
                          label={invite.fromUserRating} 
                          color="secondary" 
                          size="small" 
                        />
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      {invite.rated ? (
                        <Typography color="text.secondary" variant="body2">
                          ⏲️ {invite.timeControl} mins • 🏆 Rated
                        </Typography>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          🎮 No Timer • Casual
                        </Typography>
                      )}
                    </Box>
                    <Typography color="text.secondary" variant="caption">
                      📅 {new Date(invite.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  display="flex"
                  gap={1}
                  flexWrap="wrap"
                  sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={"🤜🤛"}
                    onClick={() => handleAcceptInvite(invite)}
                    color="success"
                    sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
                  >
                     Accept & Join
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={"❌"}
                    onClick={() => onDecline(invite.id)}
                    sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
                  >
                    Decline
                  </Button>
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default GameInvites;
