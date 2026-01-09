import { useState } from "react";
import { Box, Container, Typography, Tabs, Tab, Badge } from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import FriendsList from "./FriendsList";
import AddFriend from "./AddFriend";
import PendingRequests from "./PendingRequests";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  lastSeen?: string;
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

// Mock data
const initialFriends: Friend[] = [
  {
    id: "1",
    name: "Alex Martinez",
    username: "alex_chess",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    rating: 1850,
    online: true,
  },
  {
    id: "2",
    name: "Jessica Lee",
    username: "jess_knight",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    rating: 1620,
    online: false,
    lastSeen: "2h ago",
  },
  {
    id: "3",
    name: "Robert Brown",
    username: "rob_tactician",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    rating: 1950,
    online: true,
  },
  {
    id: "4",
    name: "Maria Garcia",
    username: "maria_queen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    rating: 1780,
    online: false,
    lastSeen: "1d ago",
  },
  {
    id: "5",
    name: "Kevin Zhang",
    username: "kevin_strategy",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
    rating: 2000,
    online: true,
  },
];

const initialRequests: PendingRequest[] = [
  {
    id: "req1",
    name: "Tom Wilson",
    username: "tom_chess_pro",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    rating: 1700,
    online: true,
    receivedAt: "5m ago",
  },
  {
    id: "req2",
    name: "Nina Patel",
    username: "nina_endgame",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
    rating: 1880,
    online: false,
    receivedAt: "1h ago",
  },
];

const Friends = () => {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(initialRequests);
  const [tab, setTab] = useState<string>("friends");

  const handleRemoveFriend = (friendId: string) => {
    setFriends(friends.filter((friend) => friend.id !== friendId));
  };

  const handleSendRequest = (userId: string) => {
    console.log("Friend request sent to:", userId);
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = pendingRequests.find((req) => req.id === requestId);
    if (request) {
      const newFriend: Friend = {
        id: request.id,
        name: request.name,
        username: request.username,
        avatar: request.avatar,
        rating: request.rating,
        online: request.online,
      };
      setFriends([...friends, newFriend]);
      setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
  };

  return (
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
                <PeopleIcon />
              </Badge>
            }
            iconPosition="start"
            label="Friends"
          />
          <Tab
            value="add"
            icon={<PersonAddIcon />}
            iconPosition="start"
            label="Add Friends"
          />
          <Tab
            value="requests"
            icon={
              <Badge badgeContent={pendingRequests.length} color={pendingRequests.length ? "error" : "default"}>
                <AccessTimeIcon />
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
  );
}

export default Friends;
