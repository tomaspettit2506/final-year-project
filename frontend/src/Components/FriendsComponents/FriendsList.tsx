import React, { useState } from "react";
import { Card, Box, Stack, TextField, InputAdornment, Avatar, 
  Badge, Chip, Button, IconButton, Menu, MenuItem, Typography, Snackbar, Alert } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";

import ChallengeDialog from "./ChallengeDialog";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  lastSeen?: string;
}

interface FriendsListProps {
  friends: Friend[];
  onRemoveFriend: (friendId: string) => void;
  onChallengeStarted?: (roomId: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, onRemoveFriend, onChallengeStarted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: "",
    severity: "success"
  });

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setChallengeDialogOpen(true);
  };

  const handleSendChallenge = async (timeControl: string, rated: boolean): Promise<string> => {
    if (!selectedFriend || !user?.email) {
      setSnackbar({
        open: true,
        message: "Error: User information missing",
        severity: "error"
      });
      throw new Error('User information missing');
    }

    try {
      // Generate a unique room ID without creating the socket room yet
      // Both players will join the room when they navigate to the game
      const roomId = `ROOM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Send game invite to friend via REST API
      const response = await fetch('/game-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.uid,
          toUserId: selectedFriend.id,
          roomId,
          timeControl,
          rated
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send challenge');
      }

      setCurrentRoomId(roomId);
      setSnackbar({
        open: true,
        message: `Challenge sent to ${selectedFriend.name}! Joining game...`,
        severity: "success"
      });

      if (onChallengeStarted) {
        onChallengeStarted(roomId);
      }

      // Navigate challenger to play page to join their own room
      setTimeout(() => {
        navigate(`/play?roomId=${roomId}&autoJoin=true`);
      }, 1000);

      return roomId;
    } catch (error: any) {
      console.error('Error sending challenge:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send challenge',
        severity: "error"
      });
      throw error;
    } finally {
    }
  };

  const handleMenuOpen = (friend: Friend, event: React.MouseEvent<HTMLElement>) => {
    setSelectedFriend(friend);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <Stack spacing={2}>
        <Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  🔍
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredFriends.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchQuery ? "No friends found" : "No friends yet. Add some friends to get started!"}
            </Typography>
          </Card>
        ) : (
          <Stack spacing={1}>
            {filteredFriends.map((friend) => (
              <Card key={friend.id} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      color="success"
                      variant={friend.online ? "dot" : undefined}
                      invisible={!friend.online}
                    >
                      <Avatar src={friend.avatar} alt={friend.name}>
                        {friend.name.charAt(0)}
                      </Avatar>
                    </Badge>

                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{friend.name}</Typography>
                        <Chip label={friend.rating} color="secondary" size="small" />
                      </Box>
                      <Typography color="text.secondary" variant="body2">
                        {friend.online ? "🟢 Online" : ` 🕒 Last seen ${friend.lastSeen}`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={"📩"}
                      onClick={() => handleChallenge(friend)}
                      disabled={false}
                    >
                      Challenge
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={"💬"}
                      disabled={!friend.online}
                    />

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(friend, e)}
                      aria-controls={menuAnchorEl ? "friend-menu" : undefined}
                      aria-haspopup="true"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            ))}
          </Stack>
        )}

        <Menu
          id="friend-menu"
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              if (selectedFriend) onRemoveFriend(selectedFriend.id);
              handleMenuClose();
            }}
            sx={{ color: "error.main" }}
          >
            Remove Friend
          </MenuItem>
        </Menu>

        {selectedFriend && (
          <ChallengeDialog
            open={challengeDialogOpen}
            onOpenChange={setChallengeDialogOpen}
            friendName={selectedFriend.name}
            onChallenge={handleSendChallenge}
          />
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? null : 6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        action={
          snackbar.severity === 'success' && currentRoomId ? (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                navigate(`/play?roomId=${currentRoomId}&autoJoin=true`);
              }}
            >
              Join Game
            </Button>
          ) : undefined
        }
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default FriendsList;