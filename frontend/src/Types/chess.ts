export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  notation: string;
  isEnPassant?: boolean;
  isCastling?: boolean;
  promotionTo?: PieceType;
  accuracy?: number; // Accuracy score from 0-100
  accuracyClass?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export type Board = (Piece | null)[][];

export type GameMode = 'pvp' | 'ai';

export interface TimerState {
  white: number; // seconds remaining
  black: number; // seconds remaining
  isActive: boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  selectedPosition: Position | null;
  legalMoves: Position[];
  moveHistory: Move[];
  capturedPieces: { white: Piece[]; black: Piece[] };
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner: PieceColor | null;
}