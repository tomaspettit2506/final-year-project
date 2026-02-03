import { Paper, Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import PieceGuide from "./PieceGuide";

const PiecesComponent = () => {
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
        piece="white-king"
        name="King"
        description="The most important piece in chess. If your king is checkmated, you lose the game."
        movement="Moves one square in any direction: horizontally, vertically, or diagonally."
        highlights={['c5', 'c6', 'c7', 'd5', 'e5', 'e6', 'd6', 'd7', 'e7']}
        boardPieces={[{ position: 'd6', piece: 'white-king' }]}
      />

      <PieceGuide
        piece="white-queen"
        name="Queen"
        description="The most powerful piece on the board, combining the power of the rook and bishop."
        movement="Moves any number of squares horizontally, vertically, or diagonally."
        value={9}
        highlights={['e1', 'e2', 'e3', 'e5', 'e6', 'e7', 'e8', 'a4', 'b4', 'c4', 'd4', 'f4', 'g4', 'h4', 'b1', 'c2', 'd3', 'f5', 'g6', 'h7', 'h1', 'g2', 'f3', 'd5', 'c6', 'b7', 'a8']}
        boardPieces={[{ position: 'e4', piece: 'white-queen' }]}
      />

      <PieceGuide
        piece="white-rook"
        name="Rook"
        description="A powerful piece that controls ranks and files."
        movement="Moves any number of squares horizontally or vertically, but cannot jump over pieces."
        value={5}
        highlights={['d1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4']}
        boardPieces={[{ position: 'd4', piece: 'white-rook' }]}
      />

      <PieceGuide
        piece="white-bishop"
        name="Bishop"
        description="A long-range piece that stays on one color throughout the game."
        movement="Moves any number of squares diagonally. Each bishop stays on either light or dark squares."
        value={3}
        highlights={['a1', 'b2', 'c3', 'e5', 'f6', 'g7', 'h8', 'g1', 'f2', 'e3', 'c5', 'b6', 'a7']}
        boardPieces={[{ position: 'd4', piece: 'white-bishop' }]}
      />

      <PieceGuide
        piece="white-knight"
        name="Knight"
        description="The only piece that can jump over other pieces."
        movement="Moves in an 'L' shape: two squares in one direction and one square perpendicular. Can jump over pieces."
        value={3}
        highlights={['c6', 'e6', 'f5', 'f3', 'e2', 'c2', 'b3', 'b5']}
        boardPieces={[{ position: 'd4', piece: 'white-knight' }]}
      />

      <PieceGuide
        piece="white-pawn"
        name="Pawn"
        description="The basic unit of chess. Though weak individually, pawns form the structure of your position."
        movement="Moves forward one square (or two squares from starting position). Captures diagonally forward. Can promote to any piece (except king) upon reaching the opposite end."
        value={1}
        highlights={['d3', 'd4', 'c3', 'e3']}
        boardPieces={[{ position: 'd2', piece: 'white-pawn' }]}
      />
    </Box>
  )
};

export default PiecesComponent;