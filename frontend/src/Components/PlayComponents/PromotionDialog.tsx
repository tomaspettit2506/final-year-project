import React from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, Button } from '@mui/material';
import type { PieceColor } from '../../Types/chess';

type PromotionChoice = 'queen' | 'rook' | 'bishop' | 'knight';

interface PromotionDialogProps {
  open: boolean;
  color: PieceColor;
  onSelect: (piece: PromotionChoice) => void;
  onClose: () => void;
}

const PromotionDialog: React.FC<PromotionDialogProps> = ({ open, color, onSelect, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Promote {color} pawn</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          {/* Different buttons for each promotion (black or white) choice */}
          <Button variant="contained" onClick={() => onSelect('queen')}>
            {color === 'white' ? '♕' : '♛'} Queen
          </Button>
          <Button variant="contained" onClick={() => onSelect('rook')}>
            {color === 'white' ? '♖' : '♜'} Rook
          </Button>
          <Button variant="contained" onClick={() => onSelect('bishop')}>
            {color === 'white' ? '♗' : '♝'} Bishop
          </Button>
          <Button variant="contained" onClick={() => onSelect('knight')}>
            {color === 'white' ? '♘' : '♞'} Knight
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;