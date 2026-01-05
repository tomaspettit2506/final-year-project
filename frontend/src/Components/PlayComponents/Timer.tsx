import React from 'react';
import type { PieceColor } from '../../Types/chess';
import { Card } from '@mui/material';
import { Clock } from 'lucide-react';

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
    if (!isActive) return 'text-muted-foreground';
    if (time < 30) return 'text-red-500';
    if (time < 60) return 'text-orange-500';
    if (isCurrentPlayer) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Game Timer</span>
        </div>
        
        <div className="space-y-2">
          {/* Black Timer */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            currentPlayer === 'black' && isActive ? 'bg-secondary' : 'bg-muted/50'
          }`}>
            <span className="text-sm">Black</span>
            <span className={`text-xl tabular-nums ${getTimeColor(blackTime, currentPlayer === 'black')}`}>
              {formatTime(blackTime)}
            </span>
          </div>
          
          {/* White Timer */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
            currentPlayer === 'white' && isActive ? 'bg-secondary' : 'bg-muted/50'
          }`}>
            <span className="text-sm">White</span>
            <span className={`text-xl tabular-nums ${getTimeColor(whiteTime, currentPlayer === 'white')}`}>
              {formatTime(whiteTime)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Timer;
