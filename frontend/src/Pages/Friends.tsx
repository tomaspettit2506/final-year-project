// Page: frontend/src/Pages/Friends.tsx
import { useState, useEffect } from "react";
import { Box, Container, Typography, Tabs, Tab, Badge } from "@mui/material";
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

interface Friend {
  id: string; // Prefer Firebase UID when available, otherwise Mongo _id
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
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
  avatar: string;
  rating: number;
  online: boolean;
  receivedAt: string;
}

interface SentRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  sentAt: string;
  status?: string;
}

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

const Friends = () => {
  const { user, userData } = useAuth();
  const apiBaseUrl = getApiBaseUrl();
  const { isDark } = useAppTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [gameInvites, setGameInvites] = useState<GameInvite[]>([]);
  const [tab, setTab] = useState<string>("friends");
  const [_mongoUserId, setMongoUserId] = useState<string | null>(null);

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
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      rating: friend.friendRating ?? populatedUser?.rating ?? 1200,
      online: false,
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
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          rating: req.fromUser?.rating ?? 1200,
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
          fromUserAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fromUserName)}`,
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
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          rating: req.toUser?.rating ?? 1200,
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
  useEffect(() => {
    fetchFriends();
  }, [user]);

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

  const pageBg = isDark ? "background.default" : "background.paper";
  const surfaceBg = isDark ? "background.paper" : "background.default";
  const panelBg = isDark ? "background.default" : "background.paper";

  return (
    <>
    <AppBar title={"Friends"} isBackButton={true} isSettings={true} isExit={true} />
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, py: 6 }}>
      <Container maxWidth="md">
        <Box mb={4}>
          <Typography variant="h4">Friends</Typography>
          <Typography color="text.secondary">
            Connect with friends and challenge them to matches
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, newValue: string) => setTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: surfaceBg,
            borderRadius: 1,
            "& .MuiTab-root": {
              color: "text.secondary",
              "&.Mui-selected": { color: "text.primary" },
            },
          }}
        >
          <Tab
            value="friends"
            icon={
              <Badge badgeContent={friends.length} color="secondary">
                👥
              </Badge>
            }
            iconPosition="start"
            label="Friends"
          />
          <Tab
            value="invites"
            icon={
              <Badge badgeContent={gameInvites.length} color={gameInvites.length ? "error" : "default"}>
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
              <Badge badgeContent={sentRequests.length} color={sentRequests.length ? "info" : "default"}>
                📤
              </Badge>
            }
            iconPosition="start"
            label="Sent"
          />
          <Tab
            value="requests"
            icon={
              <Badge badgeContent={pendingRequests.length} color={pendingRequests.length ? "error" : "default"}>
                🕔
              </Badge>
            }
            iconPosition="start"
            label="Requests"
          />
        </Tabs>

        <Box
          mt={3}
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