import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../schemas';
import { calculateStats } from '../utils/statsCalculator';

const router = Router();

// GET Users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().limit(10).sort({ rating: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// POST User
router.post('/', async (req, res) => {
  const { name, email, rating } = req.body;
  try {
    const newUser = new User({ name, email, rating });
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save user data' });
  }
});

// GET or CREATE User by email
router.post('/email/:email', async (req, res) => {
  const email = req.params.email;
  const { name, rating, firebaseUid } = req.body;
  try {
    let user: any;
    
    // If firebaseUid provided, use ONLY firebaseUid for lookup (strict)
    if (firebaseUid) {
      user = await User.findOne({ firebaseUid });
      // Fallback: if no user by firebaseUid, try email to avoid duplicate email creation
      if (!user) {
        user = await User.findOne({ email });
      }
    } else {
      // If only email provided, use ONLY email
      user = await User.findOne({ email });
    }

    if (!user) {
      // Ensure firebaseUid is always provided for new users
      const newUserData: any = {
        name: name || email.split('@')[0],
        email,
        rating: rating || 500
      };
      
      // Only add firebaseUid if provided to avoid undefined in unique field
      if (firebaseUid) {
        newUserData.firebaseUid = firebaseUid;
      }
      
      user = new User(newUserData);
      await user.save();
    } else if (firebaseUid && !user.firebaseUid) {
      // Update user with firebaseUid if they didn't have one
      user.firebaseUid = firebaseUid;
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error in /user/email:', error);
    return res.status(500).json({ error: 'Failed to get or create user' });
  }
});

// UPDATE User
router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, rating } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { name, email, rating }, { new: true });
    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user data' });
  }
});

// GET User's recent games by Mongo _id or Firebase UID
router.get('/:id/games', async (req, res) => {
  const { id } = req.params;
  try {
    const filter: any = [{ firebaseUid: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter.push({ _id: id });
    }

    const user = await User.findOne({ $or: filter });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user.gameRecents || []);
  } catch (error) {
    console.error('Error fetching user games:', error);
    return res.status(500).json({ error: 'Failed to fetch user games' });
  }
});

// GET User's statistics computed from MongoDB games
// Always computed from source of truth (gameRecents), never from Firestore
router.get('/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const filter: any = [{ firebaseUid: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter.push({ _id: id });
    }

    const user = await User.findOne({ $or: filter });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Always compute stats from source of truth: MongoDB gameRecents
    const stats = calculateStats(user.gameRecents || []);
    
    return res.json(stats);
  } catch (error) {
    console.error('Error computing user stats:', error);
    return res.status(500).json({ error: 'Failed to compute user stats' });
  }
});

// GET User's friends by Firebase UID
router.get('/:firebaseUid/friends', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    if (!firebaseUid) return res.status(400).json({ error: 'firebaseUid parameter required' });

    const user = await User.findOne({ firebaseUid }).lean();
    if (!user) return res.json([]);

    // Collect only valid ObjectIds to avoid CastErrors during populate
    const friendObjectIds = (user.friends || [])
      .map((f: any) => f.friendUser)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id)) as mongoose.Types.ObjectId[];

    const friendUsers = await User.find({ _id: { $in: friendObjectIds } })
      .select('name email rating firebaseUid gameRecents')
      .lean();

    const friendMap = new Map(friendUsers.map((u) => [u._id.toString(), u]));

    const friends = (user.friends || []).map((friend: any) => {
      const populated = friend.friendUser && friendMap.get(friend.friendUser.toString());
      return {
        friendUser: friend.friendUser,
        friendFirebaseUid: populated?.firebaseUid || friend.friendFirebaseUid,
        friendName: populated?.name || friend.friendName,
        friendEmail: populated?.email || friend.friendEmail,
        friendRating: populated?.rating ?? friend.friendRating,
        gameRecents: populated?.gameRecents,
        addedAt: friend.addedAt
      };
    });

    return res.json(friends);
  } catch (error) {
    console.error('Error fetching user friends:', error);
    return res.status(500).json({ error: 'Failed to fetch user friends' });
  }
});

// DELETE friendship between two users
router.delete('/:firebaseUid/friend/:friendId', async (req, res) => {
  const { firebaseUid, friendId } = req.params;
  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build a safe filter list to avoid CastErrors on invalid ObjectIds
    const friendFilters: any[] = [{ firebaseUid: friendId }];
    if (mongoose.Types.ObjectId.isValid(friendId)) {
      friendFilters.push({ _id: friendId });
    }

    // Try to find the friend by Firebase UID first, then by MongoDB ID when valid
    const friendUser = await User.findOne({ $or: friendFilters });

    if (friendUser) {
      // Remove by MongoDB ObjectId
      user.friends.pull({ friendUser: friendUser._id });
    } else {
      // Try removing by friendFirebaseUid if no user found
      user.friends = (user.friends as any).filter((f: any) => f.friendFirebaseUid !== friendId);
    }

    await user.save();
    return res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// DELETE User
router.delete('/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    await User.findByIdAndDelete(userId);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete user data' });
  }
});

export default router;
