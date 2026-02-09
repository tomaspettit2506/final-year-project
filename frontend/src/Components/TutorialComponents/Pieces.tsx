import { Paper, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import PieceGuide from "./PieceGuide";

const Pieces = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ p: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column', gap: 3, bgcolor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)' }}>
      <Paper sx={{ p: isMobile ? 2 : 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}> ♟️ How Each Piece Moves</Typography>
        <Typography variant="body1">
          Understanding how each piece moves is fundamental to playing chess. Each piece has unique movement patterns.
        </Typography>
      </Paper>

      <PieceGuide
        piece={isDark ? "white-king" : "black-king"}
        name="King"
        description="The most important piece in chess. If your king is checkmated, you lose the game."
        movement="Moves one square in any direction: horizontally, vertically, or diagonally."
        highlights={['d5', 'e5', 'e6', 'd6', 'd7', 'e7', 'f7', 'f6', 'f5']}
        boardPieces={[{ position: 'e6', piece: isDark ? "white-king" : "black-king" }]}
      />

      <PieceGuide
        piece={isDark ? "white-queen" : "black-queen"}
        name="Queen"
        description="The most powerful piece on the board, combining the power of the rook and bishop."
        movement="Moves any number of squares horizontally, vertically, or diagonally."
        value={9}
        highlights={['e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8', 'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4', 'b1', 'c2', 'd3', 'f5', 'g6', 'h7', 'h1', 'g2', 'f3', 'd5', 'c6', 'b7', 'a8']}
        boardPieces={[{ position: 'e4', piece: isDark ? "white-queen" : "black-queen" }]}
      />

      <PieceGuide
        piece={isDark ? "white-rook" : "black-rook"}
        name="Rook"
        description="A powerful piece that controls ranks and files."
        movement="Moves any number of squares horizontally or vertically, but cannot jump over pieces."
        value={5}
        highlights={['e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8', 'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4']}
        boardPieces={[{ position: 'e4', piece: isDark ? "white-rook" : "black-rook" }]}
      />

      <PieceGuide
        piece={isDark ? "white-bishop" : "black-bishop"}
        name="Bishop"
        description="A long-range piece that stays on one color throughout the game."
        movement="Moves any number of squares diagonally. Each bishop stays on either light or dark squares."
        value={3}
        highlights={['f3', 'g2', 'h1', 'd3', 'c2', 'b1', 'd5', 'f5', 'g6', 'h7', 'c6', 'b7', 'a8']}
        boardPieces={[{ position: 'e4', piece: isDark ? "white-bishop" : "black-bishop" }]}
      />

      <PieceGuide
        piece={isDark ? "white-knight" : "black-knight"}
        name="Knight"
        description="The only piece that can jump over other pieces."
        movement="Moves in an 'L' shape: two squares in one direction and one square perpendicular. Can jump over pieces."
        value={3}
        highlights={['d6', 'f6', 'g5', 'g3', 'f2', 'd2', 'c3', 'c5']}
        boardPieces={[{ position: 'e4', piece: isDark ? "white-knight" : "black-knight" }]}
      />

      <PieceGuide
        piece={isDark ? "white-pawn" : "black-pawn"}
        name="Pawn"
        description="The basic unit of chess. Though weak individually, pawns form the structure of your position."
        movement="Moves forward one square (or two squares from starting position). Captures diagonally forward. Can promote to any piece (except king) upon reaching the opposite end."
        value={1}
        highlights={['e3', 'e4', 'd3', 'f3']}
        boardPieces={[{ position: 'e2', piece: isDark ? "white-pawn" : "black-pawn" }]}
      />
    </Box>
  )
};

export default Pieces;