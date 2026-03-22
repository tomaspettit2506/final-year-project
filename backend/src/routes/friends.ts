import { Router } from 'express';
import mongoose from 'mongoose';
import { User, Friend } from '../schemas';
import { resolveUserCreatedAt } from '../utils/userCreatedAt';

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

    if (!friendUser) return res.status(404).json({ error: 'Friend not found' });

    await Friend.deleteMany({
      $or: [
        { user: user._id, friendUser: friendUser._id },
        { user: friendUser._id, friendUser: user._id },
      ],
    });

    return res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// GET Friends
router.get('/', async (req, res) => {
  try {
    const friends = await Friend.find().limit(10).sort({ user: 1 });
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

    const friendLinks = await Friend.find({ user: user._id })
      .select('friendUser addedAt')
      .lean();

    const friendObjectIds = friendLinks
      .map((f: any) => f.friendUser)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id)) as mongoose.Types.ObjectId[];

    const friendUsers = await User.find({ _id: { $in: friendObjectIds } })
      .select('name email rating firebaseUid gameRecents avatarColor createdAt')
      .lean();

    const friendMap = new Map(friendUsers.map((u: any) => [String(u._id), u]));

    const friends = friendLinks
      .map((friend: any) => {
        const populated = friendMap.get(String(friend.friendUser));
        if (!populated) return null;

        const friendCreatedAt = resolveUserCreatedAt(populated);
        return {
          friendUser: populated._id,
          friendFirebaseUid: populated.firebaseUid,
          friendName: populated.name,
          friendEmail: populated.email,
          friendRating: populated.rating,
          friendAvatarColor: populated.avatarColor,
          gameRecents: populated.gameRecents,
          friendCreatedAt,
          addedAt: friend.addedAt
        };
      })
      .filter(Boolean);

    return res.json(friends);
  } catch (error) {
    console.error('Error fetching user friends:', error);
    return res.status(500).json({ error: 'Failed to fetch user friends' });
  }
});

// POST Friend
router.post('/', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    if (!userId || !friendId) {
      return res.status(400).json({ error: 'userId and friendId are required' });
    }

    const userFilters: any[] = [{ firebaseUid: userId }];
    const friendFilters: any[] = [{ firebaseUid: friendId }];

    if (mongoose.Types.ObjectId.isValid(userId)) userFilters.push({ _id: userId });
    if (mongoose.Types.ObjectId.isValid(friendId)) friendFilters.push({ _id: friendId });

    const [user, friendUser] = await Promise.all([
      User.findOne({ $or: userFilters }),
      User.findOne({ $or: friendFilters }),
    ]);

    if (!user || !friendUser) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    await Friend.bulkWrite([
      {
        updateOne: {
          filter: { user: user._id, friendUser: friendUser._id },
          update: { $setOnInsert: { user: user._id, friendUser: friendUser._id, addedAt: new Date() } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { user: friendUser._id, friendUser: user._id },
          update: { $setOnInsert: { user: friendUser._id, friendUser: user._id, addedAt: new Date() } },
          upsert: true,
        },
      },
    ], { ordered: false });

    return res.status(201).json({ message: 'Friendship created successfully' });
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