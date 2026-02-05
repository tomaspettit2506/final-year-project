import type { Position, Piece } from "../../Types/chess";
import { useState, useRef } from "react";
import { Box, Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useBoardTheme } from "../../Context/BoardThemeContext";
import { useTheme as useAppTheme } from "../../Context/ThemeContext";

interface ChessBoardProps {
  board: (Piece | null)[][];
  selectedPosition: Position | null;
  legalMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
  onPieceDrop?: (from: Position, to: Position) => void;
  flipped?: boolean;
}

const PIECE_SYMBOLS: Record<string, string> = {
  "white-king": "♔",
  "white-queen": "♕",
  "white-rook": "♖",
  "white-bishop": "♗",
  "white-knight": "♘",
  "white-pawn": "♙",
  "black-king": "♚",
  "black-queen": "♛",
  "black-rook": "♜",
  "black-bishop": "♝",
  "black-knight": "♞",
  "black-pawn": "♟",
};

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedPosition,
  legalMoves,
  onSquareClick,
  onPieceDrop,
  flipped = false,
}) => {
  const { boardTheme, pieceSet } = useBoardTheme();
  const [draggedFrom, setDraggedFrom] = useState<Position | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Position | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{
    piece: Piece;
    from: Position;
  } | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isSquareSelected = (row: number, col: number) =>
    selectedPosition?.row === row && selectedPosition?.col === col;

  const isLegalMove = (row: number, col: number) =>
    legalMoves.some((m) => m.row === row && m.col === col);

  const isLightSquare = (row: number, col: number) =>
    (row + col) % 2 === 0;

  const handleDragStart = (e: React.DragEvent, row: number, col: number) => {
    const piece = board[row][col];
    if (!piece) return;
    setDraggedFrom({ row, col });

    onSquareClick(row, col);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${row},${col}`);
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setDragOverSquare(null);
    if (!draggedFrom) return;

    const isLegal = isLegalMove(row, col);

    if (isLegal && onPieceDrop) onPieceDrop(draggedFrom, { row, col });
    else onSquareClick(row, col);

    setDraggedFrom(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!boardRef.current) return;

    const touch = e.touches[0];
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;

    const col = Math.floor((touch.clientX - boardRect.left) / squareSize);
    const row = Math.floor((touch.clientY - boardRect.top) / squareSize);

    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

    const piece = board[row][col];
    if (!piece) return;

    // Mirror click behavior so selection and legal moves populate immediately
    onSquareClick(row, col);
    setDraggedPiece({ piece, from: { row, col } });
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedPiece) return;

    // Rely on touch-action: none to prevent scrolling; no preventDefault to avoid passive warnings
    const touch = e.touches[0];
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedPiece || !boardRef.current) {
      setDraggedPiece(null);
      setTouchDragPosition(null);
      return;
    }

    const touch = e.changedTouches[0];
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;

    const col = Math.floor((touch.clientX - boardRect.left) / squareSize);
    const row = Math.floor((touch.clientY - boardRect.top) / squareSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      const isLegal = isLegalMove(row, col);

      if (isLegal && onPieceDrop) onPieceDrop(draggedPiece.from, { row, col });
      else onSquareClick(row, col);
    }
    setDraggedPiece(null);
    setTouchDragPosition(null);
  };

  const boardSize = isMobile ? 350 : 500;
  const boardOffset = boardSize / 2;

  return (
    <Box
      ref={boardRef}
      sx={{
        display: "inline-block",
        backgroundColor: "#27272a",
        p: 3,
        borderRadius: 2,
        boxShadow: 5,
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Chess Grid */}
      <Grid
        container
        columns={8}
        sx={{
          width: isMobile ? "350px" : "512px",
          height: isMobile ? "350px" : "512px",
          border: "3px solid #3f3f46",
          transform: flipped ? "rotate(180deg)" : "none",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {board.map((row, r) =>
          row.map((piece, c) => {
            const selected = isSquareSelected(r, c);
            const legal = isLegalMove(r, c);
            const dragging = draggedFrom?.row === r && draggedFrom?.col === c;
            const dragOver =
              dragOverSquare?.row === r && dragOverSquare?.col === c;

            return (
              <Grid size={{ xs: 1 }} key={`${r}-${c}`}>
                <Box
                  onClick={() => onSquareClick(r, c)}
                  onDrop={(e) => handleDrop(e, r, c)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverSquare({ row: r, col: c });
                  }}
                  onDragLeave={() => setDragOverSquare(null)}
                  sx={{
                    width: isMobile ? "44px" : "64px",
                    height: isMobile ? "44px" : "64px",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "0.15s",
                    cursor: "pointer",
                    bgcolor: isLightSquare(r, c)
                      ? boardTheme === "dark"
                        ? "#4b5563"
                        : boardTheme === "wooden"
                        ? "#f3e8ff"
                        : boardTheme === "modern"
                        ? "#e0e7ff"
                        : "#f0d9b5"
                      : boardTheme === "dark"
                      ? "#1f2937"
                      : boardTheme === "wooden"
                      ? "#a78bfa"
                      : boardTheme === "modern"
                      ? "#6366f1"
                      : "#b58863",
                    "&:hover": !dragOver ? { filter: "brightness(1.1)" } : undefined,
                    outline:
                      selected
                        ? "4px solid #3b82f6"
                        : dragOver && legal
                        ? "4px solid #22c55e"
                        : "",
                    outlineOffset: "-4px",
                  }}
                >
                  {piece && (
                    <Typography
                      draggable
                      onDragStart={(e) => handleDragStart(e, r, c)}
                      onDragEnd={() => setDraggedFrom(null)}
                      sx={{
                        fontSize: "40px",
                        fontFamily:
                          pieceSet === "standard"
                            ? "Arial"
                            : pieceSet === "fancy"
                            ? "Times New Roman"
                            : "Courier New",
                        opacity: draggedPiece?.from.row === r && draggedPiece?.from.col === c ? 0.3 : dragging ? 0.5 : 1,
                        cursor: "grab",
                        userSelect: "none",
                        color: piece.color === "white" ? "white" : "black",
                        transform: flipped ? "rotate(180deg)" : "none",
                        textShadow:
                          piece.color === "white"
                            ? "0 2px 2px rgba(0,0,0,0.8)"
                            : "0 1px 1px rgba(255,255,255,0.3)",
                      }}
                    >
                      {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                    </Typography>
                  )}

                  {/* Legal Move Indicators */}
                  {legal && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: piece ? (isMobile ? "44px" : "64px") : "12px",
                          height: piece ? (isMobile ? "44px" : "64px") : "12px",
                          borderRadius: "50%",
                          border: piece ? "4px solid #22c55e" : "none",
                          bgcolor: piece ? "transparent" : "#22c55e",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Coordinates, Example a1 to h1, vertical and horizontal. Fitted in */}
      <Box
        sx={{
          position: "absolute",
          top: `calc(50% - ${boardOffset}px)`,
          left: `calc(50% - ${boardOffset}px)`,
          width: isMobile ? "350px" : "512px",
          height: isMobile ? "350px" : "512px",
          pointerEvents: "none",
        }}
      >
        {/* Files */}
        {[...Array(8)].map((_, i) => (
          <Typography
            key={i}
            sx={{
              position: "absolute",
              bottom: isMobile ? -5 : 5,
              left: `calc(${(i + 0.5) * (100 / 8)}% - -13px)`,
              fontSize: isMobile ? "10px" : "14px",
              color: isDark ? "#ffffff" : "#000000",
            }}
          >
            {String.fromCharCode(97 + i)}
          </Typography>
        ))}

        {/* Ranks */}
        {[...Array(8)].map((_, i) => (
          <Typography
            key={i}
            sx={{
              position: "absolute",
              top: `calc(${(7 - i + 0.5) * (100 / 8)}% - ${isMobile ? "17px" : "34px"})`,
              left: isMobile ? 5 : 0,
              fontSize: isMobile ? "10px" : "14px",
              color: isDark ? "#ffffff" : "#000000",
            }}
          >
            {i + 1}
          </Typography>
        ))}
      </Box>

      {/* Dragged piece following touch */}
      {draggedPiece && touchDragPosition && (
        <Box
          position="fixed"
          left={touchDragPosition.x}
          top={touchDragPosition.y}
          sx={{
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 1000,
            fontSize: isMobile ? "40px" : "60px",
            fontFamily:
              pieceSet === "standard"
                ? "Arial"
                : pieceSet === "fancy"
                ? "Times New Roman"
                : "Courier New",
            color: draggedPiece.piece.color === "white" ? "white" : "black",
            textShadow:
              draggedPiece.piece.color === "white"
                ? "0 2px 2px rgba(0,0,0,0.8)"
                : "0 1px 1px rgba(255,255,255,0.3)",
          }}
        >
          {PIECE_SYMBOLS[`${draggedPiece.piece.color}-${draggedPiece.piece.type}`]}
        </Box>
      )}
    </Box>
  );
};

export default ChessBoard;