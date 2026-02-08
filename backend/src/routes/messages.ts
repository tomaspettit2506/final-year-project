import { Router } from 'express';
import { Message } from '../schemas';

const router = Router();

// GET messages between two users
router.get('/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  const { before, limit } = req.query;
  const parsedLimit = Math.min(parseInt(String(limit || 100), 10) || 100, 200);
  const beforeDate = before ? new Date(String(before)) : null;

  try {
    const query: any = {
      $or: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId }
      ],
      deleted: false
    };

    if (beforeDate && !Number.isNaN(beforeDate.getTime())) {
      query.timestamp = { $lt: beforeDate };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .lean();

    return res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/:userId/read/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    await Message.updateMany(
      {
        senderId: friendId,
        recipientId: userId,
        read: false
      },
      { $set: { read: true } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// GET unread message count
router.get('/:userId/unread', async (req, res) => {
  const { userId } = req.params;
  try {
    const count = await Message.countDocuments({
      recipientId: userId,
      read: false,
      deleted: false
    });

    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

export default router;
