import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../Services/api";
import { socket } from "../Services/socket";
import {CircularProgress, Box, Typography, Button, Card, CardContent, Grid, Paper, Avatar, Divider, Modal,
  TextField, IconButton, FormControl, Tooltip,
  MenuItem, Select as MuiSelect, useMediaQuery, useTheme as useAppTheme } from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import AppBar from "../Components/AppBar";
import GameDetails from "../Components/GameDetails";
import ProfileLight from "../assets/img-theme/ProfileLight.jpeg";
import ProfileDark from "../assets/img-theme/ProfileDark.jpeg";
import { Trophy, Target, TrendingUp } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const appTheme = useAppTheme();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));
  const apiBaseUrl = getApiBaseUrl();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
  const [recentGames, setRecentGames] = useState<any[]>([]);

  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  const [gameFilter, setGameFilter] = useState("all");
  const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null);
  const [_loadingRecentGames, setLoadingRecentGames] = useState(false);
  const [isGameDetailsOpen, setIsGameDetailsOpen] = useState(false);

  const computeStatsFromGames = (games: any[]) => {
    return games.reduce(
      (acc, game) => {
        // Normalize: lowercase and trim whitespace for consistent comparison
        const result = (game?.result || '').toLowerCase().trim();
        if (["win", "won"].includes(result)) acc.wins += 1;
        else if (["loss", "lose", "lost"].includes(result)) acc.losses += 1;
        else if (["draw", "tie"].includes(result)) acc.draws += 1;
        return acc;
      },
      { wins: 0, losses: 0, draws: 0 }
    );
  };

  // Fetch recent games from backend
  const fetchRecentGames = async (userId?: string) => {
    setLoadingRecentGames(true);
    try {
      // Only fetch if we have a user ID - don't show global games
      const userIdToUse = userId || mongoUserId;
      if (!userIdToUse) {
        console.log('No user ID available, skipping game fetch');
        setRecentGames([]);
        setFilteredGames([]);
        return;
      }

      const endpoint = `/game/user/${userIdToUse}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch recent games');
      let data = await res.json();
      
      // Deduplicate games: keep only unique games based on opponent, date, result, and moves
      const seenGames = new Map<string, any>();
      const deduplicatedData = data.filter((game: any) => {
        // Create a unique key for each game
        const gameKey = `${game.opponent}-${new Date(game.date).toDateString()}-${game.result}-${game.moves}`;
        
        if (!seenGames.has(gameKey)) {
          seenGames.set(gameKey, game);
          return true;
        }
        console.log(`Filtered out duplicate game: ${gameKey}`);
        return false;
      });
      
      data = deduplicatedData;
      setRecentGames(data);
      setFilteredGames(applyGameFilter(data, gameFilter));

      // Compute stats from games (MongoDB is source of truth, not Firestore)
      const stats = computeStatsFromGames(data);
      setUserData((prev: any) => ({ ...(prev || {}), ...stats }));

      // NOTE: DO NOT sync stats to Firestore anymore
      // Games in MongoDB are the single source of truth for statistics
      // Firestore should only contain: name, email, rating, preferences
    } catch (err) {
      console.error('Error fetching recent games:', err);
    } finally {
      setLoadingRecentGames(false);
    }
  };

  // Remove a recent game
  const removeRecentGame = (gameId: string) => {
    if (!gameId) {
      console.error('Error: Game ID is undefined');
      return;
    }
    // Remove from recentGames
    const updatedRecentGames = recentGames.filter(game => (game._id || game.id) !== gameId);
    setRecentGames(updatedRecentGames);
    
    // Remove from filteredGames
    const updatedFilteredGames = filteredGames.filter(game => (game._id || game.id) !== gameId);
    setFilteredGames(updatedFilteredGames);
  };

  const applyGameFilter = (games: any[], filter: string) => {
    if (filter === "all") return games;
    return games.filter((game) => {
      const result = (game?.result || "").toLowerCase();
      if (filter === "wins") return ["win", "won"].includes(result);
      if (filter === "losses") return ["loss", "lose", "lost"].includes(result);
      if (filter === "draws") return ["draw", "tie"].includes(result);
      return true;
    });
  };

  const handleFilterChange = (e: any) => {
    const newFilter = e.target.value;
    setGameFilter(newFilter);
    setFilteredGames(applyGameFilter(recentGames, newFilter));
  };

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          // Fetch from Firestore
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setName(data.name || "");
            setRating(data.rating || "");

            // Show modal if name or rating is missing
            if (!data.name || !data.rating) {
              setIsModalOpen(true);
            }
          } else {
            // If user is new (no Firestore entry), create a profile
            await setDoc(userRef, {
              name: user.displayName || "",
              email: user.email,
              rating: 500
            });
            setIsModalOpen(true);
          }

          // Get or create MongoDB user
          if (user.email) {
            const userRes = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(user.email)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name: user.displayName || '', rating: 500 })
            });
            if (userRes.ok) {
              const mongoUser = await userRes.json();
              setMongoUserId(mongoUser._id);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user, apiBaseUrl]);

  // Fetch games when mongoUserId changes - this is now the ONLY place games are fetched
  useEffect(() => {
    if (mongoUserId) {
      fetchRecentGames();
    }
  }, [mongoUserId]);

  // Refresh rating data on component mount to ensure fresh data after game completion
  useEffect(() => {
    if (user) {
      const refreshRatingData = async () => {
        try {
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setRating(data.rating || "");
            setUserData((prev: any) => ({ ...prev, rating: data.rating }));
          }
        } catch (error) {
          console.error('Error refreshing rating data:', error);
        }
      };
      refreshRatingData();
    }
  }, [user?.uid]);

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
    };
  }, [user?.uid]);

  const handleSave = async () => {
    if (user) {
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { name, rating }, { merge: true });
      setIsModalOpen(false);
      setUserData((prev: any) => ({ ...prev, name, rating })); // Update state to reflect changes
    }
  };

  const handleViewGameDetails = (game: any) => {
    setSelectedGameDetails(game);
    setIsGameDetailsOpen(true);
  };

  const handleCloseGameDetails = () => {
    setIsGameDetailsOpen(false);
    setSelectedGameDetails(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#5500aa" }} />
      </Box>
    );
  }

  if (!user) {
    return <Typography variant="h6" sx={{ textAlign: "center", mt: 4, color: "#5500aa" }}>You need to log in.</Typography>;
  }

  const totalGames = (userData?.wins || 0) + (userData?.losses || 0) + (userData?.draws || 0);
  const winRate = totalGames > 0 ? Math.round(((userData?.wins || 0) / totalGames) * 100) : 0;
  const username =
    (user?.email?.split("@")[0] || userData?.name || "user").replace(/\s+/g, "_").toLowerCase();
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).getDate() + " " + new Date(user.metadata.creationTime).toLocaleString("default", { month: "short" }) + " " + new Date(user.metadata.creationTime).getFullYear()
    : undefined;
  const visibleRecentGameCards = isMobile ? 1 : 2;
  const recentGameCardHeight = 225;
  const recentGamesListHeight = visibleRecentGameCards * recentGameCardHeight + (visibleRecentGameCards - 1) * 16;

  return (
    <Box sx={{ backgroundImage: isDark ? `url(${ProfileDark})` : `url(${ProfileLight})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', pb: 5 }}>
    <AppBar title="My Profile" isBackButton={false} isSettings={true} isExit={true}/>
    <Box sx={{ padding: 3, textAlign: "center", maxWidth: 700, mx: "auto" }}>
      {/* User Info Section */}
      <Paper sx={{ 
        padding: 3, 
        borderRadius: 2, 
        mb: 3, 
        boxShadow: '0 4px 20px rgba(85, 0, 170, 0.1)', 
        backgroundColor: isDark ? "#1e1b23d9" : "#ffffffcc", 
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ 
            width: 72, 
            height: 72,
            backgroundColor: userData?.avatarColor,
            color: isDark ? "#ddaaff" : "#5500aa",
            boxShadow: '0 4px 8px rgba(85, 0, 170, 0.2)'
          }}>
            {(userData?.name || user?.displayName || "U").charAt(0).toUpperCase()}
            {(userData?.name || user?.displayName || "U").split(' ')[1]?.charAt(0).toUpperCase() || ''}
          </Avatar>
          <Box sx={{ textAlign: "left" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#5500aa" }}>
              {userData?.name || user?.displayName || "No Name Set"}
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#fff" : "#666" }}>
              @{username}{memberSince ? ` • Member since ${memberSince}` : ""}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mt: 3 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.08)', backgroundColor: isDark ? "#2c1e4d" : "#ffffffcc" }}>
            <CardContent>
              <Target/>
              <Typography variant="body2" sx={{ color: isDark ? "#fff" : "#666" }}>Rating</Typography>
              <Typography variant="h5" fontWeight="bold" color={isDark ? "#ddaaff" : "#5500aa"}>{userData?.rating || 0}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.08)', backgroundColor: isDark ? "#2c1e4d" : "#ffffffcc" }}>
            <CardContent>
              <Trophy/>
              <Typography variant="body2" sx={{ color: isDark ? "#fff" : "#666" }}>Wins</Typography>
              <Typography variant="h5" fontWeight="bold" color={isDark ? "#ddaaff" : "#5500aa"}>{userData?.wins || 0}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.08)', backgroundColor: isDark ? "#2c1e4d" : "#ffffffcc" }}>
            <CardContent>
              <TrendingUp /> 
              <Typography variant="body2" sx={{ color: isDark ? "#fff" : "#666" }}>Win Rate</Typography>
              <Typography variant="h5" fontWeight="bold" color={isDark ? "#ddaaff" : "#5500aa"}>{winRate}%</Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <Divider sx={{ mb: 3, bgcolor: "#ddaaff" }} />

      {/* Game Statistics Section */}
      <Typography variant="h6" sx={{ mb: 2 }} color={isDark ? "#000000" : "#5500aa"} fontWeight="bold">Game Statistics</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 6, sm: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: isDark ? "#ffffffcc" : "#ffffff", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={isDark ? "#000000" : "#5500aa"}>Total Games</Typography>
              <Typography variant="h4" fontWeight="bold" color={isDark ? "#000000" : "#5500aa"}>{totalGames}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 6, sm: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: isDark ? "#45a34a" : "#41fe4a", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={isDark ? "#000000" : "#5500aa"}>Wins</Typography>
              <Typography variant="h4" fontWeight="bold" color={isDark ? "#000000" : "#5500aa"}>{userData?.wins || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 6, sm: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: isDark ? "#f39980" : "#ed704e", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={isDark ? "#000000" : "#5500aa"}>Losses</Typography>
              <Typography variant="h4" fontWeight="bold" color={isDark ? "#000000" : "#5500aa"}>{userData?.losses || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 6, sm: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: isDark ? "#ffffffaa" : "#ffffffcc", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color={isDark ? "#000000" : "#5500aa"}>Draws</Typography>
              <Typography variant="h4" fontWeight="bold" color={isDark ? "#000000" : "#5500aa"}>{userData?.draws || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Games Section */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ color: isDark ? "#fff" : "#5500aa", fontWeight: "bold" }}>Recent Games</Typography>
            <FormControl sx={{ minWidth: 150, backgroundColor: isDark ? "#1e1b23d9" : "#ffffffcc", borderRadius: 1 }}>
              <MuiSelect
                value={gameFilter}
                onChange={handleFilterChange}
                sx={{
                  backgroundColor: isDark ? "#ffffffcc" : "#1e1b23d9",
                  color: isDark ? "#1e1b23" : "#ffffff",
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: "#ddaaff" },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#5500aa" },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#5500aa" },
                }}
              >
                <MenuItem value="all">All Games</MenuItem>
                <MenuItem value="wins">Wins</MenuItem>
                <MenuItem value="losses">Losses</MenuItem>
                <MenuItem value="draws">Draws</MenuItem>
              </MuiSelect>
            </FormControl>
          </Box>

          {filteredGames.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: recentGamesListHeight,
                overflowY: "auto",
                overflowX: "hidden",
                pr: 1,
                scrollBehavior: "smooth",
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { bgcolor: isDark ? '#2c2c2c' : '#f0f0f0', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#ddaaff', borderRadius: '4px', '&:hover': { bgcolor: '#5500aa' } }
              }}
            >
              {filteredGames.map((game) => {
                const gameId = game._id || game.id;
                return (
                  <Card
                    key={gameId}
                    sx={{
                      width: '100%',
                      minHeight: recentGameCardHeight,
                      borderRadius: 2,
                      backgroundColor: game.result === 'win' ? isDark ? '#14532d' : '#b3ebc4' : game.result === 'loss' ? isDark ? '#7f1d1d' : '#fef2f2' : '#a5a0a0',
                      boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(85, 0, 170, 0.2)',
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" sx={{ color: isDark ? '#f1f1f1' : '#121212', fontWeight: 'bold', mb: 1 }}>
                        {new Date(game.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body1" sx={{ color: isDark ? '#f1f1f1' : '#121212', fontWeight: 'bold', mb: 1 }}>
                        vs {game.opponent}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#f1f1f1' : '#121212', mb: 1 }}>
                        Rating: {game.opponentRating}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 'bold',
                          color: game.result === 'win' ? '#22c55e' : game.result === 'loss' ? '#ef4444' : '#666',
                          mb: 1
                        }}
                      >
                        {game.result?.charAt(0).toUpperCase() + game.result?.slice(1)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#f1f1f1' : '#121212', mb: 2 }}>
                        Moves: {game.moves} | Time: {game.timeControl}+0
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          sx={{ color: isDark ? "#ffffff" : "#000000", borderColor: "#ddaaff", '&:hover': { color: isDark ? "#ffffff" : "#5500aa", borderColor: '#5500aa', bgcolor: isDark ? '#2c2c2c' : '#f7f0ff' } }}
                          onClick={() => handleViewGameDetails(game)}
                        >
                          View
                        </Button>
                        <Tooltip title="Remove Game">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeRecentGame(gameId)}
                          sx={{ flex: '0 0 auto' }}
                        >
                          🗑️
                        </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
                No recent games found.
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: "#ccaaef",
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(85, 0, 170, 0.2)',
                  '&:hover': {
                    bgcolor: '#b875ff',
                    boxShadow: '0 6px 16px rgba(85, 0, 170, 0.3)',
                  }
                }}
                startIcon={"➕"}
                onClick={() => navigate("/play")}
              >
                Let's Play
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal for Name & Rating Entry */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "450px",
            background: "#ffffff",
            padding: "2.5rem",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: '0 16px 32px rgba(85, 0, 170, 0.15)',
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="#5500aa" gutterBottom>
            Complete Your Profile
          </Typography>
          <Typography sx={{ mb: 3, fontSize: "1.2rem", color: "#666" }}>
            Please enter your full name and rating to continue.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
            <Typography variant="h6" color="#5500aa">Full Name</Typography>
            <TextField
              variant="outlined"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{
                borderRadius: "8px",
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#5500aa',
                  },
                },
              }}
            />
            
            <Typography variant="h6" color="#5500aa">Rating Score</Typography>
            <TextField
              variant="outlined"
              fullWidth
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              sx={{
                borderRadius: "8px",
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#5500aa',
                  },
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            sx={{ 
              fontSize: "1.2rem", 
              padding: "0.9rem", 
              mt: 3, 
              bgcolor: "#5500aa",
              borderRadius: '12px',
              width: '100%',
              '&:hover': {
                bgcolor: '#7722cc',
              }
            }}
            onClick={handleSave}
          >
            Save & Continue
          </Button>
        </Box>
      </Modal>

      {/* Game Details Modal */}
      {selectedGameDetails && (
        <GameDetails
          open={isGameDetailsOpen}
          onClose={handleCloseGameDetails}
          gameDetails={selectedGameDetails}
        />
      )}
    </Box>
    </Box>
  );
};

export default Profile;