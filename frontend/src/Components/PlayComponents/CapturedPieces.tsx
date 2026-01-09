import React from 'react';
import type { Piece } from '../../Types/chess';
import { Box, Typography } from '@mui/material';

interface CapturedPiecesProps {
  whiteCaptured: Piece[];
  blackCaptured: Piece[];
}

const PIECE_SYMBOLS: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ whiteCaptured, blackCaptured }) => {
  const calculateAdvantage = () => {
    const whiteValue = whiteCaptured.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
    const blackValue = blackCaptured.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
    return blackValue - whiteValue;
  };
  
  const advantage = calculateAdvantage();
  
  return (
    <Box sx={{ spaceY: 4 }}>
      <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: 4, spaceY: 3 }}>
        <Box sx={{ spaceY: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{color: "text.secondary"}}>Captured by White:</Typography>
            {advantage > 0 && (
              <Typography variant="body2" color="success.main">+{advantage}</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: "32px" }}>
            {blackCaptured.map((piece, index) => (
              <Typography 
                key={index} 
                sx={{ color: "text.black", filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.3))", fontSize: '24px', lineHeight: 1 }}
              >
                {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
              </Typography>
            ))}
          </Box>
        </Box>
        
        <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
        
        <Box sx={{ spaceY: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{color: "text.secondary"}}>Captured by Black:</Typography>
            {advantage < 0 && (
              <Typography variant="body2" color="success.main">+{Math.abs(advantage)}</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: "32px" }}>
            {whiteCaptured.map((piece, index) => (
              <Typography 
                key={index} 
                sx={{ color: "text.white", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.8))", fontSize: '24px', lineHeight: 1 }}
              >
                {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CapturedPieces;
