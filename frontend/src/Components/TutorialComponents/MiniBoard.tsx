// MiniBoard.tsx

import { Box } from '@mui/material';
import ChessPiece from './ChessPiece';

interface MiniBoardProps {
  highlights?: string[];
  pieces?: { position: string; piece: string }[];
}

const MiniBoard: React.FC<MiniBoardProps> = ({ highlights = [], pieces = [] }) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  const isHighlighted = (file: string, rank: number) => {
    return highlights.includes(`${file}${rank}`);
  };

  const getPieceAt = (file: string, rank: number) => {
    const pos = `${file}${rank}`;
    const piece = pieces.find(p => p.position === pos);
    return piece?.piece;
  };

  const isLightSquare = (fileIndex: number, rankIndex: number) => {
    return (fileIndex + rankIndex) % 2 === 0;
  };

  return (
    <Box sx={{ display: 'inline-block', border: '2px solid #1f2937' }}>
      {ranks.map((rank, rankIndex) => (
        <Box key={rank} sx={{ display: 'flex' }}>
          {files.map((file, fileIndex) => {
            const piece = getPieceAt(file, rank);
            const highlighted = isHighlighted(file, rank);
            const light = isLightSquare(fileIndex, rankIndex);
            
            return (
              <Box
                key={`${file}${rank}`}
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  bgcolor: light ? '#fcd34d' : '#b45309',
                  ...(highlighted && {
                    boxShadow: 'inset 0 0 0 2px #3b82f6',
                  }),
                }}
              >
                {piece && <ChessPiece piece={piece} size="sm" />}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

export default MiniBoard;
