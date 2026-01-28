import { Router } from 'express';
import mongoose from 'mongoose';
import { User, GameInvite } from '../schemas';

const router = Router();

// POST Accept game invite (more specific, comes before general :id routes)
router.post('/:id/accept', async (req, res) => {
  const inviteId = req.params.id;
  try {
    const invite = await GameInvite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Invite already processed' });

    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return res.status(400).json({ error: 'Invite has expired' });
    }

    invite.status = 'accepted';
    await invite.save();

    return res.status(200).json({ message: 'Game invite accepted', roomId: invite.roomId, invite });
  } catch (error) {
    console.error('Failed to accept game invite:', error);
    return res.status(500).json({ error: 'Failed to accept game invite' });
  }
});

// DELETE Game Invite (Decline) - more specific, comes before general :id routes
router.delete('/:id/decline', async (req, res) => {
  const inviteId = req.params.id;
  try {
    await GameInvite.findByIdAndDelete(inviteId);
    return res.status(200).json({ message: 'Game invite deleted successfully' });
  } catch (error) {
    console.error('Failed to delete game invite:', error);
    return res.status(500).json({ error: 'Failed to delete game invite' });
  }
});

// GET Game Invites (incoming invites for current user)
router.get('/', async (req, res) => {
  try {
    const { userId, toUserId } = req.query;
    const targetUserId = toUserId || userId;

    if (!targetUserId) return res.status(400).json({ error: 'userId or toUserId query parameter required' });

    const user = await User.findOne({ firebaseUid: targetUserId });
    if (!user) return res.json([]);

    const invites = await GameInvite.find({
      toUser: user._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
      .populate('fromUser', 'name email rating firebaseUid')
      .sort({ createdAt: -1 });

    return res.json(invites);
  } catch (error) {
    console.error('Error fetching game invites:', error);
    return res.status(500).json({ error: 'Failed to fetch game invites' });
  }
});

// GET Game Invite by Room ID (for fetching timer settings)
router.get('/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const invite = await GameInvite.findOne({ roomId })
      .populate('fromUser', 'name email rating firebaseUid')
      .populate('toUser', 'name email rating firebaseUid');
    
    if (!invite) {
      return res.status(404).json({ error: 'Game invite not found for this room' });
    }

    return res.json(invite);
  } catch (error) {
    console.error('Error fetching game invite by room:', error);
    return res.status(500).json({ error: 'Failed to fetch game invite' });
  }
});

// POST Game Invite (send challenge with room ID to a friend)
router.post('/', async (req, res) => {
  const { fromUserId, toUserId, roomId, timeControl, rated } = req.body;
  try {
    // Validate required fields
    if (!fromUserId || !toUserId || !roomId) {
      return res.status(400).json({ error: 'fromUserId, toUserId, and roomId are required' });
    }

    // Build flexible filters but avoid invalid ObjectId cast errors
    const buildUserFilter = (id: string) => {
      const filters: any[] = [{ firebaseUid: id }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        filters.push({ _id: id });
      }
      return { $or: filters };
    };

    const fromUser = await User.findOne(buildUserFilter(fromUserId));
    const toUser = await User.findOne(buildUserFilter(toUserId));

    if (!fromUser) return res.status(404).json({ error: 'Sender user not found in database' });
    if (!toUser) return res.status(404).json({ error: 'Recipient user not found in database' });

    const existingInvite = await GameInvite.findOne({
      fromUser: fromUser._id,
      toUser: toUser._id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) return res.status(400).json({ error: 'Active game invite already sent to this friend' });

    const newInvite = new GameInvite({
      fromUser: fromUser._id,
      toUser: toUser._id,
      roomId,
      timeControl: timeControl || '10',
      rated: rated || false
    });
    await newInvite.save();
    await newInvite.populate('fromUser', 'name email rating firebaseUid');

    return res.status(201).json(newInvite);
  } catch (error: any) {
    console.error('Failed to save game invite:', error?.message || error);
    return res.status(500).json({ error: 'Failed to save game invite', details: error?.message });
  }
});

export default router;