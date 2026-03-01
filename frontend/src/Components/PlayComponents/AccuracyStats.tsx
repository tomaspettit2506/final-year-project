import type { Move } from '../../Types/chess';
import { Box, Card, Chip, LinearProgress, Typography } from '@mui/material';
import { useTheme as useAppTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

interface AccuracyStatsProps {
  moves: Move[];
}

const AccuracyStats: React.FC<AccuracyStatsProps> = ({ moves }) => {
  const theme = useAppTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const movesWithAccuracy = moves
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.accuracy !== undefined);

  if (movesWithAccuracy.length === 0) {
    return null;
  }

  const whiteMoves = movesWithAccuracy.filter(({ idx }) => idx % 2 === 0).map(({ m }) => m);
  const blackMoves = movesWithAccuracy.filter(({ idx }) => idx % 2 === 1).map(({ m }) => m);

  const renderStats = (label: string, playerMoves: Move[]) => {
    if (playerMoves.length === 0) {
      return null;
    }

    const avgAccuracy = Math.round(
      playerMoves.reduce((sum, m) => sum + (m.accuracy || 0), 0) / playerMoves.length
    );

    const excellentMoves = playerMoves.filter(m => m.accuracyClass === 'excellent').length;
    const goodMoves = playerMoves.filter(m => m.accuracyClass === 'good').length;
    const inaccuracies = playerMoves.filter(m => m.accuracyClass === 'inaccuracy').length;
    const mistakes = playerMoves.filter(m => m.accuracyClass === 'mistake').length;
    const blunders = playerMoves.filter(m => m.accuracyClass === 'blunder').length;

    const bestMove = playerMoves.reduce((best, move) =>
      (move.accuracy || 0) > (best.accuracy || 0) ? move : best
    , playerMoves[0]);

    return (
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
        <Typography variant="h5" sx={{ color: "text.primary", mb: 2 }}>
          {label}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '0.875rem' }}>Overall Accuracy</Typography>
              <Typography sx={{ fontSize: '0.875rem' }}>{avgAccuracy}%</Typography>
            </Box>
            <LinearProgress
              value={avgAccuracy}
              variant="determinate"
              sx={{
                mt: 0.5,
                height: 8,
                borderRadius: 2,
                bgcolor: isDark ? "#2c2c2c" : "#f0e6ff",
                "& .MuiLinearProgress-bar": { bgcolor: "green" },
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, mb: 3, px: 2, py: 3 }}>
            <Typography sx={{ fontSize: '0.875rem' }}>Move Quality</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '0.75rem' }}>
              {excellentMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="span" sx={{ color: 'green', pr: 2, fontSize: '0.75rem' }}>Excellent</Typography>
                  <Chip label={excellentMoves} size="small" sx={{ backgroundColor: '#e8f5e9', color: 'green', fontWeight: 'bold' }} />
                </Box>
              )}
              {goodMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="span" sx={{ color: 'blue', pr: 2, fontSize: '0.75rem' }}>Good</Typography>
                  <Chip label={goodMoves} size="small" sx={{ backgroundColor: '#e3f2fd', color: 'blue', fontWeight: 'bold' }} />
                </Box>
              )}
              {inaccuracies > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="span" sx={{ color: '#ca8a04', pr: 2, fontSize: '0.75rem' }}>Inaccuracies</Typography>
                  <Chip label={inaccuracies} size="small" sx={{ backgroundColor: '#f4e0bf', color: 'yellow', fontWeight: 'bold' }} />
                </Box>
              )}
              {mistakes > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="span" sx={{ color: 'orange', pr: 2, fontSize: '0.75rem' }}>Mistakes</Typography>
                  <Chip label={mistakes} size="small" sx={{ backgroundColor: '#ffebee', color: 'orange', fontWeight: 'bold' }} />
                </Box>
              )}
              {blunders > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="span" sx={{ color: 'red', pr: 2, fontSize: '0.75rem' }}>Blunders</Typography>
                  <Chip label={blunders} size="small" sx={{ backgroundColor: '#ffebee', color: 'red', fontWeight: 'bold' }} />
                </Box>
              )}
            </Box>
          </Box>

          {bestMove && (
            <Box sx={{ pt: 2, p: 3, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.875rem', mb: 1 }}>
                <Typography component="span" sx={{ fontSize: '0.875rem' }}>⚡Best Move</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: "text.primary" }}>
                {bestMove.notation} ({bestMove.accuracy}%)
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ p: 4, border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ color: "text.primary" }}>🎯 Accuracy Stats</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {renderStats('White', whiteMoves)}
        {renderStats('Black', blackMoves)}
      </Box>
    </Card>
  );
};

export default AccuracyStats;
