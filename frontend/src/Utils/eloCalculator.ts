/**
 * Calculate Elo rating change for a chess game
 * @param playerRating - Current rating of the player
 * @param opponentRating - Current rating of the opponent
 * @param score - Result: 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor - K-factor (default 32 for regular games, 16 for masters)
 * @returns Rating change (can be positive or negative)
 */
export const calculateEloChange = (
  playerRating: number,
  opponentRating: number,
  score: number,
  kFactor: number = 32
): number => {
  // Expected score formula: 1 / (1 + 10^((opponentRating - playerRating) / 400))
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Rating change: K * (actual score - expected score)
  const ratingChange = Math.round(kFactor * (score - expectedScore));
  
  return ratingChange;
};

/**
 * Calculate new ratings for both players after a game
 * @param player1Rating - Current rating of player 1
 * @param player2Rating - Current rating of player 2
 * @param result - Game result: 'win' | 'loss' | 'draw' (from player1's perspective)
 * @param kFactor - K-factor for rating calculation
 * @returns Object with new ratings for both players
 */
export const calculateNewRatings = (
  player1Rating: number,
  player2Rating: number,
  result: 'win' | 'loss' | 'draw',
  kFactor: number = 32
): { player1NewRating: number; player2NewRating: number; player1Change: number; player2Change: number } => {
  // Determine scores based on result (from player1's perspective)
  let player1Score: number;
  let player2Score: number;

  if (result === 'win') {
    // Player 1 won
    player1Score = 1;
    player2Score = 0;
  } else if (result === 'loss') {
    // Player 1 lost
    player1Score = 0;
    player2Score = 1;
  } else {
    // Draw
    player1Score = 0.5;
    player2Score = 0.5;
  }

  // Calculate rating changes
  const player1Change = calculateEloChange(player1Rating, player2Rating, player1Score, kFactor);
  const player2Change = calculateEloChange(player2Rating, player1Rating, player2Score, kFactor);

  // Calculate new ratings (minimum rating floor of 100)
  const player1NewRating = Math.max(100, player1Rating + player1Change);
  const player2NewRating = Math.max(100, player2Rating + player2Change);

  return {
    player1NewRating,
    player2NewRating,
    player1Change,
    player2Change
  };
};

/**
 * Get rating tier classification based on Elo rating
 * @param rating - Elo rating
 * @returns Rating tier string
 */
export const getRatingTier = (rating: number): string => {
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2200) return 'International Master';
  if (rating >= 2000) return 'FIDE Master';
  if (rating >= 1800) return 'Candidate Master';
  if (rating >= 1600) return 'Expert';
  if (rating >= 1400) return 'Class A';
  if (rating >= 1200) return 'Class B';
  if (rating >= 1000) return 'Class C';
  if (rating >= 800) return 'Class D';
  return 'Beginner';
};