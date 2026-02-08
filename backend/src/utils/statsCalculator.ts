/**
 * Centralized statistics calculator for user game records
 * This ensures consistent stats calculation across the entire application
 */

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
}

/**
 * Normalize game result string to lowercase for consistent comparison
 * Handles variations like "win", "Won", "LOSS", "draw", etc.
 */
function normalizeResult(result: string | undefined | null): string {
  if (!result) return '';
  return (result || '').toLowerCase().trim();
}

/**
 * Calculate statistics from an array of game records
 * @param games - Array of game objects with 'result' field
 * @returns GameStats object with wins, losses, draws, totals, and win rate
 */
export function calculateStats(games: any[]): GameStats {
  if (!Array.isArray(games) || games.length === 0) {
    return {
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      winRate: 0
    };
  }

  const stats = games.reduce(
    (acc, game) => {
      const result = normalizeResult(game?.result);

      if (['win', 'won'].includes(result)) {
        acc.wins += 1;
      } else if (['loss', 'lose', 'lost'].includes(result)) {
        acc.losses += 1;
      } else if (['draw', 'tie'].includes(result)) {
        acc.draws += 1;
      }

      return acc;
    },
    { wins: 0, losses: 0, draws: 0 }
  );

  const totalGames = stats.wins + stats.losses + stats.draws;
  const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  return {
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    totalGames,
    winRate
  };
}

/**
 * Get only the key stats (wins, losses, draws) for Firestore sync
 * This ensures Firestore is only used for display, not as source of truth
 */
export function getStatsForDisplay(games: any[]): { wins: number; losses: number; draws: number } {
  const stats = calculateStats(games);
  return {
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws
  };
}
