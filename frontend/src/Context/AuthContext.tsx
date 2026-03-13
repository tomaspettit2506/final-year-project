import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserRating } from "../Utils/FirestoreService";
import { initializePwaNotifications } from "../Utils/Notifications"; 
import { socket } from "../Services/socket";

// Define authentication context type
interface AuthContextType {
  user: User | null;
  userData: any | null;
  logout: () => Promise<void>;
}

// Create authentication context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('join_user_room', {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Friend',
        });

        const userProfile = await getUserRating(currentUser.uid); // ✅ Fetch Firestore Data
        setUserData(userProfile);
        // Request notification permission when user logs in
        await initializePwaNotifications();
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, userData, logout }}>{children}</AuthContext.Provider>;
};

// Custom hook for accessing authentication state
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};