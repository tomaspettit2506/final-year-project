import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

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

  