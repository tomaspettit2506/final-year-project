import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import AppBarComponent from "../Components/AppBarComponent";
import { getUserRating } from "../Utils/FirestoreService";

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<any>(null);
    const [mongoUserId, setMongoUserId] = useState<string | null>(null);
    const [recentGames, setRecentGames] = useState<any[]>([]);
    const [loadingRecentGames, setLoadingRecentGames] = useState<boolean>(false);

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
          const userRes = await fetch(`/user/email/${encodeURIComponent(user.email)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

  // Fetch recent games from backend
  const fetchRecentGames = async () => {
    setLoadingRecentGames(true);
    try {
      // If we have a MongoDB user ID, fetch their specific games
      let endpoint = '/games';
      if (mongoUserId) {
        endpoint = `/user/${mongoUserId}/games`;
      }

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

  // Call fetchRecentGames on mount and when mongoUserId changes
  useEffect(() => {
    fetchRecentGames();
  }, [mongoUserId]);

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
      <>
      <AppBarComponent title="Home" isBackButton={false} isSettings={true} isExit={true}/>
    <Box sx={{ p: 3, pb: 10 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" color="#a042ff" fontWeight="bold" fontFamily={"Times New Roman"} gutterBottom>
          Welcome, {userData?.name || "Chess Player"}
        </Typography>
        {userData?.rating && (
          <Typography variant="body1" color="text.secondary">
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
            <Button color="primary" onClick={() => navigate("/profile")} sx={{ fontWeight: "bold" }}>
                See All
            </Button>
          </Box>

          <Box sx={{ display: "flex", overflowX: "auto", pb: 1 }}>
            {loadingRecentGames ? (
              <CircularProgress sx={{ color: "#5500aa" }} />
            ) : recentGames.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent games found.
              </Typography>
              ) : (
              recentGames.slice(0, 5).map((game, idx) => (
                <Card
                  key={game.id || game._id || idx}
                  sx={{
                    minWidth: 200,
                    mr: 2,
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(85, 0, 170, 0.1)",
                    bgcolor: "#f3e8ff",
                    flexShrink: 0,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {game.opponentName || "Opponent"}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Result: {game.result}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Date: {new Date(game.date).toLocaleDateString()}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate(`/game/${game.id}`)}
                      sx={{ fontWeight: "bold", borderRadius: "8px", boxShadow: "2px 4px 8px rgba(0, 0, 0, 0.779)" }}
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
        <Typography variant="h5" fontWeight="bold" color="#5500aa" gutterBottom>
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
                  <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, fontSize: "16px" }}>
                    Review your study the chess pieces 
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate("/tutorial")}
                    sx={{ alignSelf: "flex-start", fontWeight: "bold", borderRadius: "8px", boxShadow: "2px 4px 8px rgba(0, 0, 0, 0.779)" }}
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
                  <Typography variant="body2" sx={{ mb: 2, flexGrow: 1, fontSize: "16px" }}>
                    You can invite your friends to play with you
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => navigate("/friends")}
                    sx={{ alignSelf: "flex-start", fontWeight: "bold", borderRadius: "8px", boxShadow: "2px 4px 8px rgba(0, 0, 0, 0.779)" }}
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
          bgcolor: "#a046f9",
          mb: 5,
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            💡 Daily Learning Tip
          </Typography>
          <Typography variant="body2">
            Consistent practice is key to improving your chess skills. Dedicate time each day to study tactics, openings, and endgames to see steady progress! 
          </Typography>
        </CardContent>
      </Card>
    </Box>
    </>
    );
};

export default Home;