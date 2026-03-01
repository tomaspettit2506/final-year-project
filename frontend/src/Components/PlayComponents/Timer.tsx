import React from 'react';
import type { PieceColor } from '../../Types/chess';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';

interface TimerProps {
  whiteTime: number;
  blackTime: number;
  currentPlayer: PieceColor;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ whiteTime, blackTime, currentPlayer, isActive }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (time: number, isCurrentPlayer: boolean) => {
    if (!isActive) return 'text.secondary';
    if (time < 30) return 'error.main';
    if (time < 60) return 'warning.main';
    if (isCurrentPlayer) return 'text.primary';
    return 'text.secondary';
  };

  const getRowBg = (isCurrent: boolean) =>
    isCurrent && isActive ? 'action.selected' : 'action.hover';

  const getRowBorderColor = (isCurrent: boolean) =>
    isCurrent && isActive ? 'primary.main' : 'divider';

  const getLabelColor = (isCurrent: boolean) =>
    isCurrent && isActive ? 'text.primary' : 'text.secondary';

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography sx={{fontSize: 15 }} variant="overline" color="text.secondary" textAlign="center">
            ⏲️ Game Timer
          </Typography>

          <Stack spacing={1.5}>
            {/* Black Timer */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: getRowBorderColor(currentPlayer === 'black'),
                bgcolor: getRowBg(currentPlayer === 'black'),
                transition: 'background-color 150ms ease',
              }}
            >
              <Typography variant="body2" color={getLabelColor(currentPlayer === 'black')}>Black</Typography>
              <Typography
                variant="h6"
                sx={{ fontVariantNumeric: 'tabular-nums', color: getTimeColor(blackTime, currentPlayer === 'black') }}
              >
                {formatTime(blackTime)}
              </Typography>
            </Box>

            {/* White Timer */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: getRowBorderColor(currentPlayer === 'white'),
                bgcolor: getRowBg(currentPlayer === 'white'),
                transition: 'background-color 150ms ease',
              }}
            >
              <Typography variant="body2" color={getLabelColor(currentPlayer === 'white')}>White</Typography>
              <Typography
                variant="h6"
                sx={{ fontVariantNumeric: 'tabular-nums', color: getTimeColor(whiteTime, currentPlayer === 'white') }}
              >
                {formatTime(whiteTime)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Timer;
