import { Router } from 'express';
import { User, Game } from '../schemas';

const router = Router();

// GET Games (all games globally)
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().limit(10).sort({ date: -1 });
    return res.json(games);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// GET User's recent games
router.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user.gameRecents || []);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user games' });
  }
});

// POST Game (add game and link to user's gameRecents)
router.post('/', async (req, res) => {
  const { myRating, opponent, opponentRating, date, result, timeControl, termination, moves, duration, myAccuracy, opponentAccuracy, userId } = req.body;
  try {
    const newGame = new Game({
      myRating,
      opponent,
      opponentRating,
      date,
      result,
      timeControl,
      termination,
      moves,
      duration,
      myAccuracy,
      opponentAccuracy
    });
    await newGame.save();

    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            gameRecents: {
              myRating, opponent, opponentRating, date, result, timeControl, termination, moves, duration, myAccuracy, opponentAccuracy, _id: newGame._id
            }
          }
        },
        { new: true }
      );
    }

    res.status(201).json(newGame);
  } catch (error) {
    console.error('Error saving game:', error);
    return res.status(500).json({ error: 'Failed to save game data' });
  }
});

// DELETE Game
router.delete('/:id', async (req, res) => {
  const gameId = req.params.id;
  const { userId, firebaseUid } = req.query;

  try {
    if (userId || firebaseUid) {
      const user = userId
        ? await User.findById(userId)
        : await User.findOne({ firebaseUid });

      if (!user) return res.status(404).json({ error: 'User not found' });

      const result = await User.updateOne(
        { _id: user._id },
        { $pull: { gameRecents: { _id: gameId } } }
      );

      return res.status(200).json({
        message: result.modifiedCount
          ? 'Game removed from user recents'
          : 'Game not found in user recents'
      });
    }

    await User.updateMany(
      { 'gameRecents._id': gameId },
      { $pull: { gameRecents: { _id: gameId } } }
    );

    await Game.findByIdAndDelete(gameId);
    return res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return res.status(500).json({ error: 'Failed to delete game data' });
  }
});

export default router;
