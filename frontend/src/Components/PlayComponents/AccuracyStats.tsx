import type { Move } from '../../Types/chess';
import { Badge, Box, Card, LinearProgress, Typography } from '@mui/material';
import { Target, Zap } from 'lucide-react';

interface AccuracyStatsProps {
  moves: Move[];
}

const AccuracyStats: React.FC<AccuracyStatsProps> = ({ moves }) => {
  const movesWithAccuracy = moves.filter(m => m.accuracy !== undefined);
  
  if (movesWithAccuracy.length === 0) {
    return null;
  }
  
  // Calculate statistics
  const avgAccuracy = Math.round(
    movesWithAccuracy.reduce((sum, m) => sum + (m.accuracy || 0), 0) / movesWithAccuracy.length
  );
  
  // Count move quality categories
  const excellentMoves = movesWithAccuracy.filter(m => m.accuracyClass === 'excellent').length;
  const goodMoves = movesWithAccuracy.filter(m => m.accuracyClass === 'good').length;
  const inaccuracies = movesWithAccuracy.filter(m => m.accuracyClass === 'inaccuracy').length;
  const mistakes = movesWithAccuracy.filter(m => m.accuracyClass === 'mistake').length;
  const blunders = movesWithAccuracy.filter(m => m.accuracyClass === 'blunder').length;
  
  const bestMove = movesWithAccuracy.reduce((best, move) => 
    (move.accuracy || 0) > (best.accuracy || 0) ? move : best
  , movesWithAccuracy[0]);
  
  return (
    <Card sx={{ p: 4, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Target style={{ width: 25, height: 25, color: 'blue' }} />
        <Typography variant="h4" sx={{color: "text.secondary"}}>Accuracy Stats</Typography>
      </Box>
      
      <Box sx={{ spaceY: 4 }}>
        {/* Overall Accuracy */}
        <Box sx={{ spaceY: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: 'sm' }}>Overall Accuracy</Typography>
            <Typography sx={{ fontSize: 'sm' }}>{avgAccuracy}%</Typography>
          </Box>
          <LinearProgress value={avgAccuracy} variant="determinate" sx={{
                            mt: 0.5,
                            height: 8,
                            borderRadius: 2,
                            bgcolor: "#f0e6ff",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "green",
                            },
                          }} />
        </Box>
        
        {/* Move Breakdown */}
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
        
        {/* Best Move */}
        {bestMove && (
          <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 'sm', mb: 1 }}>
              <Zap style={{ width: 25, height: 25, color: 'yellow' }} />
              <Badge>Best Move</Badge>
            </Box>
            <Typography sx={{ fontSize: 'xs', color: 'text.secondary' }}>
              {bestMove.notation} ({bestMove.accuracy}%)
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default AccuracyStats;
