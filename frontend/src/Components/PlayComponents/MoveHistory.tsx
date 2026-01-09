import type { Move } from '../../Types/chess';
import { Badge, Box, Typography } from '@mui/material';

interface MoveHistoryProps {
  moves: Move[];
}

const getAccuracyColor = (accuracyClass?: string) => {
  switch (accuracyClass) {
    case 'excellent':
      return { backgroundColor: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' };
    case 'good':
      return { backgroundColor: 'rgba(59,130,246,0.1)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' };
    case 'inaccuracy':
      return { backgroundColor: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)' };
    case 'mistake':
      return { backgroundColor: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.2)' };
    case 'blunder':
      return { backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' };
    default:
      return {};
  }
};

const getAccuracyLabel = (accuracyClass?: string) => {
  switch (accuracyClass) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'inaccuracy':
      return 'Inaccuracy';
    case 'mistake':
      return 'Mistake';
    case 'blunder':
      return 'Blunder';
    default:
      return '';
  }
};

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const movePairs: Array<{ white: Move; black?: Move }> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1]
    });
  }
  
  // Calculate average accuracy
  const movesWithAccuracy = moves.filter(m => m.accuracy !== undefined);
  const avgAccuracy = movesWithAccuracy.length > 0
    ? Math.round(movesWithAccuracy.reduce((sum, m) => sum + (m.accuracy || 0), 0) / movesWithAccuracy.length)
    : null;
  
  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Move History</Typography>
        {avgAccuracy !== null && (
          <Box sx={{ fontSize: 'sm', color: 'text.secondary' }}>
            Avg: {avgAccuracy}%
          </Box>
        )}
      </Box>
        {movePairs.length === 0 ? (
          <Typography sx={{ fontSize: 'sm'}}>No moves yet</Typography>
        ) : (
          <Box sx={{ spaceY: 1 }}>
            {movePairs.map((pair, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, fontSize: 'sm', alignItems: 'center' }}>
                <Typography sx={{ width: 8 }}>{index + 1}.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {/* White Move */}
                  <Typography sx={{display: 'flex'}}>{pair.white.notation}</Typography>
                  {pair.white.accuracyClass && (
                    <Badge 
                      sx={{ alignItems: 'center', fontSize: 'large', px: 1, py: 0, height: 10, ...getAccuracyColor(pair.white.accuracyClass) }}
                    >
                      {getAccuracyLabel(pair.white.accuracyClass)}
                    </Badge>
                  )}
                </Box>
                {pair.black && (
                  <Box sx={{ alignItems: 'end', gap: 5 }}>
                    {/* Black Move */}
                    <Typography sx={{display: 'flex'}}>{pair.black.notation}</Typography>
                    {pair.black.accuracyClass && (
                      <Badge 
                        sx={{ alignItems: 'center', fontSize: 'large', px: 1, py: 0, height: 10, ...getAccuracyColor(pair.black.accuracyClass) }}
                      >
                        {getAccuracyLabel(pair.black.accuracyClass)}
                      </Badge>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
    </Box>
  );
};

export default MoveHistory;