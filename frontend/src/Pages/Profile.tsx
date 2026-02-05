import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {CircularProgress, Box, Typography, Button, Card, CardContent, Grid, Paper, Avatar, Divider, Modal,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, FormControl,
  InputLabel, MenuItem, Select as MuiSelect, useMediaQuery, useTheme as useMuiTheme } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import AppBarComponent from "../Components/AppBarComponent";
import GameDetails from "../Components/GameDetails";
import ProfileLight from "../assets/profile_light.jpg";
import ProfileDark from "../assets/profile_dark.jpg";

const Profile = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
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
  const fetchRecentGames = async () => {
    setLoadingRecentGames(true);
    try {
      // If we have a MongoDB user ID, fetch their specific games
      let endpoint = '/game';
      if (mongoUserId) {
        endpoint = `/game/user/${mongoUserId}`;
      }

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch recent games');
      const data = await res.json();
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

  // Add a demo recent game (for testing)
  const addDemoRecentGame = async () => {
    try {
      // Ensure we have a MongoDB user ID
      let userId = mongoUserId;
      if (!userId && user?.email) {
        // Get or create MongoDB user
        const userRes = await fetch(`/user/email/${encodeURIComponent(user.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: user.displayName || name, rating: parseInt(rating) || 500 })
        });
        if (!userRes.ok) throw new Error('Failed to get or create user');
        const mongoUser = await userRes.json();
        userId = mongoUser._id;
        setMongoUserId(userId);
      }

      const res = await fetch('/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myRating: parseInt(rating) || 500,
          opponent: "Demo Opponent",
          opponentRating: 480,
          date: new Date().toISOString(),
          result: "win",
          timeControl: 10,
          termination: "checkmate",
          moves: 35,
          duration: 300,
          myAccuracy: 92.5,
          opponentAccuracy: 85.0,
          userId: userId
        })
      });
      if (!res.ok) throw new Error('Failed to add demo game');
      await fetchRecentGames();
    } catch (err) {
      console.error('Error adding demo game:', err);
    }
  };

  // Delete a recent game
  const deleteRecentGame = async (gameId: string) => {
    if (!gameId) {
      console.error('Error: Game ID is undefined');
      return;
    }
    try {
      const res = await fetch(`/game/${gameId}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to delete game (${res.status}): ${msg}`);
      }
      await fetchRecentGames();
    } catch (err) {
      console.error('Error deleting game:', err);
    }
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
          // Get or create MongoDB user
          if (user.email) {
            const userRes = await fetch(`/user/email/${encodeURIComponent(user.email)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: user.displayName || '', rating: 500 })
            });
            if (userRes.ok) {
              const mongoUser = await userRes.json();
              setMongoUserId(mongoUser._id);
            }
          }

          // Fetch from Firestore
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setName(data.name || "");
            setRating(data.rating || "");

            // 🔹 Always show modal if name or rating is missing
            if (!data.name || !data.rating) {
              setIsModalOpen(true);
            }
          } else {
            // 🔹 If user is new (no Firestore entry), create a profile and ask for details
            await setDoc(userRef, {
              name: user.displayName || "",
              email: user.email,
              rating: 500
            });
            setIsModalOpen(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      };
      const loadProfile = async () => {
        await fetchUserData();
        await fetchRecentGames();
      };
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  return (
    <Box sx={{ backgroundImage: isDark ? `url(${ProfileDark})` : `url(${ProfileLight})`, backgroundSize: 'cover', minHeight: '100vh', pb: 5 }}>
    <AppBarComponent title="Settings" isBackButton={false} isSettings={true} isExit={true}/>
    <Box sx={{ padding: 3, textAlign: "center", maxWidth: 700, mx: "auto" }}>
      {/* User Info Section */}
      <Paper sx={{ 
        padding: 3, 
        borderRadius: 2, 
        mb: 3, 
        boxShadow: '0 4px 20px rgba(85, 0, 170, 0.1)', 
        backgroundColor: "#ffffff" 
      }}>
        <Avatar sx={{ 
          width: 80, 
          height: 80, 
          bgcolor: "#5500aa", 
          mx: "auto", 
          mb: 2,
          boxShadow: '0 4px 8px rgba(85, 0, 170, 0.2)'
        }}>
          <AccountCircleIcon sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#5500aa" }}>
          {userData?.name || "No Name Set"}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Email: {user?.email}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: "#ddaaff" }}>
          🎓
          Rating: {userData?.rating || "No rating set"}
        </Typography>
      </Paper>

      <Divider sx={{ mb: 3, bgcolor: "#ddaaff" }} />

      {/* Game Statistics Section */}
      <Typography variant="h6" sx={{ mb: 2 }} color="#5500aa" fontWeight="bold">Game Statistics</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: "#ffffff" }}>
            <CardContent>
              <Typography variant="h6" color="#5500aa">Total Games</Typography>
              <Typography variant="h4" fontWeight="bold" color="#5500aa">{(userData?.wins || 0) + (userData?.losses || 0) + (userData?.draws || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: "#41fe4a" }}>
            <CardContent>
              <Typography variant="h6" color="#5500aa">Wins</Typography>
              <Typography variant="h4" fontWeight="bold" color="#5500aa">{userData?.wins || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: "#f39980" }}>
            <CardContent>
              <Typography variant="h6" color="#5500aa">Losses</Typography>
              <Typography variant="h4" fontWeight="bold" color="#5500aa">{userData?.losses || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 3}}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: "#dddddd" }}>
            <CardContent>
              <Typography variant="h6" color="#5500aa">Draws</Typography>
              <Typography variant="h4" fontWeight="bold" color="#5500aa">{userData?.draws || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Games Section */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ color: "#5500aa", fontWeight: "bold" }}>Recent Games</Typography>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: "#5500aa" }}>Filter</InputLabel>
              <MuiSelect
                value={gameFilter}
                label="Filter"
                onChange={handleFilterChange}
                sx={{
                  color: "#5500aa",
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
            <TableContainer sx={{ maxHeight: isMobile ? 300 : 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f9f0ff" }}>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold" }}>Opponent</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold" }}>Result</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold" }}>Moves</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold" }}>Time Control</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold", textAlign: "center" }}>Details</TableCell>
                    <TableCell sx={{ color: "#5500aa", fontWeight: "bold", textAlign: "center" }}>Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGames.map((game) => {
                    const gameId = game._id || game.id;
                    return (
                    <TableRow 
                      key={gameId}
                      sx={{
                        backgroundColor: game.result === 'win' ? isDark ? '#14532d' : '#f0fdf4' : game.result === 'loss' ? '#fef2f2' : 'transparent',
                        '&:hover': { backgroundColor: game.result === 'win' ? '#f0fdf4' : game.result === 'loss' ? '#fef2f2' : '#fafafa' }
                      }}
                    >
                      <TableCell>{new Date(game.date).toLocaleDateString()}</TableCell>
                      <TableCell>{game.opponent}</TableCell>
                      <TableCell>
                        <Typography 
                          sx={{ 
                            fontWeight: "bold",
                            color: game.result === 'win' ? '#22c55e' : game.result === 'loss' ? '#ef4444' : '#666'
                          }}
                        >
                          {game.result?.charAt(0).toUpperCase() + game.result?.slice(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>{game.moves}</TableCell>
                      <TableCell>{game.timeControl}+0</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ color: "text.primary", borderColor: "#ddaaff", '&:hover': { borderColor: '#5500aa', bgcolor: '#f7f0ff' } }}
                          onClick={() => handleViewGameDetails(game)}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => deleteRecentGame(gameId)}
                        >
                          🗑️
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
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

      <Button
        variant="outlined"
        sx={{ mb: 3, color: "#5500aa", borderColor: "#ddaaff", '&:hover': { borderColor: '#5500aa', bgcolor: '#f7f0ff' } }}
        startIcon={"➕"}
        onClick={addDemoRecentGame}
      >
        Add Demo Recent Game
      </Button>

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