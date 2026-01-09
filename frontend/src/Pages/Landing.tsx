import { useEffect, useState } from "react";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/swiper-bundle.css";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, firestore } from "../firebase"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import ChessTheme from "../assets/chess_board.jpg";
import { getApiBaseUrl } from "../Services/api";

// Features for the slideshow
const slides = [
  { title: "The Grandmaster Awaits", description: "Step into the world of strategy, legacy, and legendary chess battles." },
  { title: "Meet the Guardians", description: "Mystical protectors and mentors guide the Grandmaster through challenges." },
  { title: "The Challenger Approaches", description: "A cunning rival tests every move, every decision, and every strategy." },
  { title: "The Battle Unfolds", description: "Every move matters. Witness the clash of minds and tactics on the board." },
  { title: "Victory & Legacy", description: "The Grandmaster’s triumph reveals the power of guidance, patience, and strategy." },
  { title: "Your Turn to Master", description: "Use AI-powered tools to plan, learn, and build your chess and life strategy." }
];

const Landing = () => {
  const [screen, setScreen] = useState<"landing" | "login" | "signup">("landing");
  const [form, setForm] = useState({ name: "", rating: 500, email: "", password: "" });

  useEffect(() => {
    document.body.style.overflow = "hidden"; // Disable scrolling
    return () => {
      document.body.style.overflow = "auto"; // Restore scrolling when unmounting
    };
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (screen === "signup" && form.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      if (screen === "signup") {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const user = userCredential.user;

        // Save user details in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
          name: form.name,
          rating: form.rating,
          email: form.email,
        });
        // Notify backend about new user
        try {
          await fetch("/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              rating: form.rating
            }),
          });
        } catch (err) {
          console.error("Failed to POST new user to backend:", err);
        }
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          rating: 500, // Default rating
        });
        // Notify backend about new Google user
        try {
          await fetch(`${getApiBaseUrl()}/user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: user.uid,
              name: user.displayName || "",
              email: user.email,
              rating: 500,
            }),
          });
        } catch (err) {
          console.error("Failed to POST Google user to backend:", err);
        }
      }
    } catch (error: any) {
      alert("Google Sign-In Error: " + error.message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        color: "white",
        padding: "1.5rem",
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0.5)), url(${ChessTheme})`,
      }}
    >
      {/* LANDING PAGE WITH SLIDESHOW */}
      {screen === "landing" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: "400px" }}>
          <Typography variant="h5" fontWeight="bold">Welcome to Guardians of the Chess Grandmaster</Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>Your AI-powered study planner and portfolio builder.</Typography>

          {/* Slideshow */}
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            pagination={{ clickable: true }}
            navigation
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            spaceBetween={50}
            slidesPerView={1}
            style={{ width: "100%", height: "300px", marginTop: "20px" }}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <Typography variant="h5" fontWeight="bold" sx={{color: "white"}}>{slide.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1, maxWidth: "300px", color: "white" }}>{slide.description}</Typography>
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Get Started Button */}
          <Button variant="contained" color="secondary" sx={{ mt: 4, px: 4, py: 1.5, fontSize: "1.2rem" }} onClick={() => setScreen("login")}>
            Get Started
          </Button>
        </motion.div>
      )}

     {/* LOGIN SCREEN */}
        {screen === "login" && (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            
            {/* Back Arrow at the Top */}
            <IconButton onClick={() => setScreen("landing")} sx={{ position: "absolute", top: 20, left: 20, color: "black" }}>
            <ArrowBackIcon fontSize="large" />
            </IconButton>

            <Box
              sx={{
                background: "linear-gradient(grey, black)", 
                backdropFilter: "blur(10px)",
                padding: "40px",
                borderRadius: "15px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
            <Typography variant="h4" fontWeight="bold">Log In</Typography>
            <form onSubmit={handleSubmit}>
            <TextField label="Email" name="email" type="email" fullWidth onChange={handleChange} required sx={{ mb: 2, }} />
            <TextField label="Password" name="password" type="password" fullWidth onChange={handleChange} required sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5 }}>Log In</Button>
            </form>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                sx={{
                  mt: 2,
                  py: 0.8, // Smaller padding
                  px: 2, // Less horizontal padding
                  maxWidth: "280px", // Smaller box width
                  backgroundColor: "black", 
                  color: "#e4e4e4ff", 
                  borderColor: "#221f25ff",
                  borderRadius: "8px", // Softer rounded edges
                  fontSize: "0.85rem", // Slightly smaller text
                  fontWeight: "600",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#ffffffff", 
                    borderColor: "#100222ff",
                    color: "black",
                  },
                }}
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, color: "white" }}>Don't have an account? 
            <Button onClick={() => setScreen("signup")}     
              sx={{
              textTransform: "uppercase",
              color: "white", // Ensures contrast
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "#e8e8e8ff", 
                borderColor: "#110f14ff",
                color: "black",
              }}}
              >Sign Up</Button></Typography>
          </Box>
        </motion.div>
          
    )}

    {/* SIGNUP SCREEN */}
        {screen === "signup" && (
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>

            {/* Back Arrow at the Top */}
            <IconButton onClick={() => setScreen("login")} sx={{ position: "absolute", top: 20, left: 20, color: "black" }}>
            <ArrowBackIcon fontSize="large" />
            </IconButton>
            <Box
              sx={{
                background: "linear-gradient(grey, black)", 
                backdropFilter: "blur(10px)",
                padding: "40px",
                borderRadius: "15px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
            <Typography variant="h4" fontWeight="bold">Sign Up</Typography>
            <form onSubmit={handleSubmit}>
            <TextField label="Full Name" name="name" fullWidth onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField label="Rating" placeholder="E.g. 500 or 1000" name="rating" type="number" fullWidth onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField label="Email" name="email" type="email" fullWidth onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField label="Password" name="password" type="password" fullWidth onChange={handleChange} required sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5 }}>Sign Up</Button>
            </form>
          </Box>
        </motion.div>
        )}
    </Box>
  );
};

export default Landing;