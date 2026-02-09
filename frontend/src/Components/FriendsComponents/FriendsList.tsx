import React, { useState, useEffect, useRef } from "react";
import { Card, Box, Stack, TextField, InputAdornment, Avatar, 
  Badge, Chip, Button, IconButton, Menu, MenuItem, Typography, Snackbar, Alert } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useAuth } from "../../Context/AuthContext";
import { useTheme as useAppTheme } from "../../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import ProfileDialog from "./ProfileDialog";
import GameDialog from "./GameDialog";
import ChatDialog from "./ChatDialog";
import ChallengeDialog from "./ChallengeDialog";
import { socket } from "../../Services/socket";
import { getApiBaseUrl } from "../../Services/api";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  lastSeen?: string;
  games?: any[];
  firebaseUid?: string;
  mongoId?: string;
  email?: string;
}

interface FriendsListProps {
  friends: Friend[];
  onRemoveFriend: (friend: Friend) => Promise<void> | void;
  onChallengeStarted?: (roomId: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, onRemoveFriend, onChallengeStarted }) => {
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const navigate = useNavigate();
  const apiBaseUrl = getApiBaseUrl();
  const pendingMessageIds = useRef<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: "",
    severity: "success"
  });

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [friendGames, setFriendGames] = useState<any[]>([]);
  const [profileStats, setProfileStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  // Set up socket listeners for real-time messaging
  useEffect(() => {
    if (!user?.uid) return;

    // Join user's personal room for messages
    socket.emit('join_user_room', { userId: user.uid });

    // Listen for incoming messages
    const handleReceiveMessage = (message: any) => {
      setChatMessages((prev) => [...prev, {
        id: message.id,
        senderId: message.senderId,
        text: message.text,
        replyTo: message.replyTo,
        timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestampRaw: message.timestamp,
        read: message.read
      }]);
    };

    // Listen for message edits
    const handleMessageEdited = (message: any) => {
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, text: message.text, replyTo: message.replyTo ?? msg.replyTo } : msg
        )
      );
    };

    // Listen for message deletions
    const handleMessageDeleted = (data: any) => {
      setChatMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [user?.uid]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const computeStatsFromGames = (games: any[]) => {
    return games.reduce(
      (acc, game) => {
        // Normalize: lowercase and trim whitespace for consistent comparison
        const result = (game?.result || '').toLowerCase().trim();
        if (['win', 'won'].includes(result)) acc.wins += 1;
        else if (['loss', 'lose', 'lost'].includes(result)) acc.losses += 1;
        else if (['draw', 'tie'].includes(result)) acc.draws += 1;
        return acc;
      },
      { wins: 0, losses: 0, draws: 0 }
    );
  };

  const mapMessageForUi = (msg: any) => ({
    id: msg._id || msg.id,
    senderId: msg.senderId,
    text: msg.text,
    replyTo: msg.replyTo,
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestampRaw: msg.timestamp,
    read: msg.read
  });

  const fetchFriendGames = async (friend: Friend) => {
    let targetId = friend.mongoId;

    // If we don't have a MongoDB id yet but we do have an email, ensure the user exists and capture the _id
    if (!targetId && friend.email) {
      try {
        const res = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(friend.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: friend.name, rating: friend.rating })
        });
        if (res.ok) {
          const mongoUser = await res.json();
          targetId = mongoUser?._id;
          // Persist the mongoId on the selected friend state so subsequent requests reuse it
          setSelectedFriend((prev) => prev && prev.id === friend.id ? { ...prev, mongoId: targetId } : prev);
        }
      } catch (err) {
        console.error('Error ensuring friend exists in MongoDB:', err);
      }
    }

    targetId = targetId || friend.id;
    if (!targetId) {
      setGamesError('Could not determine friend ID');
      setFriendGames([]);
      setProfileStats({ wins: 0, losses: 0, draws: 0 });
      setSnackbar({ open: true, message: 'Could not determine friend ID for games', severity: 'error' });
      return [];
    }

    setLoadingGames(true);
    setGamesError(null);
    try {
      const res = await fetch(`/user/${targetId}/games`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to load games (status ${res.status})`);
      }
      const data = await res.json();
      setFriendGames(data || []);
      setProfileStats(computeStatsFromGames(data || []));
      return data || [];
    } catch (error: any) {
      console.error('Error fetching friend games:', error);
      setGamesError(error?.message || 'Failed to load games');
      setFriendGames([]);
      setProfileStats({ wins: 0, losses: 0, draws: 0 });
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to load games',
        severity: 'error'
      });
      return [];
    } finally {
      setLoadingGames(false);
    }
  };

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

    // Ensure the recipient exists in MongoDB and capture their _id for reliable lookup
    const ensureRecipientMongoId = async () => {
      if (selectedFriend.mongoId) return selectedFriend.mongoId;
      if (!selectedFriend.email) return null;

      try {
        const res = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(selectedFriend.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: selectedFriend.name,
            rating: selectedFriend.rating,
            firebaseUid: selectedFriend.firebaseUid
          })
        });
        if (res.ok) {
          const mongoUser = await res.json();
          setSelectedFriend((prev) => prev && prev.id === selectedFriend.id ? { ...prev, mongoId: mongoUser?._id } : prev);
          return mongoUser?._id;
        }
      } catch (err) {
        console.error('Failed to ensure recipient in MongoDB', err);
      }
      return null;
    };

    try {
      const ensuredMongoId = await ensureRecipientMongoId();

      // Generate a unique room ID without creating the socket room yet
      // Both players will join the room when they navigate to the game
      const roomId = `${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Send game invite to friend via REST API
      const response = await fetch('/game-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.uid,
          toUserId: ensuredMongoId || selectedFriend.mongoId || selectedFriend.firebaseUid || selectedFriend.id,
          roomId,
          timeControl, // timeControl is in minutes (string)
          rated
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send challenge');
      }

      setCurrentRoomId(roomId);
      setSnackbar({ open: true, message: `Challenge sent to ${selectedFriend.name}! Joining game...`,
        severity: "success"
      });

      if (onChallengeStarted) onChallengeStarted(roomId);

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

  const handleOpenChat = async (friend: Friend) => {
    setSelectedFriend(friend);
    setChatDialogOpen(true);
    
    // Fetch message history
    if (user?.uid) {
      try {
        const response = await fetch(`${apiBaseUrl}/message/${user.uid}/${friend.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const messages = await response.json();
          const fetched = (messages || []).map(mapMessageForUi);
          const fetchedIds = new Set(fetched.map((m: any) => m.id));
          setChatMessages((prev) => {
            const pending = prev.filter((m) => pendingMessageIds.current.has(m.id) && !fetchedIds.has(m.id));
            return [...fetched, ...pending];
          });
          
          // Mark messages as read
          await fetch(`${apiBaseUrl}/message/${user.uid}/read/${friend.id}`, {
            method: 'PUT',
            credentials: 'include'
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Keep pending messages even if fetch fails
      }
    }
  };

  const handleSendMessage = (text: string, friendId: string, replyToId?: string) => {
    const tempId = Math.random().toString(36).substring(2, 11);
    const nowIso = new Date().toISOString();
    const newMessage = {
      id: tempId,
      senderId: user?.uid || "",
      text,
      replyTo: replyToId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestampRaw: nowIso,
      read: false
    };
    
    // Optimistically add message to UI
    pendingMessageIds.current.add(tempId);
    setChatMessages((prev) => [...prev, newMessage]);
    
    // Emit socket event to send message
    socket.emit('send_message', {
      messageId: tempId,
      senderId: user?.uid,
      recipientId: friendId,
      text,
      replyTo: replyToId,
      timestamp: nowIso
    });
    
    // Listen for confirmation and update with server ID
    socket.once('message_sent', (data: any) => {
      if (data.messageId === tempId && data.success) {
        pendingMessageIds.current.delete(tempId);
        setChatMessages((prev) => 
          prev.map((msg) => {
            if (msg.id === tempId) {
              return {
                id: data.serverMessageId,
                senderId: msg.senderId,
                text: msg.text,
                replyTo: msg.replyTo,
                timestamp: msg.timestamp,
                timestampRaw: data.messageData.timestamp,
                read: msg.read
              };
            }
            if (msg.replyTo === tempId) {
              return { ...msg, replyTo: data.serverMessageId };
            }
            return msg;
          })
        );
      }
    });
  };

  const handleEditMessage = (messageId: string, newText: string, friendId: string) => {
    setChatMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, text: newText } : msg
      )
    );
    
    // Emit socket event to edit message
    socket.emit('edit_message', {
      messageId,
      senderId: user?.uid,
      recipientId: friendId,
      newText,
      timestamp: new Date().toISOString()
    });
  };

  const handleDeleteMessage = (messageId: string, friendId: string) => {
    setChatMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== messageId)
    );
    
    // Emit socket event to delete message
    socket.emit('delete_message', {
      messageId,
      senderId: user?.uid,
      recipientId: friendId,
      timestamp: new Date().toISOString()
    });
  };

  const handleReloadChat = async (
    friendId: string,
    options?: { before?: string; append?: boolean }
  ) => {
    if (!user?.uid) return;
    
    try {
      const params = new URLSearchParams();
      if (options?.before) params.set('before', options.before);
      const query = params.toString();
      const response = await fetch(`${apiBaseUrl}/message/${user.uid}/${friendId}${query ? `?${query}` : ''}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const messages = await response.json();
      const fetched = (messages || []).map(mapMessageForUi);
      const fetchedIds = new Set(fetched.map((m: any) => m.id));
      
      setChatMessages((prev) => {
        // Keep pending messages that haven't been confirmed yet
        const pending = prev.filter((m) => pendingMessageIds.current.has(m.id) && !fetchedIds.has(m.id));
        
        if (options?.append) {
          // When loading older messages, prepend them
          const merged = [...fetched, ...prev].filter((msg, index, arr) =>
            arr.findIndex((m) => m.id === msg.id) === index
          );
          return merged.sort((a: any, b: any) =>
            new Date(a.timestampRaw).getTime() - new Date(b.timestampRaw).getTime()
          );
        }
        
        // Normal reload: replace server messages but keep pending ones
        return [...fetched, ...pending];
      });
      return fetched;
    } catch (error) {
      console.error('Error reloading messages:', error);
      return [];
    }
  };

  const handleMenuOpen = (friend: Friend, event: React.MouseEvent<HTMLElement>) => {
    setSelectedFriend(friend);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => { setMenuAnchorEl(null); };

  const openProfileDialog = async (friend: Friend) => {
    setSelectedFriend(friend);
    setProfileDialogOpen(true);
    setLoadingProfile(true);
    if (friend.games) {
      setFriendGames(friend.games);
      setProfileStats(computeStatsFromGames(friend.games));
    }
    await fetchFriendGames(friend);
    setLoadingProfile(false);
  };

  const openGameDialog = async (friend: Friend) => {
    setSelectedFriend(friend);
    setGameDialogOpen(true);
    if (friend.games) {
      setFriendGames(friend.games);
      setProfileStats(computeStatsFromGames(friend.games));
    }
    await fetchFriendGames(friend);
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
          <Card sx={{ p: 4, textAlign: "center", bgcolor: isDark ? "background.default" : "background.paper" }}>
            <Typography color={isDark ? 'text.primary' : 'text.secondary'}>
              {searchQuery ? "No friends found" : "No friends yet. Add some friends to get started!"}
            </Typography>
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
            {filteredFriends.map((friend) => (
              <Card
                key={friend.id}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: isDark ? "background.default" : "background.paper"
                }}
              >
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
                      color="success"
                      variant={friend.online ? "dot" : undefined}
                      invisible={!friend.online}
                    >
                      <Avatar src={friend.avatar} alt={friend.name}>
                        {friend.name.charAt(0)}
                      </Avatar>
                    </Badge>

                    <Box sx={{ minWidth: 0 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{friend.name}</Typography>
                        <Chip label={friend.rating} color="secondary" size="small" />
                      </Box>
                      <Typography color="text.secondary" variant="body2">
                        {friend.online ? "🟢 Online" : ` 🕒 Last seen ${friend.lastSeen}`}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                    sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={"📩"}
                      onClick={() => handleChallenge(friend)}
                      disabled={false}
                      sx={{
                        ...(isDark ? { color: 'white', borderColor: 'white' } : { color: 'primary.main', borderColor: 'primary.main' }),
                        flex: { xs: '1 1 auto', sm: '0 0 auto' }
                      }}
                    >
                      Challenge
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={"💬"}
                      onClick={() => handleOpenChat(friend)}
                      sx={{
                        ...(isDark ? { color: 'white', borderColor: 'white' } : { color: 'primary.main', borderColor: 'primary.main' }),
                        flex: { xs: '1 1 auto', sm: '0 0 auto' }
                      }}
                    >
                      Chat
                    </Button>

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
          <MenuItem onClick={() => {
            if (selectedFriend) openProfileDialog(selectedFriend);
            handleMenuClose();
          }}>View Profile</MenuItem>

          <MenuItem onClick={() => {
            if (selectedFriend) openGameDialog(selectedFriend);
            handleMenuClose();
          }}>View Games</MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedFriend) onRemoveFriend(selectedFriend);
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

        {selectedFriend && (
          <ChatDialog
            open={chatDialogOpen}
            onOpenChange={setChatDialogOpen}
            friend={selectedFriend}
            messages={chatMessages}
            currentUserId={user?.uid || ""}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReloadChat={handleReloadChat}
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

      {selectedFriend && (
        <ProfileDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
          friendName={selectedFriend.name}
          friendEmail={selectedFriend.email || selectedFriend.username}
          friendRating={selectedFriend.rating}
          wins={profileStats.wins}
          losses={profileStats.losses}
          draws={profileStats.draws}
          isLoading={loadingProfile}
        />
      )}
      {selectedFriend && (
        <GameDialog
          open={gameDialogOpen}
          onClose={() => setGameDialogOpen(false)}
          friendName={selectedFriend.name}
          games={friendGames || []}
          loading={loadingGames}
          error={gamesError}
        />
      )}
    </>
  );
}

export default FriendsList;