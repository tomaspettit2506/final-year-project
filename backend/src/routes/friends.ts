import { Router } from 'express';
import mongoose from 'mongoose';
import { User, Friend } from '../schemas';

const router = Router();

// DELETE friendship between two users (more specific, must come first)
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
      (user as any).friends = (user.friends as any[]).filter((f: any) => f.friendFirebaseUid !== friendId);
    }

    await user.save();
    return res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// GET Friends
router.get('/', async (req, res) => {
  try {
    const friends = await Friend.find().limit(10).sort({ userId: 1 });
    return res.json(friends);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch friend data' });
  }
});

// GET User's friends by Firebase UID (more specific than general routes, comes after more specific paths)
router.get('/:firebaseUid', async (req, res) => {
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
      .select('name email rating firebaseUid gameRecents avatarColor')
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
        friendAvatarColor: populated?.avatarColor,
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

// POST Friend
router.post('/', async (req, res) => {
  const { friendName, friendEmail, friendRating } = req.body;
  try {
    const newFriend = new Friend({ friendName, friendEmail, friendRating });
    await newFriend.save();
    return res.status(201).json(newFriend);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save friend data' });
  }
});

// DELETE Friend
router.delete('/:id', async (req, res) => {
  const friendId = req.params.id;
  try {
    await Friend.findByIdAndDelete(friendId);
    return res.status(200).json({ message: 'Friend deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete friend data' });
  }
});

export default router;