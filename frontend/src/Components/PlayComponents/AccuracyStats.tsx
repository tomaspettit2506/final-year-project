import type { Move } from '../../Types/chess';
import { Badge, Box, Card, LinearProgress, Typography } from '@mui/material';

interface AccuracyStatsProps {
  moves: Move[];
}

const AccuracyStats: React.FC<AccuracyStatsProps> = ({ moves }) => {
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
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>
          {label}
        </Typography>

        <Box sx={{ spaceY: 4 }}>
          <Box sx={{ spaceY: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: 'sm' }}>Overall Accuracy</Typography>
              <Typography sx={{ fontSize: 'sm' }}>{avgAccuracy}%</Typography>
            </Box>
            <LinearProgress
              value={avgAccuracy}
              variant="determinate"
              sx={{
                mt: 0.5,
                height: 8,
                borderRadius: 2,
                bgcolor: "#f0e6ff",
                "& .MuiLinearProgress-bar": { bgcolor: "green" },
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Typography sx={{ fontSize: 'text.sm' }}>Move Quality</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 'xs' }}>
              {excellentMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge sx={{ color: 'green' }}>Excellent</Badge>
                  <Typography>{excellentMoves}</Typography>
                </Box>
              )}
              {goodMoves > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge sx={{ color: 'blue' }}>Good</Badge>
                  <Typography>{goodMoves}</Typography>
                </Box>
              )}
              {inaccuracies > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge sx={{ color: 'yellow' }}>Inaccuracies</Badge>
                  <Typography>{inaccuracies}</Typography>
                </Box>
              )}
              {mistakes > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge sx={{ color: 'orange' }}>Mistakes</Badge>
                  <Typography>{mistakes}</Typography>
                </Box>
              )}
              {blunders > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Badge sx={{ color: 'red' }}>Blunders</Badge>
                  <Typography>{blunders}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {bestMove && (
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 'sm', mb: 1 }}>
                <Badge>⚡Best Move</Badge>
              </Box>
              <Typography sx={{ fontSize: 'xs', color: 'text.secondary' }}>
                {bestMove.notation} ({bestMove.accuracy}%)
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ p: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ color: "text.secondary" }}> 🎯 Accuracy Stats</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {renderStats('White', whiteMoves)}
        {renderStats('Black', blackMoves)}
      </Box>
    </Card>
  );
};

export default AccuracyStats;
