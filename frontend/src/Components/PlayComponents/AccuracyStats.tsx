import type { Move } from '../../Types/chess';
import { Box, Card, Chip, LinearProgress, Typography } from '@mui/material';
import { useTheme as useAppTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { getAccuracyColor, getAccuracyLabel } from '../../Utils/accuracyColors';

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

          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 1, mb: 2, px: 0, py: 0 }}>
            <Typography sx={{ fontSize: '0.875rem' }}>Move Quality</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.75rem', width: 'auto' }}>
              {excellentMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={getAccuracyLabel('excellent')} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('excellent') }} />
                  <Chip label={excellentMoves} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('excellent') }} />
                </Box>
              )}
              {goodMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={getAccuracyLabel('good')} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('good') }} />
                  <Chip label={goodMoves} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('good') }} />
                </Box>
              )}
              {inaccuracies > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={getAccuracyLabel('inaccuracy')} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('inaccuracy') }} />
                  <Chip label={inaccuracies} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('inaccuracy') }} />
                </Box>
              )}
              {mistakes > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={getAccuracyLabel('mistake')} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('mistake') }} />
                  <Chip label={mistakes} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('mistake') }} />
                </Box>
              )}
              {blunders > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={getAccuracyLabel('blunder')} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('blunder') }} />
                  <Chip label={blunders} size="small" sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor('blunder') }} />
                </Box>
              )}
            </Box>
          </Box>

          {bestMove && (
            <Box sx={{ pt: 1.5, p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem', mb: 0.5 }}>
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
