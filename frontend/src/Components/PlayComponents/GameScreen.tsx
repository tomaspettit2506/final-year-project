import { useState, useEffect, useRef } from 'react';
import ChessBoard from './ChessBoard';
import CapturedPieces from './CapturedPieces';
import MoveHistory from './MoveHistory';
import Timer from './Timer';
import AccuracyStats from './AccuracyStats';
import { Button, Box, Card, Grid, Typography, Stack, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { GameState, Position, Move, Piece, GameMode, TimerState } from '../../Types/chess';
import {
  createInitialBoard,
  getLegalMoves,
  simulateMove,
  isCheckmate,
  isStalemate,
  isKingInCheck,
  getMoveNotation
} from '../../Utils/chessLogic';
import { getAIMove, calculateMoveAccuracy } from '../../Utils/chessAI';
import { ArrowLeft, RotateCcw, Undo } from 'lucide-react';

interface GameScreenProps {
  gameMode: GameMode;
  difficulty: number;
  timerEnabled: boolean;
  timerDuration: number;
  onBackToSetup: () => void;
  myColor?: 'white' | 'black';
  myName?: string;
  roomId?: string;
  isHost?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameMode, difficulty, timerEnabled, timerDuration, onBackToSetup, myColor = 'white', myName = '', roomId = '', isHost = false }) => {
    // myColor, myName, roomId, isHost are now available for multiplayer logic and display
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPosition: null,
    legalMoves: [],
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    winner: null
  }));
  
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [timer, setTimer] = useState<TimerState>({
    white: timerDuration,
    black: timerDuration,
    isActive: false
  });
  const timerIntervalRef = useRef<number | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!timerEnabled || !timer.isActive || gameState.isCheckmate || gameState.isStalemate) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        const currentPlayer = gameState.currentPlayer;
        const newTime = prev[currentPlayer] - 1;

        if (newTime <= 0) {
          setGameState(prevState => ({
            ...prevState,
            isCheckmate: true,
            winner: currentPlayer === 'white' ? 'black' : 'white'
          }));
          return {
            ...prev,
            [currentPlayer]: 0,
            isActive: false
          };
        }

        return {
          ...prev,
          [currentPlayer]: newTime
        };
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerEnabled, timer.isActive, gameState.currentPlayer, gameState.isCheckmate, gameState.isStalemate]);

  // Check for AI move
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      gameState.currentPlayer === 'black' &&
      !gameState.isCheckmate &&
      !gameState.isStalemate &&
      !isAIThinking
    ) {
      setIsAIThinking(true);
      
      // Adjust AI thinking time based on difficulty
      // Beginner: quick response (100-200ms)
      // Intermediate: moderate response (200-400ms)
      // Advanced: thoughtful response (400-600ms)
      // Expert: deep thinking (600-1000ms)
      let thinkingTime: number;
      if (difficulty < 600) {
        thinkingTime = 100 + Math.random() * 100; // 100-200ms
      } else if (difficulty < 1100) {
        thinkingTime = 200 + Math.random() * 200; // 200-400ms
      } else if (difficulty < 1600) {
        thinkingTime = 400 + Math.random() * 200; // 400-600ms
      } else {
        thinkingTime = 600 + Math.random() * 400; // 600-1000ms
      }
      
      aiTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        const aiMove = getAIMove(gameState.board, difficulty, 'black');
        if (aiMove) {
          makeMove(aiMove.from, aiMove.to);
        }
        setIsAIThinking(false);
      }, thinkingTime);
    }
  }, [gameMode, gameState.currentPlayer, gameState.isCheckmate, gameState.isStalemate]);
  
  const handleSquareClick = (row: number, col: number) => {
    if (gameMode === 'ai' && (gameState.currentPlayer === 'black' || isAIThinking)) return;
    if (gameState.isCheckmate || gameState.isStalemate) return;
    
    const clickedPiece = gameState.board[row][col];
    
    if (gameState.selectedPosition) {
      const isLegalMove = gameState.legalMoves.some(
        move => move.row === row && move.col === col
      );
      
      if (isLegalMove) {
        makeMove(gameState.selectedPosition, { row, col });
        return;
      }
    }
    
    if (clickedPiece && clickedPiece.color === gameState.currentPlayer) {
      const legalMoves = getLegalMoves(gameState.board, { row, col });
      setGameState(prev => ({
        ...prev,
        selectedPosition: { row, col },
        legalMoves
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        selectedPosition: null,
        legalMoves: []
      }));
    }
  };
  
  const makeMove = (from: Position, to: Position) => {
    const piece = gameState.board[from.row][from.col];
    if (!piece) return;
    
    let accuracyData: { accuracy: number; accuracyClass: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' } | undefined;
    const isHumanMove = gameMode === 'pvp' || (gameMode === 'ai' && piece.color === 'white');
    
    if (isHumanMove) {
      accuracyData = calculateMoveAccuracy(gameState.board, { from, to }, piece.color);
    }
    
    const capturedPiece = gameState.board[to.row][to.col];
    const newBoard = simulateMove(gameState.board, from, to);
    const notation = getMoveNotation(gameState.board, from, to);
    
    const move: Move = {
      from,
      to,
      piece,
      captured: capturedPiece || undefined,
      notation,
      ...(accuracyData && { 
        accuracy: accuracyData.accuracy,
        accuracyClass: accuracyData.accuracyClass
      })
    };
    
    const newCapturedPieces = { ...gameState.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces[piece.color].push(capturedPiece);
    }
    
    const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    const isCheck = isKingInCheck(newBoard, nextPlayer);
    const isCheckmateState = isCheckmate(newBoard, nextPlayer);
    const isStalemateState = isStalemate(newBoard, nextPlayer);
    
    setGameState({
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPosition: null,
      legalMoves: [],
      moveHistory: [...gameState.moveHistory, move],
      capturedPieces: newCapturedPieces,
      isCheck,
      isCheckmate: isCheckmateState,
      isStalemate: isStalemateState,
      winner: isCheckmateState ? gameState.currentPlayer : null
    });

    if (timerEnabled && gameState.moveHistory.length === 0) {
      setTimer(prev => ({ ...prev, isActive: true }));
    }
  };

  const handlePieceDrop = (from: Position, to: Position) => {
    makeMove(from, to);
  };
  
  const handleNewGame = () => {
    setGameState({
      board: createInitialBoard(),
      currentPlayer: 'white',
      selectedPosition: null,
      legalMoves: [],
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      winner: null
    });
    setTimer({
      white: timerDuration,
      black: timerDuration,
      isActive: false
    });
    setIsAIThinking(false);
  };
  
  const handleUndo = () => {
    const movesToUndo = gameMode === 'ai' ? 2 : 1;
    if (gameState.moveHistory.length < movesToUndo) return;
    
    const newHistory = gameState.moveHistory.slice(0, -movesToUndo);
    
    let newBoard = createInitialBoard();
    const newCapturedPieces = { white: [] as Piece[], black: [] as Piece[] };
    
    for (const move of newHistory) {
      if (move.captured) {
        newCapturedPieces[move.piece.color].push(move.captured);
      }
      newBoard = simulateMove(newBoard, move.from, move.to);
    }
    
    const nextPlayer = gameMode === 'ai' ? 'white' : (newHistory.length % 2 === 0 ? 'white' : 'black');
    const isCheck = isKingInCheck(newBoard, nextPlayer);
    
    setGameState({
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPosition: null,
      legalMoves: [],
      moveHistory: newHistory,
      capturedPieces: newCapturedPieces,
      isCheck,
      isCheckmate: false,
      isStalemate: false,
      winner: null
    });
  };
  
  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4} sx={{
      background: 'linear-gradient(135deg, #0f172a 0%, #6d28d9 50%, #0f172a 100%)'
    }}>
      <Box maxWidth="1200px" width="100%">
        {/* Header */}
        <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
          {/* Player Info */}
          {gameMode === 'pvp' && (
            <Box mr={2}>
              <Typography variant="subtitle1" color="text.secondary">
                You are <b>{myName || 'You'}</b> ({myColor})
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Room ID: <b>{roomId}</b> {isHost ? '(Host)' : ''}
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            onClick={() => setConfirmDialogOpen(true)}
            startIcon={<ArrowLeft style={{ width: 20, height: 20 }} />}
          >
            Back to Setup
          </Button>
          <Stack direction="row" spacing={2}>
            {gameMode === 'ai' && (
              <Button
                variant="contained"
                onClick={handleUndo}
                disabled={gameState.moveHistory.length < 2}
                startIcon={<Undo style={{ width: 20, height: 20 }} />}
              >
                Undo
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNewGame}
              startIcon={<RotateCcw style={{ width: 20, height: 20 }} />}
            >
              New Game
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={4} alignItems="flex-start">
          {/* Left Panel */}
          <Grid size={{xs: 12, lg: 3}} order={{ xs: 2, lg: 1 }}>
            <Stack spacing={3}>
              {/* Game Status */}
              <Card variant="outlined" sx={{ p: 3, bgcolor: 'background.paper', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Game Status</Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Mode</Typography>
                    <Typography>{gameMode === 'ai' ? 'vs AI' : 'PvP'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Current Turn</Typography>
                    <Typography sx={{ textTransform: 'capitalize' }}>{gameState.currentPlayer}</Typography>
                  </Box>
                  {gameState.isCheck && !gameState.isCheckmate && (
                    <Typography color="warning.main" fontWeight={500}>Check!</Typography>
                  )}
                  {gameState.isCheckmate && (
                    <Typography color="success.main" fontWeight={500}>
                      Checkmate! {gameState.winner} wins!
                    </Typography>
                  )}
                  {gameState.isStalemate && (
                    <Typography color="info.main" fontWeight={500}>Stalemate!</Typography>
                  )}
                </Stack>
              </Card>
              {timerEnabled && (
                <Timer
                  whiteTime={timer.white}
                  blackTime={timer.black}
                  currentPlayer={gameState.currentPlayer}
                  isActive={timer.isActive}
                />
              )}
            </Stack>
          </Grid>
          
          {/* Center - Chess Board */}
          <Grid size={{xs: 12, lg: 6}} order={{ xs: 1, lg: 2 }}>
            <Box display="flex" justifyContent="center">
              <Box position="relative">
                <ChessBoard
                  board={gameState.board}
                  selectedPosition={gameState.selectedPosition}
                  legalMoves={gameState.legalMoves}
                  onSquareClick={handleSquareClick}
                  onPieceDrop={handlePieceDrop}
                />
                {isAIThinking && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bgcolor="rgba(0,0,0,0.3)"
                    borderRadius={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box bgcolor="background.paper" px={3} py={1.5} borderRadius={2} boxShadow={3}>
                      <Typography>AI is thinking...</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
          
          {/* Right Panel */}
          <Grid size={{xs: 12, lg: 3}} order={{ xs: 3, lg: 3 }}>
            <Stack spacing={3}>
              <CapturedPieces
                whiteCaptured={gameState.capturedPieces.white}
                blackCaptured={gameState.capturedPieces.black}
              />
              <MoveHistory moves={gameState.moveHistory} />
              <AccuracyStats moves={gameState.moveHistory} />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Resign Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to resign? This will end the game and your opponent will be declared the winner.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setGameState(prev => ({
                ...prev,
                isCheckmate: true,
                winner: prev.currentPlayer === 'white' ? 'black' : 'white',
                
              }));
              setConfirmDialogOpen(false);
              setTimeout(() => {
                onBackToSetup();
              }, 5000);
            }}
            color="error"
          >
            Resign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default GameScreen;