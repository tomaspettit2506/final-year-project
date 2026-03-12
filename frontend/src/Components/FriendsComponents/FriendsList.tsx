import React, { useState, useEffect, useRef } from "react";
import { Card, Box, Stack, TextField, InputAdornment, Avatar, 
  Badge, Chip, Button, IconButton, Menu, MenuItem, Typography, Snackbar, Alert, 
  Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useAuth } from "../../Context/AuthContext";
import { useTheme as useAppTheme } from "../../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getRatingTier } from "../../Utils/eloCalculator";
import ProfileDialog from "./ProfileDialog";
import GameDialog from "./GameDialog";
import ChatDialog from "./ChatDialog";
import ChallengeDialog from "./ChallengeDialog";
import { socket } from "../../Services/socket";
import { getApiBaseUrl } from "../../Services/api";
import { deriveMemberSinceFromObjectId } from "../../Utils/memberSince";

interface Friend {
  id: string;
  name: string;
  username: string;
  rating: number;
  online: boolean;
  avatarColor?: string;
  lastSeen?: string;
  memberSince?: string;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [profileStats, setProfileStats] = useState({ wins: 0, losses: 0, draws: 0, timePlayedMinutes: 0 });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  const [handleOpenDeleteDialog, setHandleOpenDeleteDialog] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const getGameTimestamp = (game: any): number => {
    const parsed = game?.date ? new Date(game.date).getTime() : Number.NaN;
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
  };

  const sortGamesNewestFirst = (games: any[]): any[] => {
    if (!Array.isArray(games) || games.length === 0) return [];

    return games
      .map((game, index) => ({ game, index, timestamp: getGameTimestamp(game) }))
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
        // Keep original relative order for exact timestamp ties
        return a.index - b.index;
      })
      .map((entry) => entry.game);
  };

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

  // Compute wins, losses, draws, and total time played in minutes from games array
  const computeStatsFromGames = (games: any[]) => {
    const stats = games.reduce(
      (acc, game) => {
        // Normalize: lowercase and trim whitespace for consistent comparison
        const result = (game?.result || '').toLowerCase().trim();
        if (['win', 'won'].includes(result)) acc.wins += 1;
        else if (['loss', 'lose', 'lost'].includes(result)) acc.losses += 1;
        else if (['draw', 'tie'].includes(result)) acc.draws += 1;

        const durationSeconds = typeof game?.duration === 'number'
          ? game.duration
          : Number(game?.duration);
        if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
          acc.totalDurationSeconds += durationSeconds;
        }

        return acc;
      },
      { wins: 0, losses: 0, draws: 0, totalDurationSeconds: 0 }
    );

    return {
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      timePlayedMinutes: Math.floor(stats.totalDurationSeconds / 60)
    };
  };

  // Map message from server format to UI format
  const mapMessageForUi = (msg: any) => ({
    id: msg._id || msg.id,
    senderId: msg.senderId,
    text: msg.text,
    replyTo: msg.replyTo,
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestampRaw: msg.timestamp,
    read: msg.read
  });

  // Fetch friend's games, ensuring we have a MongoDB ID for reliable lookup
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
      setProfileStats({ wins: 0, losses: 0, draws: 0, timePlayedMinutes: 0 });
      setSnackbar({ open: true, message: 'Could not determine friend ID for games', severity: 'error' });
      return [];
    }

    setLoadingGames(true);
    setGamesError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/user/${targetId}/games`);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Failed to load games (status ${res.status})`);
      }
      const data = await res.json();
      const normalizedGames = sortGamesNewestFirst(data || []);
      setFriendGames(normalizedGames);
      setProfileStats(computeStatsFromGames(normalizedGames));
      return normalizedGames;
    } catch (error: any) {
      console.error('Error fetching friend games:', error);
      setGamesError(error?.message || 'Failed to load games');
      setFriendGames([]);
      setProfileStats({ wins: 0, losses: 0, draws: 0, timePlayedMinutes: 0 });
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

  // Handle sending a challenge to a friend
  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setChallengeDialogOpen(true);
  };

  // Send challenge to friend via REST API, then navigate to play page to join the game room
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
      const recipientIdentifier =
        ensuredMongoId ||
        selectedFriend.mongoId ||
        selectedFriend.firebaseUid ||
        selectedFriend.email ||
        selectedFriend.id;

      if (!recipientIdentifier) {
        throw new Error('Could not determine recipient identifier');
      }

      // Generate a unique room ID without creating the socket room yet
      // Both players will join the room when they navigate to the game
      const roomId = `${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Send game invite to friend via REST API
      const response = await fetch(`${apiBaseUrl}/game-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user.uid,
          toUserId: recipientIdentifier,
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
        navigate(`/play?roomId=${roomId}&autoJoin=true&isRated=${rated}`);
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
    }
  };

  // Handle opening chat dialog and loading message history
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

  // Handle sending a new message, with optimistic UI update and socket emission
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

  // Handle editing a message, with optimistic UI update and socket emission
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

  // Handle deleting a message, with optimistic UI update and socket emission
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

  // Handle reloading chat messages, either for initial load or when loading more history, while preserving pending messages
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

  // Handle opening the menu for a friend and setting the selected friend context
  const handleMenuOpen = (friend: Friend, event: React.MouseEvent<HTMLElement>) => {
    setSelectedFriend(friend);
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle closing the menu and clearing the selected friend context
  const handleMenuClose = () => { setMenuAnchorEl(null); };

  // Handle opening profile dialog, loading latest friend data and games for stats
  const openProfileDialog = async (friend: Friend) => {
    const initialMemberSince =
      friend.memberSince ||
      deriveMemberSinceFromObjectId(friend.mongoId) ||
      deriveMemberSinceFromObjectId(friend.id);

    setSelectedFriend({
      ...friend,
      memberSince: initialMemberSince
    });
    setProfileDialogOpen(true);
    setLoadingProfile(true);
    if (friend.games) {
      const normalizedGames = sortGamesNewestFirst(friend.games);
      setFriendGames(normalizedGames);
      setProfileStats(computeStatsFromGames(normalizedGames));
    }
    
    // Fetch latest friend data to ensure rating/memberSince are current
    try {
      const idCandidates = [friend.firebaseUid, friend.mongoId, friend.id].filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      );

      let updatedFriend: any | null = null;

      for (const candidate of idCandidates) {
        const response = await fetch(`${apiBaseUrl}/user/${encodeURIComponent(candidate)}`, {
          credentials: 'include'
        });
        if (response.ok) {
          updatedFriend = await response.json();
          break;
        }
      }

      // Legacy fallback for incomplete friend IDs OR when createdAt is missing from the first lookup
      if (friend.email && (!updatedFriend || !updatedFriend.createdAt)) {
        const byEmailResponse = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(friend.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: friend.name,
            rating: friend.rating,
            firebaseUid: friend.firebaseUid
          })
        });

        if (byEmailResponse.ok) {
          const byEmailFriend = await byEmailResponse.json();
          updatedFriend = {
            ...(updatedFriend || {}),
            ...byEmailFriend,
            createdAt: updatedFriend?.createdAt || byEmailFriend?.createdAt
          };
        }
      }

      if (updatedFriend) {
        const resolvedMemberSince =
          updatedFriend.createdAt ||
          deriveMemberSinceFromObjectId(updatedFriend._id) ||
          friend.memberSince ||
          deriveMemberSinceFromObjectId(friend.mongoId) ||
          deriveMemberSinceFromObjectId(friend.id);

        setSelectedFriend({
          ...friend,
          rating: updatedFriend.rating || friend.rating,
          mongoId: updatedFriend._id || friend.mongoId,
          firebaseUid: updatedFriend.firebaseUid || friend.firebaseUid,
          memberSince: resolvedMemberSince
        });
      }
    } catch (error) {
      console.error('Error fetching updated friend data:', error);
    }
    
    await fetchFriendGames(friend);
    setLoadingProfile(false);
};

  // Function to open game dialog and load games if not already loaded for profile
  const openGameDialog = async (friend: Friend) => {
    setSelectedFriend(friend);
    setGameDialogOpen(true);
    if (friend.games) {
      const normalizedGames = sortGamesNewestFirst(friend.games);
      setFriendGames(normalizedGames);
      setProfileStats(computeStatsFromGames(normalizedGames));
    }
    await fetchFriendGames(friend);
  };

  // Function to open delete confirmation dialog
  const openDeleteConfirmation = (friend: Friend) => {
    setSelectedFriend(friend);
    setHandleOpenDeleteDialog(true);
    setDeleteConfirmInput("");
  };

  // Function to close delete confirmation dialog
  const closeDeleteConfirmation = () => {
    setHandleOpenDeleteDialog(false);
    setSelectedFriend(null);
    setDeleteConfirmInput("");
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
            <Button sx={{ alignSelf: "flex-start", bgcolor: "#d6c3ea", color: "white", mt: 2,
                     boxShadow: isDark ? "2px 4px 8px rgba(255, 255, 255, 0.78)" : "2px 4px 8px rgba(0, 0, 0, 0.779)", fontWeight: "bold", fontSize: isMobile ? "13px" : "16px", borderRadius: "8px" }} onClick={() => navigate("/play")}>
                  Play with AI or friends 🎮
            </Button>
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
                      <Avatar sx={{ width: 40, height: 40, backgroundColor: friend.avatarColor }}>
                        {friend.name.charAt(0).toUpperCase()}{friend.name.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                      </Avatar>
                    </Badge>

                    <Box sx={{ minWidth: 0 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{friend.name}</Typography>
                        <Chip label={`${friend.rating} - ${getRatingTier(friend.rating)}`} color="secondary" size="small" />
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
                      aria-label="More actions"
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
              if (selectedFriend) openDeleteConfirmation(selectedFriend);
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
          friendAvatarColor={selectedFriend.avatarColor}
          games={friendGames}
          wins={profileStats.wins}
          losses={profileStats.losses}
          draws={profileStats.draws}
          friendMemberSince={selectedFriend.memberSince}
          timePlayedMinutes={profileStats.timePlayedMinutes}
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

      {/* Delete Confirmation Dialog */}
      {handleOpenDeleteDialog && selectedFriend && (
        <Dialog open={handleOpenDeleteDialog} onClose={closeDeleteConfirmation}>
          <DialogTitle>Confirm Friend Removal</DialogTitle>
          <DialogContent>
            <Typography>
              To confirm, please type the friend's name: <strong>{selectedFriend.name}</strong>
            </Typography>
            <TextField
              fullWidth
              margin="normal"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteConfirmation}>Cancel</Button>
            <Button
              color="error"
              disabled={deleteConfirmInput !== selectedFriend.name}
              onClick={() => {
                if (deleteConfirmInput === selectedFriend.name) {
                  onRemoveFriend(selectedFriend);
                  closeDeleteConfirmation();
                } else {
                  setSnackbar({ open: true, message: "Name does not match. Please type the exact name to confirm.", severity: "error" });
                }
              }}
            >
              Remove Friend
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default FriendsList;