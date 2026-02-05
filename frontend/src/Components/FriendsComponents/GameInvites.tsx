import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Box, Stack, Avatar, Badge, Button, Typography, Chip } from "@mui/material";

interface GameInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
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
        <Stack spacing={1}>
          {invites.map((invite) => (
            <Card key={invite.id} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  >
                    <Avatar 
                      src={invite.fromUserAvatar} 
                      alt={invite.fromUserName}
                    >
                      {invite.fromUserName.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box>
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
                      <Typography color="text.secondary" variant="body2">
                        ⏲️ {invite.timeControl} mins • {invite.rated ? "Rated" : "Casual"}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary" variant="caption">
                      📅 {new Date(invite.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={"🤜🤛"}
                    onClick={() => handleAcceptInvite(invite)}
                    color="success"
                  >
                     Accept & Join
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={"❌"}
                    onClick={() => onDecline(invite.id)}
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
