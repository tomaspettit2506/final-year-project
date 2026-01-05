import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Divider,
  Modal,
  TextField,
  LinearProgress,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SchoolIcon from "@mui/icons-material/School";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import AppBarComponent from "../Components/AppBarComponent";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState("");
    // --- Recent Games State ---
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loadingRecentGames, setLoadingRecentGames] = useState(false);

  // Fetch recent games from backend
  const fetchRecentGames = async () => {
    setLoadingRecentGames(true);
    try {
      const res = await fetch('/games');
      if (!res.ok) throw new Error('Failed to fetch recent games');
      const data = await res.json();
      setRecentGames(data);
    } catch (err) {
      console.error('Error fetching recent games:', err);
    } finally {
      setLoadingRecentGames(false);
    }
  };

  // Add a demo recent game (for testing)
  const addDemoRecentGame = async () => {
    try {
      const res = await fetch('/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: 'Demo Opponent',
          date: new Date().toISOString(),
          result: 'win',
          timeControl: 10,
          moves: 42,
          myAccuracy: 95,
          opponentAccuracy: 80

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
    try {
      const res = await fetch(`/game/${gameId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete game');
      await fetchRecentGames();
    } catch (err) {
      console.error('Error deleting game:', err);
    }
  };

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
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
          // Fetch user's histories
          await fetchRecentGames();
        } else {
          // 🔹 If user is new (no Firestore entry), create a profile and ask for details
          await setDoc(userRef, {
            name: user.displayName || "",
            email: user.email,
            rating: 500,
          });
          setIsModalOpen(true);
        }
        setLoading(false);
      };
      fetchUserData();
      fetchRecentGames();
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
    <>
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
          <SchoolIcon sx={{ verticalAlign: "middle", mr: 1, color: "#5500aa" }} />
          Rating: {userData?.rating || "No rating set"}
        </Typography>
      </Paper>

      <Divider sx={{ mb: 3, bgcolor: "#ddaaff" }} />

      {/* Recent Games Section */}
      <Divider sx={{ my: 3, bgcolor: "#ddaaff" }} />
      <Typography variant="h6" sx={{ mb: 2 }} color="#5500aa" fontWeight="bold">Recent Games</Typography>
      {loadingRecentGames ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress sx={{ height: 8, borderRadius: 5, bgcolor: "#f0e6ff", "& .MuiLinearProgress-bar": { bgcolor: "#5500aa" } }} />
        </Box>
      ) : recentGames.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {recentGames.map((game) => (
            <Grid size={{xs: 12}} key={game._id || game.id}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(85, 0, 170, 0.1)', backgroundColor: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" color="#5500aa">Opponent: {game.opponent}</Typography>
                  <Typography variant="body2" color="text.secondary">Result: {game.result}</Typography>
                  <Typography variant="body2" color="text.secondary">Time Control: {game.timeControl} min</Typography>
                  <Typography variant="body2" color="text.secondary">Moves: {game.moves}</Typography>
                  <Typography variant="body2" color="text.secondary">Date: {game.date ? new Date(game.date).toLocaleString() : 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">My Accuracy: {game.myAccuracy}%</Typography>
                  <LinearProgress 
                    value={game.myAccuracy} 
                    variant="determinate"
                    sx={{ mb: 1, height: 8, borderRadius: 2 }}/>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Opponent Accuracy: {game.opponentAccuracy}%</Typography>
                  <LinearProgress 
                    value={game.opponentAccuracy} 
                    variant="determinate"
                    sx={{ mb: 1, height: 8, borderRadius: 2 }}/>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 2, borderColor: "#ff5555", color: "#ff5555", '&:hover': { borderColor: '#ff0000', bgcolor: '#ffe6e6' } }}
                    onClick={() => deleteRecentGame(game._id || game.id)}>Delete Game</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
            No recent games found.
          </Typography>
          {/* Add Play Button */}
      <Button
        variant="contained"
        sx={{ 
          mt: 3, 
          px: 4, 
          py: 1.5,
          bgcolor: "#5500aa",
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(85, 0, 170, 0.2)',
          '&:hover': {
            bgcolor: '#7722cc',
            boxShadow: '0 6px 16px rgba(85, 0, 170, 0.3)',
          }
        }}
        startIcon={<AddCircleIcon />}
        onClick={() => navigate("/play")}
      >
        Let's Play
      </Button>
        </Box>
      )}
      <Button
        variant="outlined"
        sx={{ mb: 3, color: "#5500aa", borderColor: "#ddaaff", '&:hover': { borderColor: '#5500aa', bgcolor: '#f7f0ff' } }}
        startIcon={<AddCircleIcon />}
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
    </Box>
    </>
  );
};

export default Profile;