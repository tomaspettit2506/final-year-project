import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, IconButton, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/swiper-bundle.css";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, firestore } from "../firebase"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { getRandomColor } from "../Utils/avatarColors";
import WelcomeApp from "../assets/img-theme/WelcomeApp.jpeg";

// Features for the slideshow
const slides = [
  { title: "The Grandmaster Awaits", description: "Step into the world of strategy, legacy, and legendary chess battles." },
  { title: "Meet the Guardians", description: "Mystical protectors and mentors guide the Grandmaster through challenges." },
  { title: "The Challenger Approaches", description: "A cunning rival tests every move, every decision, and every strategy." },
  { title: "The Battle Unfolds", description: "Every move matters. Witness the clash of minds and tactics on the board." },
  { title: "Victory & Legacy", description: "The Grandmaster's triumph reveals the power of guidance, patience, and strategy." },
  { title: "Your Turn to Master", description: "Use AI-powered tools to plan, learn, and build your chess and life strategy." }
];

const Landing = () => {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<"landing" | "login" | "signup">("landing");
  const [form, setForm] = useState({ name: "", rating: 500, email: "", password: "" });

  useEffect(() => {
    // Only disable scrolling on landing screen, allow scrolling on other screens
    if (screen === "landing") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [screen]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simulate loading
    return () => clearTimeout(timer);
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
        const avatarColor = getRandomColor();

        // Save user details in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
          name: form.name,
          rating: form.rating,
          email: form.email || "",
          avatarColor: avatarColor,
        });
        // Notify backend about new user
        try {
          await fetch("/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              rating: form.rating,
              avatarColor: avatarColor
            }),
          });
        } catch (err) {
          console.error("Failed to POST new user to backend:", err);
        }
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (error: unknown) {
      alert((error as Error).message);
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
          email: user.email || "",
          rating: 500, // Default rating
          avatarColor: getRandomColor(),
        });
      }
    } catch (error: unknown) {
      alert("Google Sign-In Error: " + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

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
        backgroundImage: `url(${WelcomeApp})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflowY: screen === "landing" ? "hidden" : "auto",
      }}
    >
      {/* LANDING PAGE WITH SLIDESHOW */}
      {screen === "landing" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chessboard-landing" transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: "400px", backgroundColor: "rgba(0, 0, 0, 0.6)", padding: "2rem", borderRadius: "15px" }}>
          <Typography variant="h5" fontWeight="bold" sx={{fontSize: "2rem"}}>Welcome to Guardians of the Chess Grandmaster</Typography>
          <Typography variant="h6" sx={{ mt: 2, fontSize: "1.5rem" }}>Your Chess Journey Awaits</Typography>

          {/* Slideshow */}
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            pagination={{ clickable: true }}
            navigation
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            spaceBetween={50}
            slidesPerView={1}
            style={{ width: "100%", height: "300px", marginTop: "12px" }}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", fontSize: "1rem" }}>
                  <Typography variant="h5" fontWeight="bold">{slide.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1, maxWidth: "300px" }}>{slide.description}</Typography>
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Get Started Button */}
          <Button variant="contained" sx={{ mt: 4, px: 4, py: 1.5, fontSize: "1.2rem", bgcolor: "rgb(51, 106, 145)" }} onClick={() => setScreen("login")}>
            Get Started
          </Button>
        </motion.div>
      )}

     {/* LOGIN SCREEN */}
        {screen === "login" && (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            
            {/* Back Arrow at the Top */}
            <IconButton onClick={() => setScreen("landing")} sx={{ position: "absolute", top: 20, left: 20, color: "white"}}>
            ⬅️
            </IconButton>

            <Box
              sx={{
                color: "white",
                backdropFilter: "blur(10px)",
                padding: "40px",
                borderRadius: "15px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
              }}
              className="chessboard-landing"
            >
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3.5 }}>Log In</Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "rgb(68, 87, 101)", padding: "20px", borderRadius: "10px" }}>
                <TextField label="Email" name="email" type="email" fullWidth onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
                <TextField label="Password" name="password" type="password" fullWidth  onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
              </Box>
            <Button type="submit" variant="contained" fullWidth sx={{ mb: 5, py: 1.5, border: "2px solid rgb(51, 106, 145)", bgcolor: "rgb(51, 106, 145)" }}>Log In</Button>
            </form>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                sx={{
                  mt: 0.25, // Slightly less top margin
                  py: 0.8, // Smaller padding
                  px: 2, // Less horizontal padding
                  width: "100%", // Smaller box width
                  height: "48px", // Smaller box height
                  backgroundColor: "black", 
                  color: "#e4e4e4ff",
                  border: "2px solid #e4e4e4ff",
                  borderRadius: "8px", // Softer rounded edges
                  fontSize: "1.05rem", // Slightly smaller text
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
            <Typography variant="body2" sx={{ mt: 2, fontSize: "1.25rem" }}>Don't have an account? 
            <Button fullWidth onClick={() => setScreen("signup")}     
              sx={{
              textTransform: "uppercase",
              bgcolor: "black",
              border: "2px solid #e4e4e4ff",
              borderRadius: "8px",
              fontSize: "1.5rem",
              padding: "0.25rem 0.75rem",
              mt: 1.5,
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
            ⬅️
            </IconButton>
            <Box
              sx={{
                backdropFilter: "blur(10px)",
                padding: "40px",
                borderRadius: "15px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
              }}
              className="chessboard-landing"
            >
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3.5 }}>Sign Up</Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "rgb(68, 87, 101)", padding: "20px", borderRadius: "10px" }}>
                <TextField label="Full Name" name="name" fullWidth onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
                <TextField label="Rating" placeholder="E.g. 500 or 1000" name="rating" type="number" fullWidth onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
                <TextField label="Email" name="email" type="email" fullWidth onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
                <TextField label="Password" name="password" type="password" fullWidth onChange={handleChange} required sx={{ mb: 2, bgcolor: "rgba(69, 69, 69, 0.85)" }} />
              </Box>
            <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, border: "2px solid rgb(51, 106, 145)", bgcolor: "rgb(51, 106, 145)" }}>Sign Up</Button>
            </form>
          </Box>
        </motion.div>
        )}
    </Box>
  );
};

export default Landing;