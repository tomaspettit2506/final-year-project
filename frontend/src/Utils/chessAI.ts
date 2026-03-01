import type { Board, PieceColor, Position } from '../Types/chess';
import { getAllLegalMoves, isCheckmate, applyMove } from './chessLogic';

const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

const POSITION_BONUS = {
  pawn: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  knight: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  bishop: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  rook: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  queen: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  king: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

function evaluateBoard(board: Board, color: PieceColor): number {
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      
      const pieceValue = PIECE_VALUES[piece.type];
      const positionValue = POSITION_BONUS[piece.type][piece.color === 'white' ? row : 7 - row][col];
      const totalValue = pieceValue + positionValue;
      
      if (piece.color === color) {
        score += totalValue;
      } else {
        score -= totalValue;
      }
    }
  }
  
  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  color: PieceColor
): number {
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  if (depth === 0) {
    return evaluateBoard(board, color);
  }
  
  const currentColor = isMaximizing ? color : opponentColor;
  const moves = getAllLegalMoves(board, currentColor);
  
  if (moves.length === 0) {
    if (isCheckmate(board, currentColor)) {
      return isMaximizing ? -100000 : 100000;
    }
    return 0; // Stalemate
  }
  
  // Order moves: captures first for better pruning
  const orderedMoves = [...moves].sort((a, b) => {
    const aCapture = board[a.to.row][a.to.col] !== null;
    const bCapture = board[b.to.row][b.to.col] !== null;
    if (aCapture && !bCapture) return -1;
    if (!aCapture && bCapture) return 1;
    return 0;
  });
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of orderedMoves) {
      const newBoard = applyMove(board, move.from, move.to);
      const score = minimax(newBoard, depth - 1, alpha, beta, false, color);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of orderedMoves) {
      const newBoard = applyMove(board, move.from, move.to);
      const score = minimax(newBoard, depth - 1, alpha, beta, true, color);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minScore;
  }
}

export function getAIMove(
  board: Board,
  difficulty: number,
  aiColor: PieceColor
): { from: Position; to: Position } | null {
  const allMoves = getAllLegalMoves(board, aiColor);
  
  if (allMoves.length === 0) return null;
  
  // Map difficulty (250-2800) to AI behavior
  if (difficulty < 550) {
    // Easy: mostly random with slight preference for captures
    return getBeginnerMove(board, allMoves, aiColor);
  } else if (difficulty < 900) {
    // Medium: basic evaluation with randomness
    return getIntermediateMove(board, allMoves, aiColor);
  } else if (difficulty < 1300) {
    // Hard: depth-2 minimax
    return getHardMove(board, allMoves, aiColor, 2);
  } else if (difficulty < 1700) {
    // Expert: depth-3 minimax
    return getHardMove(board, allMoves, aiColor, 3);
  } else if (difficulty < 2200) {
    // Master: depth-4 minimax
    return getHardMove(board, allMoves, aiColor, 4);
  } else {
    // Rocket: depth-4 minimax with better move ordering (special level - extremely challenging)
    return getHardMove(board, allMoves, aiColor, 4);
  }
}

// Calculate move accuracy by comparing to the best move
export function calculateMoveAccuracy(
  board: Board,
  move: { from: Position; to: Position },
  playerColor: PieceColor
): { accuracy: number; accuracyClass: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' } {
  const allMoves = getAllLegalMoves(board, playerColor);
  
  if (allMoves.length === 0) {
    return { accuracy: 100, accuracyClass: 'excellent' };
  }
  
  // Evaluate the played move
  const playedBoard = applyMove(board, move.from, move.to);
  const playedScore = evaluateBoard(playedBoard, playerColor);
  
  // Find the best move
  let bestScore = -Infinity;
  for (const possibleMove of allMoves) {
    const newBoard = applyMove(board, possibleMove.from, possibleMove.to);
    const score = minimax(newBoard, 2, -Infinity, Infinity, false, playerColor);
    bestScore = Math.max(bestScore, score);
  }
  
  // Calculate accuracy based on score difference
  // If the move is as good as the best move, it's 100% accurate
  // As the score difference increases, accuracy decreases
  const scoreDiff = bestScore - playedScore;
  let accuracy: number;
  
  if (scoreDiff <= 0) {
    accuracy = 100; // Best move or equally good
  } else if (scoreDiff <= 50) {
    accuracy = 95; // Excellent
  } else if (scoreDiff <= 100) {
    accuracy = 85; // Good
  } else if (scoreDiff <= 200) {
    accuracy = 70; // Inaccuracy
  } else if (scoreDiff <= 400) {
    accuracy = 50; // Mistake
  } else {
    accuracy = 25; // Blunder
  }
  
  // Determine accuracy class
  let accuracyClass: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  if (accuracy >= 95) {
    accuracyClass = 'excellent';
  } else if (accuracy >= 80) {
    accuracyClass = 'good';
  } else if (accuracy >= 60) {
    accuracyClass = 'inaccuracy';
  } else if (accuracy >= 40) {
    accuracyClass = 'mistake';
  } else {
    accuracyClass = 'blunder';
  }
  
  return { accuracy, accuracyClass };
}

// Export evaluateBoard for use in accuracy calculations
export { evaluateBoard };

function getRandomMove(moves: Array<{ from: Position; to: Position }>): { from: Position; to: Position } {
  return moves[Math.floor(Math.random() * moves.length)];
}

function getBeginnerMove(
  board: Board,
  moves: Array<{ from: Position; to: Position }>,
  _aiColor: PieceColor
): { from: Position; to: Position } {
  // Prefer captures but mostly random
  const captureMoves = moves.filter(move => board[move.to.row][move.to.col] !== null);
  
  if (captureMoves.length > 0 && Math.random() > 0.5) {
    return captureMoves[Math.floor(Math.random() * captureMoves.length)];
  }
  
  return getRandomMove(moves);
}

function getIntermediateMove(
  board: Board,
  moves: Array<{ from: Position; to: Position }>,
  aiColor: PieceColor
): { from: Position; to: Position } {
  // Evaluate each move and add some randomness
  const evaluatedMoves = moves.map(move => {
    const newBoard = applyMove(board, move.from, move.to);
    const score = evaluateBoard(newBoard, aiColor);
    const randomFactor = Math.random() * 150 - 75; // Add ±75 random value
    return { move, score: score + randomFactor };
  });
  
  evaluatedMoves.sort((a, b) => b.score - a.score);
  
  // Pick from top 5 moves randomly
  const topMoves = evaluatedMoves.slice(0, Math.min(5, evaluatedMoves.length));
  const selected = topMoves[Math.floor(Math.random() * topMoves.length)];
  return selected.move;
}

function getHardMove(
  board: Board,
  moves: Array<{ from: Position; to: Position }>,
  aiColor: PieceColor,
  depth: number
): { from: Position; to: Position } {
  // Optimize move ordering for better alpha-beta pruning
  // Prioritize: 1) Captures, 2) Center control, 3) Other moves
  const orderedMoves = [...moves].sort((a, b) => {
    const aCapture = board[a.to.row][a.to.col] !== null;
    const bCapture = board[b.to.row][b.to.col] !== null;
    
    if (aCapture && !bCapture) return -1;
    if (!aCapture && bCapture) return 1;
    
    // Prioritize center squares (3,3), (3,4), (4,3), (4,4)
    const aCenterDist = Math.abs(a.to.row - 3.5) + Math.abs(a.to.col - 3.5);
    const bCenterDist = Math.abs(b.to.row - 3.5) + Math.abs(b.to.col - 3.5);
    
    return aCenterDist - bCenterDist;
  });
  
  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;
  
  for (const move of orderedMoves) {
    const newBoard = applyMove(board, move.from, move.to);
    const score = minimax(newBoard, depth, -Infinity, Infinity, false, aiColor);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}