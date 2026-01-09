import type { Position, Piece } from "../../Types/chess";
import { useState } from "react";
import { Box, Grid, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useBoardTheme } from "../../Context/BoardThemeContext";

interface ChessBoardProps {
  board: (Piece | null)[][];
  selectedPosition: Position | null;
  legalMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
  onPieceDrop?: (from: Position, to: Position) => void;
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
}) => {
  const { boardTheme, pieceSet } = useBoardTheme();
  const [draggedFrom, setDraggedFrom] = useState<Position | null>(null);
  const [dragOverSquare, setDragOverSquare] = useState<Position | null>(null);
  const theme = useTheme();
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

    if (isLegal && onPieceDrop) {
      onPieceDrop(draggedFrom, { row, col });
    } else {
      onSquareClick(row, col);
    }

    setDraggedFrom(null);
  };

  return (
    <Box
      sx={{
        display: "inline-block",
        backgroundColor: "#27272a",
        p: 3,
        borderRadius: 2,
        boxShadow: 5,
      }}
    >
      {/* Chess Grid */}
      <Grid
        container
        columns={8}
        sx={{
          width: isMobile ? "350px" : "512px",
          height: isMobile ? "350px" : "512px",
          border: "3px solid #3f3f46",
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
              <Grid size={{xs:1}} key={`${r}-${c}`}>
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
                    bgcolor: isLightSquare(r, c) ? boardTheme == "classic" ? "#f0d9b5" : boardTheme == "modern" ? "#e1e1e1" : "#deb887" : boardTheme == "classic" ? "#b58863" : boardTheme == "modern" ? "#757575" : "#8b4513",
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
                        fontFamily: pieceSet === "standard" ? "Arial" : pieceSet === "fancy" ? "Times New Roman" : "Courier New",
                        opacity: dragging ? 0.5 : 1,
                        cursor: "grab",
                        userSelect: "none",
                        color: piece.color === "white" ? "white" : "black",
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
                          width: piece ? "56px" : "12px",
                          height: piece ? "56px" : "12px",
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

      {/* Coordinates */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          mt: 2,
          width: isMobile ? "350px" : "512px",
        }}
      >
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((f) => (
          <Typography
            key={f}
            sx={{ width: "64px", textAlign: "center", color: "#e7e5e4" }}
          >
            {f}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default ChessBoard;