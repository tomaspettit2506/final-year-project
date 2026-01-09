import type { Board, PieceColor, Position} from '../Types/chess';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Black pieces
  board[0][0] = { type: 'rook', color: 'black' };
  board[0][1] = { type: 'knight', color: 'black' };
  board[0][2] = { type: 'bishop', color: 'black' };
  board[0][3] = { type: 'queen', color: 'black' };
  board[0][4] = { type: 'king', color: 'black' };
  board[0][5] = { type: 'bishop', color: 'black' };
  board[0][6] = { type: 'knight', color: 'black' };
  board[0][7] = { type: 'rook', color: 'black' };
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  // White pieces
  board[7][0] = { type: 'rook', color: 'white' };
  board[7][1] = { type: 'knight', color: 'white' };
  board[7][2] = { type: 'bishop', color: 'white' };
  board[7][3] = { type: 'queen', color: 'white' };
  board[7][4] = { type: 'king', color: 'white' };
  board[7][5] = { type: 'bishop', color: 'white' };
  board[7][6] = { type: 'knight', color: 'white' };
  board[7][7] = { type: 'rook', color: 'white' };
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  return board;
}

export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

export function getLegalMoves(
  board: Board,
  position: Position,
  checkForCheck: boolean = true
): Position[] {
  const piece = board[position.row][position.col];
  if (!piece) return [];
  
  let moves: Position[] = [];
  
  switch (piece.type) {
    case 'pawn':
      moves = getPawnMoves(board, position, piece.color);
      break;
    case 'rook':
      moves = getRookMoves(board, position, piece.color);
      break;
    case 'knight':
      moves = getKnightMoves(board, position, piece.color);
      break;
    case 'bishop':
      moves = getBishopMoves(board, position, piece.color);
      break;
    case 'queen':
      moves = getQueenMoves(board, position, piece.color);
      break;
    case 'king':
      moves = getKingMoves(board, position, piece.color);
      break;
  }
  
  // Filter out moves that would put own king in check
  if (checkForCheck) {
    moves = moves.filter(move => {
      const newBoard = simulateMove(board, position, move);
      return !isKingInCheck(newBoard, piece.color);
    });
  }
  
  return moves;
}

function getPawnMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  
  // Move forward one square
  const forward = { row: pos.row + direction, col: pos.col };
  if (isValidPosition(forward) && !board[forward.row][forward.col]) {
    moves.push(forward);
    
    // Move forward two squares from starting position
    if (pos.row === startRow) {
      const doubleForward = { row: pos.row + direction * 2, col: pos.col };
      if (!board[doubleForward.row][doubleForward.col]) {
        moves.push(doubleForward);
      }
    }
  }
  
  // Captures
  for (const colOffset of [-1, 1]) {
    const capture = { row: pos.row + direction, col: pos.col + colOffset };
    if (isValidPosition(capture)) {
      const targetPiece = board[capture.row][capture.col];
      if (targetPiece && targetPiece.color !== color) {
        moves.push(capture);
      }
    }
  }
  
  return moves;
}

function getRookMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dRow, dCol] of directions) {
    let row = pos.row + dRow;
    let col = pos.col + dCol;
    
    while (isValidPosition({ row, col })) {
      const targetPiece = board[row][col];
      if (!targetPiece) {
        moves.push({ row, col });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row, col });
        }
        break;
      }
      row += dRow;
      col += dCol;
    }
  }
  
  return moves;
}

function getKnightMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dRow, dCol] of offsets) {
    const newPos = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(newPos)) {
      const targetPiece = board[newPos.row][newPos.col];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push(newPos);
      }
    }
  }
  
  return moves;
}

function getBishopMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  for (const [dRow, dCol] of directions) {
    let row = pos.row + dRow;
    let col = pos.col + dCol;
    
    while (isValidPosition({ row, col })) {
      const targetPiece = board[row][col];
      if (!targetPiece) {
        moves.push({ row, col });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row, col });
        }
        break;
      }
      row += dRow;
      col += dCol;
    }
  }
  
  return moves;
}

function getQueenMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  return [...getRookMoves(board, pos, color), ...getBishopMoves(board, pos, color)];
}

function getKingMoves(board: Board, pos: Position, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  
  for (const [dRow, dCol] of offsets) {
    const newPos = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(newPos)) {
      const targetPiece = board[newPos.row][newPos.col];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push(newPos);
      }
    }
  }
  
  return moves;
}

export function simulateMove(board: Board, from: Position, to: Position): Board {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = piece ? { ...piece, hasMoved: true } : null;
  newBoard[from.row][from.col] = null;
  return newBoard;
}

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isKingInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // Check if any opponent piece can attack the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        const moves = getLegalMoves(board, { row, col }, false);
        if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

export function hasLegalMoves(board: Board, color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row, col });
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

export function isCheckmate(board: Board, color: PieceColor): boolean {
  return isKingInCheck(board, color) && !hasLegalMoves(board, color);
}

export function isStalemate(board: Board, color: PieceColor): boolean {
  return !isKingInCheck(board, color) && !hasLegalMoves(board, color);
}

export function getPositionNotation(pos: Position): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[pos.col]}${8 - pos.row}`;
}

export function getMoveNotation(board: Board, from: Position, to: Position): string {
  const piece = board[from.row][from.col];
  if (!piece) return '';
  
  const capturedPiece = board[to.row][to.col];
  const pieceSymbol = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
  const capture = capturedPiece ? 'x' : '';
  const destination = getPositionNotation(to);
  
  if (piece.type === 'pawn' && capturedPiece) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return `${files[from.col]}x${destination}`;
  }
  
  return `${pieceSymbol}${capture}${destination}`;
}

export function getAllLegalMoves(board: Board, color: PieceColor): Array<{ from: Position; to: Position }> {
  const allMoves: Array<{ from: Position; to: Position }> = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const from = { row, col };
        const legalMoves = getLegalMoves(board, from);
        for (const to of legalMoves) {
          allMoves.push({ from, to });
        }
      }
    }
  }
  
  return allMoves;
}
