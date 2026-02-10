import { Router } from 'express';
import { User, Game } from '../schemas';
import { calculateNewRatings } from '../utils/eloCalculator';

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
// Accepts userId (MongoDB _id) OR firebaseUid
// Will look up user by either identifier
router.post('/', async (req, res) => {
  const { myRating, opponent, opponentRating, date, result, isRated, timeControl, termination, moves, duration, myAccuracy, opponentAccuracy, playerColor, userId, firebaseUid } = req.body;
  
  console.log(`[Game Save] Received game data:`, { myRating, opponent, opponentRating, result, isRated, playerColor, userId, firebaseUid });
  
  try {
    // Calculate Elo rating changes for rated games
    let myNewRating = myRating;
    let opponentNewRating = opponentRating;
    let ratingChange = 0;
    let opponentRatingChange = 0;

    if (isRated) {
      console.log(`[Elo] Calculating ratings for result: ${result}`);
      const ratingChanges = calculateNewRatings(
        myRating,
        opponentRating,
        result, // 'win', 'loss', or 'draw'
        32 // K-factor
      );
      
      myNewRating = ratingChanges.player1NewRating;
      opponentNewRating = ratingChanges.player2NewRating;
      ratingChange = ratingChanges.player1Change;
      opponentRatingChange = ratingChanges.player2Change;
      
      console.log(`[Elo] Rating changes - Player: ${myRating} → ${myNewRating} (${ratingChange > 0 ? '+' : ''}${ratingChange}), Opponent: ${opponentRating} → ${opponentNewRating} (${opponentRatingChange > 0 ? '+' : ''}${opponentRatingChange})`);
    } else {
      console.log(`[Elo] Game is not rated, skipping rating calculations`);
    }

    const newGame = new Game({
      myRating,
      myNewRating,
      ratingChange,
      opponent,
      opponentRating,
      opponentNewRating,
      opponentRatingChange,
      date,
      result,
      isRated: isRated || false,
      timeControl,
      termination,
      moves,
      duration,
      myAccuracy,
      opponentAccuracy,
      playerColor
    });
    await newGame.save();

    // Find user by userId (MongoDB _id) or firebaseUid
    if (userId || firebaseUid) {
      const filter: any = [];
      
      if (firebaseUid) {
        filter.push({ firebaseUid });
      }
      
      if (userId && require('mongoose').Types.ObjectId.isValid(userId)) {
        filter.push({ _id: userId });
      }

      if (filter.length === 0) {
        console.warn('Warning: Invalid userId or firebaseUid provided - game will not be linked to any user');
        return res.status(201).json(newGame);
      }

      const user = await User.findOne({ $or: filter });
      
      if (user) {
        // Check for duplicate game before adding
        const gameDate = new Date(date).toDateString();
        const isDuplicate = user.gameRecents.some((game: any) => {
          const existingGameDate = new Date(game.date).toDateString();
          return game.opponent === opponent &&
                 existingGameDate === gameDate &&
                 game.result === result &&
                 game.moves === moves;
        });

        if (isDuplicate) {
          console.log(`[Duplicate] Duplicate game detected for user ${user._id}: ${opponent} on ${gameDate} - skipping game save but updating rating`);
          
          // Duplicate game - only update rating, don't add to gameRecents again
          if (isRated) {
            const updatedUser = await User.findByIdAndUpdate(
              user._id, 
              { $set: { rating: myNewRating } }, 
              { new: true }
            );
            console.log(`[Elo] Updated duplicate game submitter ${user._id} (${user.name}) rating: ${user.rating} → ${updatedUser?.rating}`);
          }
        } else {
          // Not a duplicate - add game and update rating
          const updateData: any = {
            $push: {
              gameRecents: {
                myRating, 
                myNewRating,
                ratingChange,
                opponent, 
                opponentRating,
                opponentNewRating,
                opponentRatingChange,
                date, 
                result, 
                isRated: isRated || false,
                timeControl, 
                termination, 
                moves, 
                duration, 
                myAccuracy, 
                opponentAccuracy,
                playerColor,
                _id: newGame._id
              }
            }
          };

          if (isRated) {
            updateData.$set = { rating: myNewRating };
            console.log(`[Elo] Updating user ${user._id} (${user.name}) rating: ${myRating} → ${myNewRating}`);
          }

          const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });
          console.log(`[Elo] User updated, current rating in DB: ${updatedUser?.rating}`);
        }

        // If opponent is also a registered user, update their rating too (only if not duplicate)
        if (isRated && opponent && !isDuplicate) {
          const opponentUser = await User.findOne({ 
            $or: [
              { name: opponent },
              { email: opponent }
            ]
          });

          if (opponentUser) {
            // Determine opponent's result (opposite of current player)
            const opponentResult = result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw';
            
            console.log(`[Elo] Found opponent user ${opponentUser._id} (${opponentUser.name}), updating rating: ${opponentRating} → ${opponentNewRating}`);
            
            // Check if opponent already has this game
            const opponentHasGame = opponentUser.gameRecents.some((game: any) => {
              const existingGameDate = new Date(game.date).toDateString();
              return game.opponent === user.name &&
                     existingGameDate === gameDate &&
                     game.result === opponentResult &&
                     game.moves === moves;
            });

            if (opponentHasGame) {
              // Opponent already has this game, just update their rating
              console.log(`[Elo] Opponent already has this game, updating rating only`);
              const updatedOpponent = await User.findByIdAndUpdate(
                opponentUser._id,
                { $set: { rating: opponentNewRating } },
                { new: true }
              );
              console.log(`[Elo] Opponent updated, current rating in DB: ${updatedOpponent?.rating}`);
            } else {
              // Add game to opponent's history and update rating
              // Opponent's color is opposite of player's color
              const opponentColor = playerColor === 'white' ? 'black' : playerColor === 'black' ? 'white' : undefined;
              
              const updatedOpponent = await User.findByIdAndUpdate(
                opponentUser._id,
                { 
                  $set: { rating: opponentNewRating },
                  $push: {
                    gameRecents: {
                      myRating: opponentRating,
                      myNewRating: opponentNewRating,
                      ratingChange: opponentRatingChange,
                      opponent: user.name || 'Unknown',
                      opponentRating: myRating,
                      opponentNewRating: myNewRating,
                      opponentRatingChange: ratingChange,
                      date,
                      result: opponentResult,
                      isRated: true,
                      timeControl,
                      termination,
                      moves,
                      duration,
                      myAccuracy: opponentAccuracy || 0,
                      opponentAccuracy: myAccuracy || 0,
                      playerColor: opponentColor,
                      _id: newGame._id
                    }
                  }
                },
                { new: true }
              );
              console.log(`[Elo] Opponent updated, current rating in DB: ${updatedOpponent?.rating}`);
            }
          } else {
            console.log(`[Elo] Opponent user not found in database for name/email: ${opponent}`);
          }
        } else if (isRated && opponent && isDuplicate) {
          console.log(`[Elo] This is a duplicate submission, won't update opponent rating here (they should update themselves)`);
        } else {
          console.log(`[Elo] Skipping opponent rating update - isRated: ${isRated}, opponent: ${opponent}`);
        }
      } else {
        console.warn(`Warning: User not found for userId: ${userId}, firebaseUid: ${firebaseUid} - game will not be linked to any user`);
      }
    } else {
      console.warn('Warning: Game posted without userId or firebaseUid - game will not be linked to any user');
    }

    console.log(`[Game Save] Successfully saved game, returning response`);
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
