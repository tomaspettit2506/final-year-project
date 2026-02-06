import { Badge, Box, Card, Typography, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { useTheme as useAppTheme } from '../../Context/ThemeContext';

const Draw = () => {
  const { isDark } = useAppTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  return (
    <Box sx={{ mb: 4, p: isMobile ? 2 : 0 }}>
      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? '#0f172ae6' : '#FFFFFFe6', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h2" gutterBottom> ♟️ How a Game Can End in a Draw</Typography>
        <Typography paragraph>
          Not every chess game ends with a winner. There are several ways a game can end in a draw (tie).
        </Typography>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>1. Stalemate</Typography>
        <Box sx={{ p: 4, bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', borderLeft: 4, borderColor: isDark ? '#F59E0B' : '#F59E0B', borderRadius: 1, mb: 4, color: isDark ? '#FDE68A' : 'black' }}>
          <Typography><strong>Most common type of draw</strong></Typography>
        </Box>
        <Typography paragraph>
          Stalemate occurs when a player is NOT in check but has no legal moves available. 
          The game immediately ends in a draw.
        </Typography>
        <Box sx={{ p: 4, bgcolor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'grey.100', borderRadius: 1, color: isDark ? '#E2E8F0' : 'black' }}>
          <Typography variant="body2"><strong>Example:</strong> A lone king with no legal moves, but not in check. Be careful when you have a big advantage - don't accidentally stalemate your opponent!</Typography>
        </Box>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>2. Insufficient Material</Typography>
        <Typography paragraph>
          When neither player has enough pieces to possibly deliver checkmate, the game is automatically drawn.
        </Typography>
        <Box sx={{mb: 2}}>
          <Typography><strong>Automatic draws include:</strong></Typography>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>King vs. King</li>
            <li>King and Bishop vs. King</li>
            <li>King and Knight vs. King</li>
            <li>King and Bishop vs. King and Bishop (same color bishops)</li>
          </ul>
        </Box>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>3. Threefold Repetition</Typography>
        <Typography paragraph>
          If the exact same position occurs three times (with the same player to move), either player can claim a draw.
        </Typography>
        <Box sx={{ p: isMobile ? 2 : 4, bgcolor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'grey.100', borderRadius: 1, color: isDark ? '#E2E8F0' : 'black' }}>
          <Typography variant="body2"><strong>Note:</strong> The positions don't have to occur consecutively. The same position at any point in the game counts toward the three repetitions.</Typography>
        </Box>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>4. Fifty-Move Rule</Typography>
        <Typography paragraph>
          If 50 moves occur (by both players) without any pawn moves or captures, either player can claim a draw.
        </Typography>
        <Box sx={{ p: isMobile ? 2 : 4, bgcolor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'grey.100', borderRadius: 1, color: isDark ? '#E2E8F0' : 'black' }}>
          <Typography variant="body2">This rule prevents games from continuing indefinitely when neither player is making progress.</Typography>
        </Box>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>5. Mutual Agreement</Typography>
        <Typography paragraph>
          At any point during the game, both players can agree to a draw. This often happens when:
        </Typography>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>The position is completely equal</li>
          <li>Neither player sees a way to win</li>
          <li>Both players are satisfied with a draw result</li>
        </ul>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF', color: isDark ? '#E2E8F0' : 'inherit' }}>
        <Typography variant="h3" gutterBottom>6. Dead Position</Typography>
        <Typography paragraph>
          When no sequence of legal moves can lead to checkmate, the game is automatically drawn.
        </Typography>
        <Box sx={{ p: isMobile ? 2 : 4, bgcolor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'grey.100', borderRadius: 1, color: isDark ? '#E2E8F0' : 'black' }}>
          <Typography variant="body2"><strong>Example:</strong> Both players have only their kings and a few bishops all on the same color squares.</Typography>
        </Box>
      </Card>

      <Card sx={{ p: isMobile ? 2 : 6, mb: 4, bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#EFF6FF', color: isDark ? '#E2E8F0' : 'black' }}>
        <Typography variant="h3" gutterBottom>Draw Strategy Tips</Typography>
        <Box sx={{spaceY: 3}}>
          <div className="flex gap-3">
            <Badge>Defending</Badge>
            <Typography>If you're losing, try to simplify to a drawn endgame or force a stalemate</Typography>
          </div>
          <div className="flex gap-3">
            <Badge>Winning</Badge>
            <Typography>Be careful not to stalemate your opponent when you have a winning position</Typography>
          </div>
          <div className="flex gap-3">
            <Badge>Technique</Badge>
            <Typography>Learn common drawn positions so you know when to accept or offer a draw</Typography>
          </div>
        </Box>
      </Card>
    </Box>
  );
};

export default Draw;