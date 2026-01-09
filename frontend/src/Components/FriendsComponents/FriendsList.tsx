// FriendsList.tsx

import React, { useState } from "react";
import { Card, Box, Stack, TextField, InputAdornment, Avatar, 
  Badge, Chip, Button, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, onRemoveFriend }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setChallengeDialogOpen(true);
  };

  const handleSendChallenge = (timeControl: string, rated: boolean) => {
    // In a real app, this would send the challenge to the backend
    console.log(`Challenge sent to ${selectedFriend?.name}: ${timeControl}, ${rated ? 'Rated' : 'Casual'}`);
    alert(`Challenge sent to ${selectedFriend?.name}!`);
  };

  const handleMenuOpen = (friend: Friend, event: React.MouseEvent<HTMLElement>) => {
    setSelectedFriend(friend);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
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
                <SearchIcon fontSize="small" />
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
                      {friend.online ? "Online" : `Last seen ${friend.lastSeen}`}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SportsMmaIcon />}
                    onClick={() => handleChallenge(friend)}
                    disabled={!friend.online}
                  >
                    Challenge
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChatBubbleOutlineIcon />}
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
  );
}

export default FriendsList;