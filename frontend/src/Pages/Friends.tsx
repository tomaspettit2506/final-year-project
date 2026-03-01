// Page: frontend/src/Pages/Friends.tsx
import { useState, useEffect, useRef } from "react";
import { Box, Container, Typography, Tabs, Tab, Badge, useTheme, useMediaQuery } from "@mui/material";
import { useAuth } from "../Context/AuthContext";
import { getApiBaseUrl } from "../Services/api";
import { socket } from "../Services/socket";
import { useTheme as useAppTheme } from "../Context/ThemeContext";
import FriendsList from "../Components/FriendsComponents/FriendsList";
import AddFriend from "../Components/FriendsComponents/AddFriend";
import PendingRequests from "../Components/FriendsComponents/PendingRequests";
import SentRequests from "../Components/FriendsComponents/SentRequests";
import GameInvites from "../Components/FriendsComponents/GameInvites";
import AppBar from "../Components/AppBar";

import FriendsTheme from "../assets/img-theme/FriendsTheme.jpeg";

interface Friend {
  id: string; // Prefer Firebase UID when available, otherwise Mongo _id
  name: string;
  username: string;
  rating: number;
  online: boolean;
  avatarColor?: string;
  lastSeen?: string;
  firebaseUid?: string;
  mongoId?: string;
  email?: string;
  games?: any[];
}

interface PendingRequest {
  id: string;
  name: string;
  username: string;
  rating: number;
  online: boolean;
  receivedAt: string;
}

interface SentRequest {
  id: string;
  name: string;
  username: string;
  rating: number;
  online: boolean;
  sentAt: string;
  status?: string;
}

interface GameInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRating?: number;
  roomId: string;
  timeControl: string;
  rated: boolean;
  createdAt: string;
}

const Friends = () => {
  const { user, userData } = useAuth();
  const apiBaseUrl = getApiBaseUrl();
  const { isDark } = useAppTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [gameInvites, setGameInvites] = useState<GameInvite[]>([]);
  const [tab, setTab] = useState<string>("friends");
  const [_mongoUserId, setMongoUserId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Define mapFriendFromApi function before it's used
  const mapFriendFromApi = (friend: any): Friend => {
    const populatedUser = typeof friend.friendUser === 'object' ? friend.friendUser : undefined;
    const mongoId = typeof friend.friendUser === 'string' ? friend.friendUser : populatedUser?._id;
    const firebaseUid = friend.friendFirebaseUid || populatedUser?.firebaseUid;
    const email = friend.friendEmail || populatedUser?.email;
    const name = friend.friendName || email || 'Unknown';
    const username = (email && email.split?.('@')?.[0]) || name.replace(/\s+/g, '_').toLowerCase();

    return {
      id: firebaseUid || mongoId || friend._id || username,
      firebaseUid,
      mongoId,
      email,
      name,
      username,
      rating: friend.friendRating ?? populatedUser?.rating ?? 1200,
      online: false,
      avatarColor: friend.friendAvatarColor || populatedUser?.avatarColor,
      lastSeen: friend.addedAt ? new Date(friend.addedAt).toLocaleDateString() : undefined,
      games: populatedUser?.gameRecents,
    };
  };

  const fetchFriends = async () => {
    if (!user?.uid) return;

    try {
      const res = await fetch(`${apiBaseUrl}/user/${user.uid}/friends`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setFriends((data || []).map(mapFriendFromApi));
    } catch (err) {
      console.error('Failed to fetch friends', err);
    }
  };

  // Handle horizontal scroll on mobile via swipe/drag
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!tabsRef.current) return;
    
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX.current - touchCurrentX;
    
    // Scroll the tabs horizontally
    tabsRef.current.scrollLeft += diff;
    touchStartX.current = touchCurrentX;
  };

  // Sync user to MongoDB when component mounts
  useEffect(() => {
    const syncUser = async () => {
      if (!user?.email) return;
      
      try {
        const res = await fetch(`${apiBaseUrl}/user/email/${user.email}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            name: user.displayName || userData?.name || user.email.split('@')[0],
            rating: userData?.rating || 500,
            firebaseUid: user.uid
          }),
        });
        if (res.ok) {
          const mongoUser = await res.json();
          setMongoUserId(mongoUser._id);
          // Once the user is ensured to exist in MongoDB, load their friends
          fetchFriends();
        }
      } catch (err) {
        console.error('Failed to sync user to MongoDB:', err);
      }
    };
    
    syncUser();
  }, [user, userData]);

  // Connect socket for real-time messaging
  useEffect(() => {
    if (!user?.uid) return;

    if (!socket.connected) {
      socket.connect();
    }

    // Join user's personal room for messaging
    socket.emit('join_user_room', { userId: user.uid });

    return () => {
      // Keep socket connected when leaving the page for other features
      // Only disconnect if the entire app is closing
    };
  }, [user?.uid]);

  // Listen for friend rating updates
  useEffect(() => {
    if (!user?.uid) return;

    const handleFriendRatingUpdate = (data: any) => {
      const { userId, newRating } = data;
      setFriends((prevFriends) =>
        prevFriends.map((friend) =>
          friend.firebaseUid === userId || friend.mongoId === userId || friend.id === userId
            ? { ...friend, rating: newRating }
            : friend
        )
      );
    };

    socket.on('friend_rating_updated', handleFriendRatingUpdate);

    return () => {
      socket.off('friend_rating_updated', handleFriendRatingUpdate);
    };
  }, [user?.uid]);

  // Fetch pending requests from backend
  const fetchPendingRequests = async () => {
    if (!user?.uid) return;
    
    try {
      const res = await fetch(`${apiBaseUrl}/request?userId=${user.uid}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      
      // Map backend data to PendingRequest interface
      const mapped: PendingRequest[] = (data || []).map((req: any) => {
        const name = req.fromUser?.name || req.fromUser?.email || 'Unknown';
        return {
          id: req._id || req.id,
          name,
          username: (req.fromUser?.email && req.fromUser.email.split?.('@')?.[0]) || (name.replace(/\s+/g, '_').toLowerCase()),
          rating: req.fromUser?.rating ?? 1200,
          avatarColor: req.fromUser?.avatarColor,
          online: false,
          receivedAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently',
        };
      });
      setPendingRequests(mapped);
    } catch (err: any) {
      console.error('Failed to fetch pending requests', err);
    }
  };

  // Fetch pending requests when switching to requests tab
  useEffect(() => {
    if (tab === 'requests') {
      fetchPendingRequests();
    }
    if (tab === 'sent') {
      fetchSentRequests();
    }
    if (tab === 'invites') {
      fetchGameInvites();
    }
  }, [tab]);

  // Fetch game invites from backend
  const fetchGameInvites = async () => {
    if (!user?.uid) return;
    
    try {
      const res = await fetch(`${apiBaseUrl}/game-invite?toUserId=${user.uid}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      
      // Map backend data to GameInvite interface
      const mapped: GameInvite[] = (data || []).map((invite: any) => {
        const fromUserName = invite.fromUser?.name || invite.fromUser?.email || 'Unknown';
        return {
          id: invite._id || invite.id,
          fromUserId: invite.fromUserId,
          fromUserName,
          fromUserAvatarColor: invite.fromUser?.avatarColor,
          fromUserRating: invite.fromUser?.rating ?? 1200,
          roomId: invite.roomId,
          timeControl: invite.timeControl,
          rated: invite.rated,
          createdAt: invite.createdAt || new Date().toISOString(),
        };
      });
      setGameInvites(mapped);
    } catch (err: any) {
      console.error('Failed to fetch game invites', err);
    }
  };

  // Fetch sent requests from backend
  const fetchSentRequests = async () => {
    if (!user?.uid) return;

    try {
      const res = await fetch(`${apiBaseUrl}/request/sent?userId=${user.uid}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const mapped: SentRequest[] = (data || []).map((req: any) => {
        const name = req.toUser?.name || req.toUser?.email || 'Unknown';
        return {
          id: req._id || req.id,
          name,
          username: (req.toUser?.email && req.toUser.email.split?.('@')?.[0]) || (name.replace(/\s+/g, '_').toLowerCase()),
          rating: req.toUser?.rating ?? 1200,
          avatarColor: req.toUser?.avatarColor,
          online: false,
          sentAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently',
          status: req.status || 'pending',
        };
      });
      setSentRequests(mapped);
    } catch (err: any) {
      console.error('Failed to fetch sent requests', err);
    }
  };

  // Load friends on initial render or when auth user changes
  useEffect(() => { fetchFriends(); }, [user]);

  const handleRemoveFriend = async (friend: Friend) => {
    if (!user?.uid) return;

    const targetId = friend.firebaseUid || friend.mongoId || friend.id;
    if (!targetId) return;

    try {
      const res = await fetch(`${apiBaseUrl}/user/${user.uid}/friend/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data?.friends)) {
        setFriends(data.friends.map(mapFriendFromApi));
      } else {
        // Fallback: remove locally
        setFriends((prev) => prev.filter((f) => f.id !== targetId && f.firebaseUid !== targetId && f.mongoId !== targetId));
      }
    } catch (err: any) {
      console.error('Failed to remove friend', err);
    }
  };

  const handleSendRequest = (userId: string) => {
    if (!userId || !userId.trim()) {
      console.warn("Blocked friend request: invalid userId");
      return;
    }

    console.log("Friend request sent to:", userId);
    // Refresh pending requests after a short delay to allow backend to process
    setTimeout(() => {
      fetchPendingRequests();
      fetchSentRequests();
      fetchFriends();
    }, 500);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/request/${requestId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data?.friends)) {
        setFriends(data.friends.map(mapFriendFromApi));
      } else {
        // Fallback: refresh from backend
        fetchFriends();
      }

      setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
    } catch (err: any) {
      console.error('Failed to accept friend request', err);
      // Refresh the list in case of error
      fetchPendingRequests();
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/request/${requestId}/decline`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!res.ok) throw new Error(`Status ${res.status}`);
      
      // Remove from UI
      setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
    } catch (err: any) {
      console.error('Failed to decline friend request', err);
      // Refresh the list in case of error
      fetchPendingRequests();
    }
  };

  const handleAcceptGameInvite = async (invite: GameInvite) => {
    try {
      await fetch(`${apiBaseUrl}/game-invite/${invite.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      // Remove from local state
      setGameInvites(gameInvites.filter((inv) => inv.id !== invite.id));
    } catch (err: any) {
      console.error('Failed to accept game invite', err);
    }
  };

  const handleDeclineGameInvite = async (inviteId: string) => {
    try {
      await fetch(`${apiBaseUrl}/game-invite/${inviteId}/decline`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      // Remove from local state
      setGameInvites(gameInvites.filter((inv) => inv.id !== inviteId));
    } catch (err: any) {
      console.error('Failed to decline game invite', err);
    }
  };

  const pageBg = isDark ? "#000000" : "#ffffff";
  const panelBg = isDark ? "#000000d0" : "#ffffffd0";

  return (
    <>
    <AppBar isBackButton={false} isSettings={true} isExit={true} />
    <Box sx={{ minHeight: "150vh", bgcolor: pageBg, py: 6, backgroundImage: `url(${FriendsTheme})`, backgroundSize: isMobile ? 'cover' : '100%', backgroundPosition: 'center' }}>
      <Container maxWidth="md">
        <Box mb={2}>
          <Typography variant="h4" sx={{ color: "white" }}>Friends</Typography>
          <Typography color="white" sx={{ mt: 1 }}>
            Connect with friends and challenge them to matches
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tabs
            ref={tabsRef}
            value={tab}
            onChange={(_, newValue: string) => setTab(newValue)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              width: isMobile ? '100%' : 'auto',
              minWidth: isMobile ? 'auto' : '550px',
              bgcolor: isDark ? '#1e293bad' : '#e0f2fead',
              borderRadius: 15,
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              minHeight: 'unset',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: isDark ? '#0F172A' : '#F0F9FF',
              },
              '&::-webkit-scrollbar-thumb': {
                background: isDark ? '#475569' : '#CBD5E1',
                borderRadius: '4px',
              },
              "& .MuiTab-root": {
                color: isDark ? '#7DD3FC' : '#1D4ED8',
                fontSize: isMobile ? '0.75rem' : '1.05rem',
                textTransform: 'none',
                padding: isMobile ? '8px 4px' : '12px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              },
              "& .MuiTab-root.Mui-selected": {
                color: isDark ? '#E0F2FE' : '#0B5FFF',
                fontWeight: 700,
              },
              "& .MuiTab-root .MuiTab-iconWrapper": {
                fontSize: isMobile ? '0.9rem' : '1.1rem',
                marginRight: isMobile ? '4px' : '8px',
              },
            }}
          >
            <Tab
              value="friends"
              icon={
                <Badge badgeContent={friends.length} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '16px', height: '16px', padding: '0 4px' } }}>
                  👥
                </Badge>
              }
              iconPosition="start"
              label="Friends"
            />
            <Tab
              value="invites"
              icon={
                <Badge badgeContent={gameInvites.length} color={gameInvites.length ? "error" : "default"} sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '16px', height: '16px', padding: '0 4px' } }}>
                  🎮
                </Badge>
              }
              iconPosition="start"
              label="Game Invites"
            />
            <Tab
              value="add"
              icon={"➕"}
              iconPosition="start"
              label="Add Friends"
            />
            <Tab
              value="sent"
              icon={
                <Badge badgeContent={sentRequests.length} color={sentRequests.length ? "info" : "default"} sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '16px', height: '16px', padding: '0 4px' } }}>
                  📤
                </Badge>
              }
              iconPosition="start"
              label="Sent"
            />
            <Tab
              value="requests"
              icon={
                <Badge badgeContent={pendingRequests.length} color={pendingRequests.length ? "error" : "default"} sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: '16px', height: '16px', padding: '0 4px' } }}>
                  🕔
                </Badge>
              }
              iconPosition="start"
              label="Requests"
            />
          </Tabs>
        </Box>

        <Box
          mt={2}
          sx={{
            bgcolor: panelBg,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            p: { xs: 1.5, sm: 2 },
          }}
        >
          {tab === "friends" && (
            <FriendsList friends={friends} onRemoveFriend={handleRemoveFriend} />
          )}
          {tab === "invites" && (
            <GameInvites
              invites={gameInvites}
              onAccept={handleAcceptGameInvite}
              onDecline={handleDeclineGameInvite}
            />
          )}
          {tab === "add" && <AddFriend onSendRequest={handleSendRequest} />}
          {tab === "sent" && <SentRequests requests={sentRequests} />}
          {tab === "requests" && (
            <PendingRequests
              requests={pendingRequests}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
        </Box>
      </Container>
    </Box>
    </>
  );
}

export default Friends;