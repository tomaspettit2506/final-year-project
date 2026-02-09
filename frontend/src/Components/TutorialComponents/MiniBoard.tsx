import { Box, useTheme, useMediaQuery } from '@mui/material';
import ChessPiece from './ChessPiece';
import { useBoardTheme } from "../../Context/BoardThemeContext";
import { useTheme as useAppTheme } from "../../Context/ThemeContext";

interface MiniBoardProps {
  highlights?: string[];
  pieces?: { position: string; piece: string }[];
}

const MiniBoard: React.FC<MiniBoardProps> = ({ highlights = [], pieces = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDark } = useAppTheme();

  const { boardTheme } = useBoardTheme();
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
            
            return (
              <Box
                key={`${file}${rank}`}
                sx={{
                  width: isMobile ? 30 : 40,
                  height: isMobile ? 30 : 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  bgcolor: isLightSquare(fileIndex, rankIndex) ? boardTheme === "dark"
                        ? "#4b5563"
                        : boardTheme === "wooden"
                        ? "#b4dc2e"
                        : boardTheme === "modern"
                        ? "#6366f1"
                        : "#f0d9b5"
                      : boardTheme === "dark"
                      ? "#1f2937"
                      : boardTheme === "wooden"
                      ? "#5f5810"
                      : boardTheme === "modern"
                      ? "#e0e7ff"
                      : "#b58863",
                  ...(highlighted && {
                    boxShadow: isDark ? 'inset 0 0 0 4px #0000009a' : 'inset 0 0 0 4px #ffffffc8',
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
