import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Grid, LinearProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { getApiBaseUrl } from "../Services/api";
import { socket } from "../Services/socket";
import { useTheme as useAppTheme } from "../Context/ThemeContext";
import AppBar from "../Components/AppBar";
import GameDetails from "../Components/GameDetails";
import { getUserRating } from "../Utils/FirestoreService";
import HomeTheme from "../assets/home_theme.jpg";

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const { isDark } = useAppTheme();
  const apiBaseUrl = getApiBaseUrl();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<any>(null);
    const [mongoUserId, setMongoUserId] = useState<string | null>(null);
    const [recentGames, setRecentGames] = useState<any[]>([]);
    const [loadingRecentGames, setLoadingRecentGames] = useState<boolean>(false);
    const [selectedGameDetails, setSelectedGameDetails] = useState<any>(null);
    const [isGameDetailsOpen, setIsGameDetailsOpen] = useState(false);

    useEffect(() => {
    // Fetch user's modules when the component mounts
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getUserRating(user.uid);
        setUserData(data);

        // Get or create MongoDB user
        if (user.email) {
          const userRes = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(user.email)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: user.displayName || data.name || '', rating: data.rating || 500 })
          });
          if (userRes.ok) {
            const mongoUser = await userRes.json();
            setMongoUserId(mongoUser._id);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

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

  // Fetch recent games from backend
  const fetchRecentGames = async (userId?: string) => {
    setLoadingRecentGames(true);
    try {
      // Only fetch if we have a user ID - don't show global games
      const userIdToUse = userId || mongoUserId;
      if (!userIdToUse) {
        console.log('No user ID available, skipping game fetch');
        setRecentGames([]);
        return;
      }

      const endpoint = `${apiBaseUrl}/game/user/${userIdToUse}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch recent games');
      const data = await res.json();
      setRecentGames(data);
    } catch (err) {
      console.error('Error fetching recent games:', err);
    } finally {
      setLoadingRecentGames(false);
    }
  };

  // Call fetchRecentGames when mongoUserId becomes available
  useEffect(() => {
    if (mongoUserId) {
      fetchRecentGames();
    }
  }, [mongoUserId]);

  const handleViewGameDetails = (game: any) => {
    setSelectedGameDetails(game);
    setIsGameDetailsOpen(true);
  };

  const handleCloseGameDetails = () => {
    setIsGameDetailsOpen(false);
    setSelectedGameDetails(null);
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress sx={{ color: "#5500aa" }} />
      </Box>
    );
  }

    return(
      <Box sx={{ backgroundImage: `url(${HomeTheme})`, backgroundSize: 'cover', minHeight: '100vh' }}>
      <AppBar title="Home" isBackButton={false} isSettings={true} isExit={true}/>
    <Box sx={{ p: 3, pb: 10 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" color="#a042ff" fontWeight="bold" fontFamily={"Times New Roman"} gutterBottom>
          Welcome, {userData?.name || "Chess Player"}
        </Typography>
        {userData?.rating && (
          <Typography variant="body1" color="text.primary" sx={{ mt: 1, fontSize: "36px", fontWeight: "bold", fontFamily: "Times New Roman", color: "#e7dbf4" }}>
            Your Rating: {userData.rating}
          </Typography>
        )}
      </Box>
        {/* Game Recents Section */}
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" color="#a042ff" fontWeight="bold" gutterBottom>
                Your Game Recents 🎮
            </Typography>
            <Button color="primary" onClick={() => navigate("/profile")} sx={{ color: "white", fontWeight: "bold" }}>
                See All
            </Button>
          </Box>

          <Box sx={{ display: "flex", overflowX: "auto", pb: 1 }}>
            {loadingRecentGames ? (
              <CircularProgress sx={{ color: "white" }} />
            ) : recentGames.length === 0 ? (
              <Box sx={{ ml: isMobile ? 7.5 : 40, p: 5, textAlign: "center", width: isMobile ? "75%" : "50%", height: "100%", borderRadius: "12px", color: isDark ? "white" : "black", bgcolor: isDark ? "rgba(6, 6, 6, 0.55)" : "rgba(255, 255, 255, 0.85)" }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: isMobile ? "18px" : "16px" }}>
                  No recent games found
                </Typography>
                <Button sx={{ alignSelf: "flex-start", bgcolor: "#d6c3ea", color: "white", 
                  boxShadow: isDark ? "2px 4px 8px rgba(255, 255, 255, 0.78)" : "2px 4px 8px rgba(0, 0, 0, 0.779)", fontWeight: "bold", fontSize: isMobile ? "13px" : "16px", borderRadius: "8px" }} onClick={() => navigate("/play")}>
                  Play with AI or friends 🎮
                </Button>
              </Box>
              ) : (
              recentGames.slice(0, 5).map((game, idx) => (
                <Card
                  key={game.id || game._id || idx}
                  sx={{
                    minWidth: 200,
                    mr: 2,
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(85, 0, 170, 0.1)",
                    bgcolor: isDark ? "#565359" : "#f3e8ff",
                    flexShrink: 0,
                  }}
                >
                  <CardContent sx={{ color: isDark ? "white" : "#333" }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {game.opponent || "Opponent"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Result:</strong> {game.result}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Accuracy Move:</strong> <LinearProgress variant="determinate" value={game.myAccuracy} /> {game.myAccuracy}%
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewGameDetails(game)}
                      sx={{ fontWeight: "bold", borderRadius: "8px", boxShadow: isDark ? "2px 4px 8px rgba(255, 255, 255, 0.78)" : "2px 4px 8px rgba(0, 0, 0, 0.779)",
                        color: isDark ? "white" : "#333",
                       }}
                    >
                      View Game
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
    </Box>

    {/* Quick Info Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
          Quick Access 🚀
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{xs: 12, sm: 6}}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(85, 0, 170, 0.1)",
                height: "100%",
                bgcolor: "#b9aed3ff",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    🎓 Tutorial
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, fontSize: "16px", color: "white" }}>
                    Review your study the chess pieces 
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate("/tutorial")}
                    sx={{ alignSelf: "flex-start", fontWeight: "bold", borderRadius: "8px", boxShadow: isDark ? "2px 4px 8px rgba(255, 255, 255, 0.78)" : "2px 4px 8px rgba(0, 0, 0, 0.779)" }}
                  >
                    Open Tutorial 🎓
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{xs: 12, sm: 6}}>
            <Card
              sx={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(85, 0, 170, 0.1)",
                height: "100%",
                bgcolor: "#83f38eff",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    📩 Invite Friends
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, fontSize: "16px", color: isDark ? "white" : "black" }}>
                    You can invite your friends to play with you
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => navigate("/friends")}
                    sx={{ alignSelf: "flex-start", fontWeight: "bold", borderRadius: "8px", boxShadow: isDark ? "2px 4px 8px rgba(255, 255, 255, 0.78)" : "2px 4px 8px rgba(0, 0, 0, 0.779)" }}
                  >
                    Join Them 📩
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Daily Tip */}
      <Card
        sx={{
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(85, 0, 170, 0.1)",
          bgcolor: isDark ? "#6a1b9a" : "#a046f9",
          mb: 5,
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            💡 Daily Learning Tip
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? "white" : "black" }}>
            Consistent practice is key to improving your chess skills. Dedicate time each day to study tactics, openings, and endgames to see steady progress! 
          </Typography>
        </CardContent>
      </Card>
    </Box>

          {/* Game Details Modal */}
          {selectedGameDetails && (
            <GameDetails
              open={isGameDetailsOpen}
              onClose={handleCloseGameDetails}
              gameDetails={selectedGameDetails}
            />
          )}
    </Box>
    );
};

export default Home;