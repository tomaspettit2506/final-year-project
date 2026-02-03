import { Paper, Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import ChessPiece from './ChessPiece';
import MiniBoard from './MiniBoard';

interface PieceGuideProps {
  piece: string;
  name: string;
  description: string;
  movement: string;
  value?: number;
  highlights: string[];
  boardPieces: { position: string; piece: string }[];
}

const PieceGuide: React.FC<PieceGuideProps> = ({
  piece,
  name,
  description,
  movement,
  value,
  highlights,
  boardPieces,
}: PieceGuideProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper sx={{ p: isMobile ? 2 : 3, bgcolor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)' }}>
      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 6}}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ChessPiece piece={piece} size="lg" />
            <Box>
              <Typography variant="h6">{name}</Typography>
              {value && (
                <Typography variant="caption" color="textSecondary">
                  Value: {value} points
                </Typography>
              )}
            </Box>
          </Box>
          <Typography sx={{ mb: 2 }}>{description}</Typography>
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant="body2">{movement}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, md: 6}} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MiniBoard highlights={highlights} pieces={boardPieces} />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default PieceGuide;