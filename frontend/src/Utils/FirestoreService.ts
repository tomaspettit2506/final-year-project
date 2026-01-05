import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Create a new user document in Firestore
 */
export const createUserProfile = async (uid: string, name: string, email: string) => {
  try {
    await setDoc(doc(db, "users", uid), {
      name,
      email,
      rating: 500, // User selects later
    });
    console.log("User profile created successfully.");
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
};

/**
 * Set the user's rating in Firestore
 */
export const setUserRating = async (uid: string, ratingScore: number) => {
    try {
      console.log(`Saving rating score "${ratingScore}" for user ${uid}`);
  
      await setDoc(doc(db, "users", uid), { rating: ratingScore }, { merge: true });
  
      console.log("Firestore: Course saved successfully!");
    } catch (error) {
      console.error("Firestore: Error saving course:", error);
    }
  };

/**
 * Get user profile details from Firestore
 */
export const getUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data(); // Returns { name: "Tomás", email: "tomas@example.com", ... }
      } else {
        return null; // User does not exist
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  /**
 * Get the user's rating from Firestore
 */
export const getUserRating = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      let rating = null;
      let name = null; // ✅ Add name variable
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        rating = userData.rating || null;
        name = userData.name || null; // ✅ Fetch name from Firestore
      }
      
      return { name, rating }; // ✅ Return name along with rating and histories
    } catch (error) {
      console.error("Firestore: Error fetching rating and histories:", error);
      return { name: null, rating: null }; // ✅ Return null values in case of error
    }

  };
  
/**
 * Update rating  for a user
 */
export const updateRating = async (uid: string, newRating: number) => {
    try {
      await updateDoc(doc(db, "users", uid), { rating: newRating });
      console.log("User rating updated successfully.");
    } catch (error) {
      console.error("Error updating user rating:", error);
    }
  };
  