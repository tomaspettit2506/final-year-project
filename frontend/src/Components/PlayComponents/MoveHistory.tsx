import type { Move } from '../../Types/chess';
import { Box, Chip, Typography } from '@mui/material';
import { useTheme as useAppTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { getAccuracyColor, getAccuracyLabel } from '../../Utils/accuracyColors';

interface MoveHistoryProps {
  moves: Move[];
}

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 'auto' }}>
            {movePairs.map((pair, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: isMobile ? '50px 1fr 1fr' : '40px 1fr 1fr', gap: isMobile ? 0.5 : 1, fontSize: '0.875rem', alignItems: 'center', py: 0.5 }}>
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