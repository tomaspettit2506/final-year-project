import { useState } from "react";
import { Card, Box, Stack, TextField, InputAdornment, Button, Avatar, Badge, Chip, Typography } from "@mui/material";
import { useAuth } from "../../Context/AuthContext";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  isFriend: boolean;
  isPending: boolean;
  firebaseUid?: string;
}

interface AddFriendProps {
  onSendRequest: (userId: string) => void;
}

const AddFriend: React.FC<AddFriendProps> = ({ onSendRequest }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]); // initially empty; populated from backend
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSearch = async () => {
    setHasSearched(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/user`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      
      // Map backend user shape to UI User shape and ensure they have firebaseUid
      const mapped: User[] = (data || []).map((u: any) => {
        const name = u.name || u.email || 'Unknown';
        return {
          id: u.firebaseUid || u._id || u.id || (u.email ?? name),
          name,
          username: (u.email && u.email.split?.('@')?.[0]) || (name.replace(/\s+/g, '_').toLowerCase()),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          rating: u.rating ?? 1200,
          online: false,
          isFriend: false,
          isPending: false,
          firebaseUid: u.firebaseUid,
        };
      });
      setUsers(mapped);
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (!user?.uid) {
      console.error('User not authenticated');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    const requestTargetId = targetUser?.firebaseUid || targetUser?.id;
    if (!requestTargetId) {
      console.error('Target user missing identifier');
      return;
    }
    
    setUsers(users.map(u => u.id === userId ? { ...u, isPending: true } : u ));
    onSendRequest(userId);
    // POST Request
    try {
      const res = await fetch('/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: user.uid, toUserId: requestTargetId }),
      });
      if (!res.ok) {
        let detail = '';
        try {
          const payload = await res.json();
          detail = payload?.message || payload?.error || '';
        } catch {
          detail = '';
        }
        throw new Error(`Status ${res.status}${detail ? ` - ${detail}` : ''}`);
      }
    } catch (err: any) {
      console.error('Failed to send friend request', err);
      setUsers(users.map(u => u.id === userId ? { ...u, isPending: false } : u ));
    }
  };

  const filteredUsers = hasSearched
    ? users.filter(
        (user) =>
          (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !user.isFriend
      )
    : [];

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Box display="flex" gap={1} alignItems="center" flexWrap={{ xs: "wrap", sm: "nowrap" }}>
          <TextField
            fullWidth
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  🔍
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={"🔍"}
            sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: 'grey', '&:hover': { bgcolor: 'grey.dark' } }}
          >
            Search
          </Button>
        </Box>
      </Card>

      {hasSearched && (
        <>
          {loading ? (
            <Card sx={{ p: 4, textAlign: "center" }}>
              <Typography>Loading...</Typography>
            </Card>
          ) : error ? (
            <Card sx={{ p: 4, textAlign: "center" }}>
              <Typography color="error">{error}</Typography>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card sx={{ p: 4, textAlign: "center" }}>
              <Typography color="textSecondary">
                {searchQuery ? "No users found" : "Enter a search query to find users"}
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
              {filteredUsers.map((user) => (
                <Card key={user.id} sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                        variant={user.online ? "dot" : undefined}
                        invisible={!user.online}
                      >
                        <Avatar src={user.avatar} alt={user.name}>
                          {user.name.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography>{user.name}</Typography>
                        <Typography color="textSecondary" variant="body2">
                          @{user.username}
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
                      <Chip label={user.rating} color="secondary" size="small" />
                      {user.isPending ? (
                        <Chip label="Request Sent" variant="outlined" size="small" />
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={"👤"}
                          onClick={() => handleSendRequest(user.id)}
                          sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
                        >
                          Add Friend
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

export default AddFriend;
