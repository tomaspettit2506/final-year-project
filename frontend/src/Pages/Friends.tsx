// Page: frontend/src/Pages/Friends.tsx
import { useState, useEffect } from "react";
import { Box, Container, Typography, Tabs, Tab, Badge } from "@mui/material";
import { useAuth } from "../Context/AuthContext";
import FriendsList from "../Components/FriendsComponents/FriendsList";
import AddFriend from "../Components/FriendsComponents/AddFriend";
import PendingRequests from "../Components/FriendsComponents/PendingRequests";
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
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
      const res = await fetch(`/user/${user.uid}/friends`);
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
        const res = await fetch(`/user/email/${user.email}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  // Fetch pending requests from backend
  const fetchPendingRequests = async () => {
    if (!user?.uid) return;
    
    try {
      const res = await fetch(`/request?userId=${user.uid}`);
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
    if (tab === 'invites') {
      fetchGameInvites();
    }
  }, [tab]);

  // Fetch game invites from backend
  const fetchGameInvites = async () => {
    if (!user?.uid) return;
    
    try {
      const res = await fetch(`/game-invite?toUserId=${user.uid}`);
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

  // Load friends on initial render or when auth user changes
  useEffect(() => {
    fetchFriends();
  }, [user]);

  const handleRemoveFriend = async (friend: Friend) => {
    if (!user?.uid) return;

    const targetId = friend.firebaseUid || friend.mongoId || friend.id;
    if (!targetId) return;

    try {
      const res = await fetch(`/user/${user.uid}/friend/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
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
    console.log("Friend request sent to:", userId);
    // Refresh pending requests after a short delay to allow backend to process
    setTimeout(() => {
      fetchPendingRequests();
    }, 500);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Accept the friend request via API
      const res = await fetch(`/request/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      // Decline the friend request via API
      const res = await fetch(`/request/${requestId}/decline`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
    // Mark invite as accepted (navigation handled by GameInvites component)
    try {
      await fetch(`/game-invite/${invite.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // Remove from local state
      setGameInvites(gameInvites.filter((inv) => inv.id !== invite.id));
    } catch (err: any) {
      console.error('Failed to accept game invite', err);
    }
  };

  // DELETE Game Invite
  const handleDeclineGameInvite = async (inviteId: string) => {
    try {
      await fetch(`/game-invite/${inviteId}/decline`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      // Remove from local state
      setGameInvites(gameInvites.filter((inv) => inv.id !== inviteId));
    } catch (err: any) {
      console.error('Failed to decline game invite', err);
    }
  };

  return (
    <>
    <AppBar title={"Friends"} isBackButton={true} isSettings={true} isExit={true} />
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
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
          sx={{ borderBottom: 1, borderColor: "divider" }}
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

        <Box mt={3}>
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