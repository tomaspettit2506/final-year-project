import { Router } from 'express';
import { User, Request } from '../schemas';
import { ensureFriendsList, addFriendIfMissing } from '../utils/friend';

const router = Router();

// POST Accept friend request (more specific, comes before general :id routes)
router.post('/:id/accept', async (req, res) => {
  const requestId = req.params.id;
  try {
    const request = await Request.findById(requestId).populate('fromUser toUser');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    request.status = 'accepted';
    await request.save();

    const fromUser: any = request.fromUser;
    const toUser: any = request.toUser;

    if (!fromUser || !toUser) return res.status(400).json({ error: 'Invalid users on request' });

    addFriendIfMissing(toUser, fromUser);
    addFriendIfMissing(fromUser, toUser);

    await toUser.save();
    await fromUser.save();

    return res.status(200).json({ message: 'Friend request accepted', request, friends: toUser.friends });
  } catch (error) {
    console.error('Failed to accept request:', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

// DELETE Decline friend request (more specific, comes before general :id routes)
router.delete('/:id/decline', async (req, res) => {
  const requestId = req.params.id;
  try {
    await Request.findByIdAndDelete(requestId);
    return res.status(200).json({ message: 'Friend request declined successfully' });
  } catch (error) {
    console.error('Failed to decline request:', error);
    return res.status(500).json({ error: 'Failed to decline request' });
  }
});

// GET Requests (incoming friend requests for current user)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query parameter required' });

    const user = await User.findOne({ firebaseUid: userId });
    if (!user) return res.json([]);

    const requests = await Request.find({ toUser: user._id, status: 'pending' })
      .populate('fromUser', 'name email rating firebaseUid')
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({ error: 'Failed to fetch request data' });
  }
});

// POST Request (send friend request)
router.post('/', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  try {
    const fromUser = await User.findOne({ firebaseUid: fromUserId });
    const toUser = await User.findOne({ firebaseUid: toUserId });

    if (!fromUser) return res.status(404).json({ error: 'Sender user not found in database' });
    if (!toUser) return res.status(404).json({ error: 'Recipient user not found in database' });

    const existingRequest = await Request.findOne({
      fromUser: fromUser._id,
      toUser: toUser._id,
      status: 'pending'
    });

    if (existingRequest) return res.status(400).json({ error: 'Friend request already sent' });

    const newRequest = new Request({ fromUser: fromUser._id, toUser: toUser._id });
    await newRequest.save();
    await newRequest.populate('fromUser', 'name email rating firebaseUid');

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error('Failed to save request:', error);
    return res.status(500).json({ error: 'Failed to save request data' });
  }
});

// DELETE request
router.delete('/:id', async (req, res) => {
  const requestId = req.params.id;
  try {
    await Request.findByIdAndDelete(requestId);
    return res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete request data' });
  }
});

export default router;
