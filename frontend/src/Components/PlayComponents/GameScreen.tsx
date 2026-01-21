import { useState, useEffect, useRef, useCallback } from 'react';
import ChessBoard from './ChessBoard';
import CapturedPieces from './CapturedPieces';
import MoveHistory from './MoveHistory';
import Timer from './Timer';
import AccuracyStats from './AccuracyStats';
import { Button, Box, Card, Grid, Typography, Stack, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { GameState, Position, Move, Piece, GameMode, TimerState } from '../../Types/chess';
import {createInitialBoard, getLegalMoves, simulateMove, isCheckmate, isStalemate, isKingInCheck, getMoveNotation } from '../../Utils/chessLogic';
import { getAIMove, calculateMoveAccuracy } from '../../Utils/chessAI';
import { socket } from '../../Services/socket';
import { ArrowLeft, RotateCcw, Undo } from 'lucide-react';

interface GameScreenProps {
  gameMode: GameMode;
  difficulty: number;
  difficultyName: string;
  timerEnabled: boolean;
  timerDuration: number;
  onBackToSetup: () => void;
  myColor?: 'white' | 'black';
  myName?: string;
  roomId?: string;
  isHost?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameMode, difficulty, difficultyName, timerEnabled, timerDuration, onBackToSetup, myColor = 'white', myName = '', roomId = '', isHost = false }) => {
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
  const isMountedRef = useRef(true);  const gameStateRef = useRef(gameState);
  const difficultyRef = useRef(difficulty);  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resolvedColor, setResolvedColor] = useState<'white' | 'black'>(myColor);
  const [resolvedName, setResolvedName] = useState<string>(myName);
  const pendingMovesRef = useRef<RemoteMove[]>([]);

  type RemoteMove = {
    move: { from: Position; to: Position; notation: string };
    playerColor: 'white' | 'black';
    playerName: string;
    timestamp?: number;
  };

  // Update refs with current gameState and difficulty
  useEffect(() => {
    gameStateRef.current = gameState;
    difficultyRef.current = difficulty;
  }, [gameState, difficulty]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
      }
      if (aiTimeoutRef.current !== null) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

  // Explicitly mark component as mounted when this component mounts
  // This ensures the flag is reset if the component remounts
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[GameScreen] Component mounted, isMountedRef set to true');
    return () => {
      isMountedRef.current = false;
      console.log('[GameScreen] Component unmounting, isMountedRef set to false');
    };
  }, []);

  // Keep resolved color/name in sync with incoming props
  useEffect(() => {
    setResolvedColor(myColor);
  }, [myColor]);

  useEffect(() => {
    setResolvedName(myName);
  }, [myName]);

  // Timer countdown effect
  useEffect(() => {
    if (!timerEnabled || !timer.isActive || gameState.isCheckmate || gameState.isStalemate) {
      if (timerIntervalRef.current !== null) {
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
      if (timerIntervalRef.current !== null) {
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
      // Easy: quick response (100-200ms)
      // Medium: moderate response (200-400ms)
      // Hard: thoughtful response (400-600ms)
      // Expert: deep thinking (600-900ms)
      // Master: very deep thinking (900-1200ms)
      // Rocket: extreme thinking (1200-1800ms)
      let thinkingTime: number;
      if (difficultyRef.current < 550) {
        thinkingTime = 100 + Math.random() * 100; // 100-200ms
      } else if (difficultyRef.current < 900) {
        thinkingTime = 200 + Math.random() * 200; // 200-400ms
      } else if (difficultyRef.current < 1300) {
        thinkingTime = 400 + Math.random() * 200; // 400-600ms
      } else if (difficultyRef.current < 1700) {
        thinkingTime = 600 + Math.random() * 300; // 600-900ms
      } else if (difficultyRef.current < 2200) {
        thinkingTime = 900 + Math.random() * 300; // 900-1200ms
      } else {
        thinkingTime = 1200 + Math.random() * 600; // 1200-1800ms (Rocket level)
      }
      
      const timeoutId = setTimeout(() => {
        try {
          const aiMove = getAIMove(gameStateRef.current.board, difficultyRef.current, 'black');
          if (aiMove) {
            makeMove(aiMove.from, aiMove.to);
          }
        } catch (error) {
          console.error('AI move calculation error:', error);
        } finally {
          setIsAIThinking(false);
        }
      }, thinkingTime);
      
      aiTimeoutRef.current = timeoutId;
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [gameMode, gameState.currentPlayer, gameState.isCheckmate, gameState.isStalemate]);

  const applyRemoteHistory = useCallback((remoteMoves: RemoteMove[]) => {
    if (!Array.isArray(remoteMoves) || remoteMoves.length === 0) return;

    let rebuiltBoard = createInitialBoard();
    const rebuiltCaptured: { white: Piece[]; black: Piece[] } = { white: [], black: [] };
    const rebuiltHistory: Move[] = [];
    let currentPlayer: 'white' | 'black' = 'white';

    for (const remote of remoteMoves) {
      const { from, to, notation } = remote.move;
      const movingPiece = rebuiltBoard[from.row]?.[from.col];

      if (!movingPiece) {
        console.warn('[GameScreen] Skipping sync move - no piece found at from square', remote);
        continue;
      }

      const capturedPiece = rebuiltBoard[to.row]?.[to.col] || undefined;
      rebuiltBoard = simulateMove(rebuiltBoard, from, to);

      rebuiltHistory.push({
        from,
        to,
        piece: movingPiece,
        captured: capturedPiece,
        notation
      });

      if (capturedPiece) {
        rebuiltCaptured[movingPiece.color].push(capturedPiece);
      }

      currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    }

    const nextPlayer = currentPlayer;
    const isCheck = isKingInCheck(rebuiltBoard, nextPlayer);
    const isCheckmateState = isCheckmate(rebuiltBoard, nextPlayer);
    const isStalemateState = isStalemate(rebuiltBoard, nextPlayer);

    setGameState({
      board: rebuiltBoard,
      currentPlayer: nextPlayer,
      selectedPosition: null,
      legalMoves: [],
      moveHistory: rebuiltHistory,
      capturedPieces: rebuiltCaptured,
      isCheck,
      isCheckmate: isCheckmateState,
      isStalemate: isStalemateState,
      winner: isCheckmateState ? (nextPlayer === 'white' ? 'black' : 'white') : null
    });

    if (timerEnabled && remoteMoves.length > 0) {
      setTimer(prev => ({ ...prev, isActive: true }));
    }
  }, [timerEnabled]);

  // Handle multiplayer socket events
  useEffect(() => {
    if (gameMode !== 'pvp' || !roomId) {
      console.log('[GameScreen] Skipping socket setup - gameMode:', gameMode, 'roomId:', roomId);
      return;
    }

    if (!socket.connected) {
      console.log('[GameScreen] Socket not connected, connecting now for room:', roomId);
      socket.connect();
    }

    console.log('[GameScreen] Setting up socket listeners for room:', roomId, 'myColor:', myColor, 'timestamp:', Date.now());

    const handleMoveMade = (data: { move: { from: Position; to: Position; notation: string }; playerColor: string; playerName: string }) => {
      console.log('[GameScreen] handleMoveMade CALLED!', {
        timestamp: Date.now(),
        data,
        myColor: resolvedColor,
        isMounted: isMountedRef.current,
        playerColorMatch: data.playerColor === resolvedColor,
        willApply: data.playerColor !== resolvedColor
      });
      
      if (!isMountedRef.current) {
        console.log('[GameScreen] Component not mounted, queueing move');
        pendingMovesRef.current.push({
          move: data.move,
          playerColor: data.playerColor as 'white' | 'black',
          playerName: data.playerName,
          timestamp: Date.now()
        });
        return;
      }
      
      // Only apply move if it's from opponent
      if (data.playerColor !== resolvedColor) {
        console.log('[GameScreen] Applying opponent move:', { from: data.move.from, to: data.move.to });
        const { from, to } = data.move;

        setGameState(prev => {
          const capturedPiece = prev.board[to.row][to.col];
          const movingPiece = prev.board[from.row][from.col];
          if (!movingPiece) return prev;

          const newBoard = simulateMove(prev.board, from, to);
          const move: Move = {
            from,
            to,
            piece: movingPiece,
            captured: capturedPiece || undefined,
            notation: data.move.notation
          };

          const newCapturedPieces = {
            white: [...prev.capturedPieces.white],
            black: [...prev.capturedPieces.black]
          };
          if (capturedPiece) {
            newCapturedPieces[movingPiece.color].push(capturedPiece);
          }

          const nextPlayer = prev.currentPlayer === 'white' ? 'black' : 'white';
          const isCheck = isKingInCheck(newBoard, nextPlayer);
          const isCheckmateState = isCheckmate(newBoard, nextPlayer);
          const isStalemateState = isStalemate(newBoard, nextPlayer);

          // Start timers on first received move when timers are enabled
          if (timerEnabled && prev.moveHistory.length === 0) {
            setTimer(t => ({ ...t, isActive: true }));
          }

          return {
            board: newBoard,
            currentPlayer: nextPlayer,
            selectedPosition: null,
            legalMoves: [],
            moveHistory: [...prev.moveHistory, move],
            capturedPieces: newCapturedPieces,
            isCheck,
            isCheckmate: isCheckmateState,
            isStalemate: isStalemateState,
            winner: isCheckmateState ? prev.currentPlayer : null
          };
        });
      }
    };

    const handleGameEnded = (data: { result: string; winner: string | null; players: Array<{ name: string; color: string }> }) => {
      if (!isMountedRef.current) return;
      console.log('Game ended by opponent:', data);
      // Game state is already updated, just log for now
    };

    const handleOpponentDisconnected = () => {
      if (!isMountedRef.current) return;
      console.log('Opponent disconnected');
      setGameState(prev => ({
        ...prev,
        isCheckmate: true,
        winner: resolvedColor
      }));
    };

    socket.on('moveMade', handleMoveMade);
    socket.on('gameEnded', handleGameEnded);
    socket.on('opponentDisconnected', handleOpponentDisconnected);

    // Immediately request a sync in case we missed a move during navigation
    socket.emit('syncGameState', { roomId }, (response: { success: boolean; moveHistory?: RemoteMove[]; players?: Array<{ id: string; name: string; color: 'white' | 'black' }> }) => {
      if (!response?.success || !Array.isArray(response.moveHistory)) {
        return;
      }

      const remoteCount = response.moveHistory.length;
      const localCount = gameStateRef.current.moveHistory.length;

      if (response.players && response.players.length > 0) {
        const me = response.players.find(p => p.id === socket.id);
        if (me) {
          setResolvedColor(me.color);
          setResolvedName(me.name);
        }
      }

      if (remoteCount > localCount) {
        console.log('[GameScreen] Syncing missed moves:', { remoteCount, localCount });
        applyRemoteHistory(response.moveHistory);
      }
    });

    // Apply any queued moves that arrived before mount
    if (pendingMovesRef.current.length > 0) {
      const combined = [...gameStateRef.current.moveHistory.map(m => ({
        move: { from: m.from, to: m.to, notation: m.notation || '' },
        playerColor: m.piece.color,
        playerName: resolvedName || '',
        timestamp: Date.now()
      })), ...pendingMovesRef.current];
      console.log('[GameScreen] Applying queued moves after mount:', pendingMovesRef.current.length);
      applyRemoteHistory(combined);
      pendingMovesRef.current = [];
    }

    console.log('[GameScreen] Socket listeners registered for room:', roomId);

    return () => {
      console.log('[GameScreen] Cleaning up socket listeners for room:', roomId);
      socket.off('moveMade', handleMoveMade);
      socket.off('gameEnded', handleGameEnded);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
    };
  }, [gameMode, roomId, myColor, timerEnabled, applyRemoteHistory]);
  
  const handleSquareClick = (row: number, col: number) => {
    // Prevent moves if it's not your turn in multiplayer
    const effectiveColor = resolvedColor || myColor;

    if (gameMode === 'pvp' && gameState.currentPlayer !== effectiveColor) return;
    
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
    const currentState = gameStateRef.current;
    const piece = currentState.board[from.row][from.col];
    if (!piece) return;
    
    let accuracyData: { accuracy: number; accuracyClass: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' } | undefined;
    const isHumanMove = gameMode === 'pvp' || (gameMode === 'ai' && piece.color === 'white');
    
    if (isHumanMove) {
      accuracyData = calculateMoveAccuracy(currentState.board, { from, to }, piece.color);
    }
    
    const capturedPiece = currentState.board[to.row][to.col];
    const newBoard = simulateMove(currentState.board, from, to);
    const notation = getMoveNotation(currentState.board, from, to);
    
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
    
    const newCapturedPieces = { ...currentState.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces[piece.color].push(capturedPiece);
    }
    
    const nextPlayer = currentState.currentPlayer === 'white' ? 'black' : 'white';
    const isCheck = isKingInCheck(newBoard, nextPlayer);
    const isCheckmateState = isCheckmate(newBoard, nextPlayer);
    const isStalemateState = isStalemate(newBoard, nextPlayer);
    
    const newGameState: GameState = {
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPosition: null,
      legalMoves: [],
      moveHistory: [...currentState.moveHistory, move],
      capturedPieces: newCapturedPieces,
      isCheck,
      isCheckmate: isCheckmateState,
      isStalemate: isStalemateState,
      winner: isCheckmateState ? currentState.currentPlayer : null
    };

    // Emit move to opponent in multiplayer mode BEFORE updating state
    if (gameMode === 'pvp' && roomId) {
      console.log('[GameScreen] Sending move to server:', { 
        roomId, 
        move: { from, to, notation }, 
        myColor: resolvedColor,
        socketConnected: socket.connected,
        socketId: socket.id
      });
      
      socket.emit('makeMove', { roomId, move: { from, to, notation } }, (response: any) => {
        console.log('[GameScreen] makeMove callback received:', response);
      });
      
      // If game ended, notify opponent
      if (isCheckmateState || isStalemateState) {
        socket.emit('endGame', { 
          roomId, 
          result: isCheckmateState ? 'checkmate' : 'stalemate',
          winner: isCheckmateState ? currentState.currentPlayer : null
        });
      }
    }

    setGameState(newGameState);

    if (timerEnabled && currentState.moveHistory.length === 0) {
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
                    <Typography>{gameMode === 'ai' ? `vs AI (${difficultyName})` : 'PvP'}</Typography>
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