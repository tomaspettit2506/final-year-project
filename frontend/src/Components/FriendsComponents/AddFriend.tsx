import { useState } from "react";
import { Card, Box, Stack, TextField, InputAdornment, 
    Button, Avatar, Badge, Chip, Typography,
 } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  isFriend: boolean;
  isPending: boolean;
}

interface AddFriendProps {
  onSendRequest: (userId: string) => void;
}

const AddFriend: React.FC<AddFriendProps> = ({ onSendRequest }) => {
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
      const res = await fetch(`/users`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // Map backend user shape to UI User shape
      const mapped: User[] = (data || []).map((u: any) => {
        const name = u.name || u.email || 'Unknown';
        return {
          id: u._id || u.id || (u.email ?? name),
          name,
          username: (u.email && u.email.split?.('@')?.[0]) || (name.replace(/\s+/g, '_').toLowerCase()),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          rating: u.rating ?? 1200,
          online: false,
          isFriend: false,
          isPending: false,
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

  const handleSendRequest = (userId: string) => {
    setUsers(users.map(user => user.id === userId ? { ...user, isPending: true } : user ));
    onSendRequest(userId);
    // POST Request
    fetch('/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId: userId }),
    }).catch(err => {
      console.error('Failed to send friend request', err);
    });
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
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
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
            <Stack spacing={1}>
              {filteredUsers.map((user) => (
                <Card key={user.id} sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
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
                      <Box>
                        <Typography>{user.name}</Typography>
                        <Typography color="textSecondary" variant="body2">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label={user.rating} color="secondary" size="small" />
                      {user.isPending ? (
                        <Chip label="Request Sent" variant="outlined" size="small" />
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleSendRequest(user.id)}
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
