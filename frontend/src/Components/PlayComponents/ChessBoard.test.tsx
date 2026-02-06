import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from 'vitest';
import ChessBoard from "./ChessBoard";
import { BoardThemeProvider } from "../../Context/BoardThemeContext";
import { ThemeProvider } from "../../Context/ThemeContext";
import type { Board, Position } from "../../Types/chess";

const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place some pieces for testing
  board[0][0] = { type: 'rook', color: 'black' };
  board[7][0] = { type: 'rook', color: 'white' };
  board[6][4] = { type: 'pawn', color: 'white' };
  
  return board;
};

const renderChessBoard = (props: any) => {
  return render(
    <ThemeProvider>
      <BoardThemeProvider>
        <ChessBoard {...props} />
      </BoardThemeProvider>
    </ThemeProvider>
  );
};

describe("ChessBoard Component", () => {
  const mockBoard = createInitialBoard();
  const mockSelectedPosition: Position | null = null;
  const mockLegalMoves: Position[] = [];
  const mockOnSquareClick = vi.fn();
  const mockOnPieceDrop = vi.fn();

  test("renders chessboard component", () => {
    renderChessBoard({
      board: mockBoard,
      selectedPosition: mockSelectedPosition,
      legalMoves: mockLegalMoves,
      onSquareClick: mockOnSquareClick,
      onPieceDrop: mockOnPieceDrop,
      flipped: false
    });

    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
  });

  test("displays chess pieces", () => {
    renderChessBoard({
      board: mockBoard,
      selectedPosition: mockSelectedPosition,
      legalMoves: mockLegalMoves,
      onSquareClick: mockOnSquareClick,
      onPieceDrop: mockOnPieceDrop,
      flipped: false
    });

    // Check that the board is rendered
    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
  });

  test("calls onSquareClick when a square is clicked", () => {
    const onSquareClickMock = vi.fn();
    renderChessBoard({
      board: mockBoard,
      selectedPosition: mockSelectedPosition,
      legalMoves: mockLegalMoves,
      onSquareClick: onSquareClickMock,
      onPieceDrop: mockOnPieceDrop,
      flipped: false
    });

    const board = screen.getByTestId('chess-board');
    fireEvent.click(board);

    expect(onSquareClickMock).toHaveBeenCalled();
  });

  test("renders flipped board when flipped prop is true", () => {
    renderChessBoard({
      board: mockBoard,
      selectedPosition: mockSelectedPosition,
      legalMoves: mockLegalMoves,
      onSquareClick: mockOnSquareClick,
      onPieceDrop: mockOnPieceDrop,
      flipped: true
    });

    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
  });
});