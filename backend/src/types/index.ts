export interface RoomUser {
  id: string;
  name: string;
  color: 'white' | 'black';
}

export interface Position {
  row: number;
  col: number;
}

export interface RoomMove {
  move: { from: Position; to: Position; notation: string };
  playerColor: 'white' | 'black';
  playerName: string;
  timestamp: number;
}

export interface Room {
  users: RoomUser[];
  status: 'waiting' | 'playing' | 'finished';
  gameStartTime?: number;
  timerEnabled?: boolean;
  timerDuration?: number;
  createdAt: number;
  timeoutHandle?: NodeJS.Timeout;
  moveHistory?: RoomMove[];
}
