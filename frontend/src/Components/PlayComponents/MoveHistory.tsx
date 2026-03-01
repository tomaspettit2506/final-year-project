import type { Move } from '../../Types/chess';
import { Box, Chip, Typography } from '@mui/material';
import { useTheme as useAppTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

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
  const theme = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            Avg: {avgAccuracy}%
          </Box>
        )}
      </Box>
        {movePairs.length === 0 ? (
          <Typography sx={{ fontSize: '0.875rem' }}>No moves yet</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {movePairs.map((pair, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: isMobile ? '50px 1fr 1fr' : '40px 1fr 1fr', gap: 2, fontSize: '0.875rem', alignItems: 'center', py: 0.5 }}>
                {/* Move Number */}
                <Typography sx={{ fontWeight: 'bold' }}>{index + 1}.</Typography>
                
                {/* White Move */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{pair.white.notation}</Typography>
                  {pair.white.accuracyClass && (
                    <Chip
                      size="small"
                      label={getAccuracyLabel(pair.white.accuracyClass)}
                      sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor(pair.white.accuracyClass) }}
                    />
                  )}
                </Box>
                
                {/* Black Move */}
                {pair.black ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{pair.black.notation}</Typography>
                    {pair.black.accuracyClass && (
                      <Chip
                        size="small"
                        label={getAccuracyLabel(pair.black.accuracyClass)}
                        sx={{ fontSize: '0.75rem', px: 0.5, ...getAccuracyColor(pair.black.accuracyClass) }}
                      />
                    )}
                  </Box>
                ) : (
                  <Box />
                )}
              </Box>
            ))}
          </Box>
        )}
    </Box>
  );
};

export default MoveHistory;