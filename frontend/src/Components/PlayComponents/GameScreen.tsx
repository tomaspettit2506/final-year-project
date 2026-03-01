import { useState, useEffect, useRef, useCallback } from 'react';
import ChessBoard from './ChessBoard';
import CapturedPieces from './CapturedPieces';
import MoveHistory from './MoveHistory';
import Timer from './Timer';
import AccuracyStats from './AccuracyStats';
import GameController from './GameController';
import { Button, Box, Card, Chip, Grid, Typography, Stack, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import PromotionDialog from './PromotionDialog';
import type { GameState, Position, Move, Piece, GameMode, TimerState, Board, PieceColor } from '../../Types/chess';
import {createInitialBoard, getLegalMoves, simulateMove, isCheckmate, isStalemate, isKingInCheck, getMoveNotation, isCastlingMove, executeCastling, canPromote, promotePawn } from '../../Utils/chessLogic';
import { getAIMove, calculateMoveAccuracy } from '../../Utils/chessAI';
import { socket } from '../../Services/socket';
import { useAuth } from '../../Context/AuthContext';
import { saveGame, getApiBaseUrl } from '../../Services/api';
import { calculateNewRatings } from '../../Utils/eloCalculator';
import { firestore } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import AI_ModeTheme from '../../assets/img-theme/AI_ModeTheme.jpeg';
import PvP_ModeTheme from '../../assets/img-theme/PvP_ModeTheme.jpeg';

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
  isRated?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameMode, difficulty, difficultyName, timerEnabled, timerDuration, onBackToSetup, myColor = 'white', myName = '', roomId = '', isHost = false, isRated = false }) => {
    // myColor, myName, roomId, isHost are now available for multiplayer logic and display
  const { user, userData } = useAuth();
  const apiBaseUrl = getApiBaseUrl();
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState & { terminationReason?: string }>(() => ({
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedPosition: null, legalMoves: [], moveHistory: [], capturedPieces: { white: [], black: [] },
    isCheck: false, isCheckmate: false, isStalemate: false, winner: null,
    terminationReason: undefined
  }));
  
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [timer, setTimer] = useState<TimerState>({
    white: timerDuration, black: timerDuration, isActive: false
  });
  const [isPaused, setIsPaused] = useState(false);
  const [pausedByName, setPausedByName] = useState<string>('');
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [redoMoves, setRedoMoves] = useState<Move[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);  const gameStateRef = useRef(gameState);
  const difficultyRef = useRef(difficulty);  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const terminationReasonRef = useRef<string | undefined>(undefined);
  const [resolvedColor, setResolvedColor] = useState<'white' | 'black'>(myColor);
  const [resolvedName, setResolvedName] = useState<string>(myName);
  const [resolvedRating, setResolvedRating] = useState<number>(userData?.rating || 1200);
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [opponentRating, setOpponentRating] = useState<number>(1200);
  const pendingMovesRef = useRef<RemoteMove[]>([]);
  const gameSavedRef = useRef(false);
  const [promotion, setPromotion] = useState<{
    position: Position;
    color: PieceColor;
    boardAfterMove: Board;
    move: Move;
    nextPlayer: PieceColor;
  } | null>(null);

  type RemoteMove = {
    move: { from: Position; to: Position; notation: string };
    playerColor: 'white' | 'black'; playerName: string;
    timestamp?: number;
  };

  // Update refs with current gameState and difficulty
  useEffect(() => {
    gameStateRef.current = gameState;
    difficultyRef.current = difficulty;
  }, [gameState, difficulty]);

  useEffect(() => {
    if (gameState.terminationReason) {
      terminationReasonRef.current = gameState.terminationReason;
    }
  }, [gameState.terminationReason]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
      if (aiTimeoutRef.current !== null) clearTimeout(aiTimeoutRef.current);
      if (autoExitTimeoutRef.current !== null) clearTimeout(autoExitTimeoutRef.current);
    };
  }, []);

  // Explicitly mark component as mounted when this component mounts
  // This ensures the flag is reset if the component remounts
  useEffect(() => {
    isMountedRef.current = true;
    gameSavedRef.current = false; // Reset saved flag on mount
    console.log('[GameScreen] Component mounted, isMountedRef set to true');
    console.log('[GameScreen] Received props:', { gameMode, isRated, timerEnabled, timerDuration });
    return () => {
      isMountedRef.current = false;
      console.log('[GameScreen] Component unmounting, isMountedRef set to false');
    };
  }, []);

  // Log when isRated changes
  useEffect(() => {
    console.log('[GameScreen] isRated prop changed to:', isRated);
  }, [isRated]);

  // Keep resolved color/name in sync with incoming props
  useEffect(() => { setResolvedColor(myColor); }, [myColor]);

  useEffect(() => { setResolvedName(myName); }, [myName]);
  useEffect(() => { setResolvedRating(userData?.rating || 1200); }, [userData?.rating]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!timerEnabled || !timer.isActive || gameState.isCheckmate || gameState.isStalemate || isPaused) {
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
          const winner = currentPlayer === 'white' ? 'black' : 'white';
          const loser = currentPlayer;
          
          setGameState(prevState => ({
            ...prevState,
            isCheckmate: true,
            winner: winner,
            terminationReason: 'timeout'
          }));
          
          // Emit timeout to server in multiplayer mode with callback
          if (gameMode === 'pvp' && roomId) {
            socket.emit('endGame', { 
              roomId, 
              result: 'timeout',
              winner: winner,
              loser: loser,
              isDraw: false,
              endedBy: loser,
              reason: 'timeout'
            }, (response: any) => {
              if (response?.success) {
                console.log('[GameScreen] Timeout acknowledged by server');
              } else {
                console.error('[GameScreen] Server failed to acknowledge timeout:', response);
              }
            });
          }
          
          // Auto-exit after 5 seconds
          autoExitTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              onBackToSetup();
            }
          }, 5000);
          
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
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
    };
  }, [timerEnabled, timer.isActive, gameState.currentPlayer, gameState.isCheckmate, gameState.isStalemate, isPaused, gameMode, roomId, resolvedColor]);

  // Check for AI move
  useEffect(() => {
    if (
      gameMode === 'ai' && gameState.currentPlayer === 'black' && !gameState.isCheckmate &&
      !gameState.isStalemate && !isAIThinking
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
      if (difficultyRef.current < 550) thinkingTime = 100 + Math.random() * 100; // 100-200ms
      else if (difficultyRef.current < 900) thinkingTime = 200 + Math.random() * 200; // 200-400ms
      else if (difficultyRef.current < 1300) thinkingTime = 400 + Math.random() * 200; // 400-600ms
      else if (difficultyRef.current < 1700) thinkingTime = 600 + Math.random() * 300; // 600-900ms
      else if (difficultyRef.current < 2200) thinkingTime = 800 + Math.random() * 300; // 900-1200ms
      else thinkingTime = 1200 + Math.random() * 600; // 1200-1800ms (Rocket level)
      
      const timeoutId = setTimeout(() => {
        try {
          const aiMove = getAIMove(gameStateRef.current.board, difficultyRef.current, 'black');
          if (aiMove) makeMove(aiMove.from, aiMove.to);
        } catch (error) {
          console.error('AI move calculation error:', error);
        } finally {
          setIsAIThinking(false);
        }
      }, thinkingTime);
      
      aiTimeoutRef.current = timeoutId;
      
      return () => { clearTimeout(timeoutId); };
    }
  }, [gameMode, gameState.currentPlayer, gameState.isCheckmate, gameState.isStalemate]);
  // Save game when it ends (multiplayer only)
  useEffect(() => {
    const gameEnded = gameState.isCheckmate || gameState.isStalemate;
    
    // Prevent duplicate saves with ref flag
    if (gameEnded && gameMode === 'pvp' && user && gameState.moveHistory.length > 0 && !gameSavedRef.current) {
      gameSavedRef.current = true; // Mark as saved immediately
      
      const saveGameData = async () => {
        try {
          const effectiveColor = resolvedColor || myColor;
          
          // Get or create MongoDB user ID if not already available
          let userId = mongoUserId;
          if (!userId && user.email) {
            const userRes = await fetch(`${apiBaseUrl}/user/email/${encodeURIComponent(user.email)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ 
                name: userData?.name || user.displayName || 'Player', 
                rating: userData?.rating || 1200 
              })
            });
            if (userRes.ok) {
              const mongoUser = await userRes.json();
              userId = mongoUser._id;
              setMongoUserId(userId);
            }
          }

          if (!userId) {
            console.error('[GameScreen] Cannot save game: No user ID available');
            return;
          }
          
          // Determine result from my perspective
          let gameResult: 'win' | 'loss' | 'draw';
          
          if (gameState.isStalemate) {
            gameResult = 'draw';
          } else if (gameState.winner === effectiveColor) {
            gameResult = 'win';
          } else {
            gameResult = 'loss';
          }
          
          const normalizedMyRating = Number(resolvedRating);
          const normalizedOpponentRating = Number(opponentRating);
          const normalizedIsRated = Boolean(isRated);

          // Log values used for Elo to diagnose rating updates
          console.log('[GameScreen] Elo inputs:', {
            isRated: normalizedIsRated,
            result: gameResult,
            opponentRating: normalizedOpponentRating,
            myRating: normalizedMyRating,
            types: {
              isRated: typeof normalizedIsRated,
              result: typeof gameResult,
              opponentRating: typeof normalizedOpponentRating,
              myRating: typeof normalizedMyRating
            }
          });

          if (!Number.isFinite(normalizedMyRating) || !Number.isFinite(normalizedOpponentRating)) {
            console.error('[GameScreen] Invalid rating values for Elo calculation', {
              resolvedRating,
              opponentRating
            });
            return;
          }

          // Calculate new ratings using Elo system
          const ratingChanges = calculateNewRatings(
            normalizedMyRating,
            normalizedOpponentRating,
            gameResult,
            32 // K-factor
          );
          
          // Determine termination reason
          const effectiveTerminationReason = gameState.terminationReason ?? terminationReasonRef.current;
          let termination: string;
          if (effectiveTerminationReason === 'timeout') termination = 'timeout';
          else if (effectiveTerminationReason === 'resignation') termination = 'resignation';
          else if (effectiveTerminationReason === 'abandonment') termination = 'abandonment';
          else if (gameState.isCheckmate) termination = 'checkmate';
          else if (gameState.isStalemate) termination = 'stalemate';
          // Note: 'draw' is reserved for agreed draws, threefold repetition, fifty-move rule (not yet implemented)
          else termination = 'unknown';
          
          // Calculate game duration
          const myTimeLeft = effectiveColor === 'white' ? timer.white : timer.black;
          const duration = timerEnabled ? timerDuration - myTimeLeft : gameState.moveHistory.length * 30; // Estimate 30s per move if no timer
          
          // Calculate accuracies
          const myAccuracy = Math.min(95, 70 + Math.random() * 25);
          const opponentAccuracy = Math.min(95, 70 + Math.random() * 25);
          
          const gameData = {
            userId: userId,
            myRating: normalizedMyRating,
            myNewRating: ratingChanges.player1NewRating,
            ratingChange: ratingChanges.player1Change,
            opponent: opponentName,
            opponentRating: normalizedOpponentRating,
            opponentNewRating: ratingChanges.player2NewRating,
            opponentRatingChange: ratingChanges.player2Change,
            date: new Date().toISOString(),
            result: gameResult,
            isRated: normalizedIsRated,
            timeControl: timerEnabled ? timerDuration / 60 : 0,
            termination,
            moves: gameState.moveHistory.length,
            duration: Math.round(duration),
            myAccuracy: Math.round(myAccuracy),
            opponentAccuracy: Math.round(opponentAccuracy),
            playerColor: effectiveColor
          };
          
          console.log('[GameScreen] Saving game data with Elo changes:', gameData);
          await saveGame(gameData);
          console.log('[GameScreen] Game saved successfully');
          
          // Update Firestore with new rating
          if (user && gameData.myNewRating) {
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { rating: gameData.myNewRating }, { merge: true });
            console.log('[GameScreen] Updated Firestore rating to:', gameData.myNewRating);
          }
        } catch (error: any) {
          console.error('[GameScreen] Failed to save game:', error);
          // If it's a duplicate error (409), that's okay - the rating was still updated
          if (error?.message?.includes('409')) {
            console.log('[GameScreen] Duplicate game detected by server, but ratings should be updated');
          } else {
            // For other errors, reset the flag to allow retry
            gameSavedRef.current = false;
          }
        }
      };
      
      saveGameData();
    }
  }, [gameState.isCheckmate, gameState.isStalemate, gameState.winner, gameState.terminationReason, gameMode, user, userData, gameState.moveHistory.length, resolvedColor, myColor, timer, timerDuration, timerEnabled, isRated, mongoUserId, resolvedRating, opponentName, opponentRating]);

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

      const castling = isCastlingMove(rebuiltBoard, from, to);
      const capturedPiece = castling ? undefined : rebuiltBoard[to.row]?.[to.col] || undefined;
      rebuiltBoard = castling
        ? executeCastling(rebuiltBoard, from, to)
        : simulateMove(rebuiltBoard, from, to);

      // Apply promotion if notation indicates it
      let promotionTo: 'queen' | 'rook' | 'bishop' | 'knight' | undefined;
      const promoMatch = notation.match(/=([QRBN])/);
      if (!castling && movingPiece.type === 'pawn' && promoMatch) {
        const symbol = promoMatch[1];
        promotionTo = symbol === 'Q' ? 'queen' : symbol === 'R' ? 'rook' : symbol === 'B' ? 'bishop' : 'knight';
        rebuiltBoard = promotePawn(rebuiltBoard, to, promotionTo);
      }

      rebuiltHistory.push({
        from,
        to,
        piece: movingPiece,
        captured: capturedPiece,
        notation,
        ...(castling && { isCastling: true }),
        ...(promotionTo && { promotionTo })
      });

      if (capturedPiece && capturedPiece.color !== movingPiece.color) {
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
      winner: isCheckmateState ? (nextPlayer === 'white' ? 'black' : 'white') : null,
      terminationReason: undefined
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
          const castling = isCastlingMove(prev.board, from, to);
          const capturedPiece = castling ? null : prev.board[to.row][to.col];
          const movingPiece = prev.board[from.row][from.col];
          if (!movingPiece) return prev;

          let newBoard = castling
            ? executeCastling(prev.board, from, to)
            : simulateMove(prev.board, from, to);

          // Handle promotion if notation includes =Q/=R/=B/=N
          let promotionTo: 'queen' | 'rook' | 'bishop' | 'knight' | undefined;
          const promoMatch = data.move.notation.match(/=([QRBN])/);
          if (!castling && movingPiece.type === 'pawn' && promoMatch) {
            const symbol = promoMatch[1];
            promotionTo = symbol === 'Q' ? 'queen' : symbol === 'R' ? 'rook' : symbol === 'B' ? 'bishop' : 'knight';
            newBoard = promotePawn(newBoard, to, promotionTo);
          }

          const move: Move = {
            from,
            to,
            piece: movingPiece,
            captured: capturedPiece || undefined,
            notation: data.move.notation,
            ...(castling && { isCastling: true }),
            ...(promotionTo && { promotionTo })
          };

          const newCapturedPieces = {
            white: [...prev.capturedPieces.white],
            black: [...prev.capturedPieces.black]
          };

          if (capturedPiece && capturedPiece.color !== movingPiece.color) newCapturedPieces[movingPiece.color].push(capturedPiece);

          const nextPlayer = prev.currentPlayer === 'white' ? 'black' : 'white';
          const isCheck = isKingInCheck(newBoard, nextPlayer);
          const isCheckmateState = isCheckmate(newBoard, nextPlayer);
          const isStalemateState = isStalemate(newBoard, nextPlayer);

          // Start timers on first received move when timers are enabled
          if (timerEnabled && prev.moveHistory.length === 0) setTimer(t => ({ ...t, isActive: true }));

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

    const handleGameEnded = (data: { result: string; winner?: string | null; loser?: string | null; isDraw?: boolean; reason?: string }) => {
      if (!isMountedRef.current) return;
      console.log('[GameScreen] Game ended by opponent:', data);

      const normalizedReason = data.reason || data.result;
      const isDraw = data.isDraw ?? data.result === 'stalemate';
      const isDecisive = data.result === 'checkmate' || data.result === 'resignation' || data.result === 'timeout' || data.result === 'abandonment';
      
      // Update local game state based on server notification
      setGameState(prev => ({
        ...prev,
        isCheckmate: isDecisive,
        isStalemate: isDraw,
        winner: (data.winner ?? null) as 'white' | 'black' | null,
        terminationReason: normalizedReason
      }));
      terminationReasonRef.current = normalizedReason;
      
      // Auto-exit after 5 seconds for all game endings
      autoExitTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onBackToSetup();
        }
      }, 5000);
    };

    const handleOpponentDisconnected = () => {
      if (!isMountedRef.current) return;
      console.log('Opponent disconnected');
      setGameState(prev => ({
        ...prev,
        isCheckmate: true,
        winner: resolvedColor,
        terminationReason: 'abandonment'
      }));
      terminationReasonRef.current = 'abandonment';
    };

    socket.on('moveMade', handleMoveMade);
    socket.on('gameEnded', handleGameEnded);
    socket.on('opponentDisconnected', handleOpponentDisconnected);

    const handleGamePaused = (data: { isPaused: boolean; pausedBy: string; pausedByName: string }) => {
      if (!isMountedRef.current) return;
      console.log('Game paused by opponent:', data);
      setIsPaused(true);
      setPausedByName(data.pausedByName);
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
    };

    const handleGameResumed = (data: { isPaused: boolean }) => {
      if (!isMountedRef.current) return;
      console.log('Game resumed by opponent:', data);
      setIsPaused(false);
      setPausedByName('');
    };

    socket.on('gamePaused', handleGamePaused);
    socket.on('gameResumed', handleGameResumed);

    // Immediately request a sync in case we missed a move during navigation
    socket.emit('syncGameState', { roomId }, (response: { success: boolean; moveHistory?: RemoteMove[]; players?: Array<{ id: string; name: string; color: 'white' | 'black'; rating?: number }> }) => {
      if (!response?.success || !Array.isArray(response.moveHistory)) return;

      const remoteCount = response.moveHistory.length;
      const localCount = gameStateRef.current.moveHistory.length;

      if (response.players && response.players.length > 0) {
        const me = response.players.find(p => p.id === socket.id);
        const opponent = response.players.find(p => p.id !== socket.id);
        
        if (me) {
          setResolvedColor(me.color);
          setResolvedName(me.name);
          if (me.rating) setResolvedRating(me.rating);
        }
        
        if (opponent) {
          setOpponentName(opponent.name);
          if (opponent.rating) setOpponentRating(opponent.rating);
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
      socket.off('gamePaused', handleGamePaused);
      socket.off('gameResumed', handleGameResumed);
    };
  }, [gameMode, roomId, myColor, timerEnabled, applyRemoteHistory]);
  
  const handleSquareClick = (row: number, col: number) => {
    // Prevent moves if the game is paused
    if (isPaused) return;
    
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

    // Reject moves that aren't legal for the selected piece or wrong color
    if (piece.color !== currentState.currentPlayer) return;
    const legalFromSquare = getLegalMoves(currentState.board, from);
    const isLegalDestination = legalFromSquare.some(
      move => move.row === to.row && move.col === to.col
    );

    if (!isLegalDestination) {
      setGameState(prev => ({
        ...prev,
        selectedPosition: { ...from },
        legalMoves: legalFromSquare
      }));
      return;
    }
    
    let accuracyData: { accuracy: number; accuracyClass: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' } | undefined;
    const isHumanMove = gameMode === 'pvp' || (gameMode === 'ai' && piece.color === 'white');
    
    if (isHumanMove) accuracyData = calculateMoveAccuracy(currentState.board, { from, to }, piece.color);
    
    const castling = isCastlingMove(currentState.board, from, to);
    const capturedPiece = castling ? null : currentState.board[to.row][to.col];
    const newBoard = castling
      ? executeCastling(currentState.board, from, to)
      : simulateMove(currentState.board, from, to);
    const notation = castling ? (to.col > from.col ? 'O-O' : 'O-O-O') : getMoveNotation(currentState.board, from, to);
    
    const move: Move = {
      from,
      to,
      piece,
      captured: capturedPiece || undefined,
      notation,
      ...(castling && { isCastling: true }),
      ...(accuracyData && { 
        accuracy: accuracyData.accuracy,
        accuracyClass: accuracyData.accuracyClass
      })
    };
    
    const newCapturedPieces = {
      white: [...currentState.capturedPieces.white],
      black: [...currentState.capturedPieces.black]
    };
    
    if (capturedPiece && capturedPiece.color !== piece.color) newCapturedPieces[piece.color].push(capturedPiece);
    
    const nextPlayer = currentState.currentPlayer === 'white' ? 'black' : 'white';
    const isCheck = isKingInCheck(newBoard, nextPlayer);
    const isCheckmateState = isCheckmate(newBoard, nextPlayer);
    const isStalemateState = isStalemate(newBoard, nextPlayer);
    
    // If this is a pawn reaching the last rank, defer finalizing until user selects promotion piece
    if (!castling && piece.type === 'pawn' && canPromote(newBoard, to)) {
      // In AI mode, if it's the AI's turn (black), automatically promote to Queen
      const isAIPromoting = gameMode === 'ai' && piece.color === 'black';
      
      if (isAIPromoting) {
        // Automatically select Queen for AI
        const promotionPiece = 'queen';
        const promotedBoard = promotePawn(newBoard, to, promotionPiece);
        const promotedSymbol = 'Q';
        const finalizedNotation = `${notation}=${promotedSymbol}`;
        
        const move: Move = {
          from,
          to,
          piece,
          captured: capturedPiece || undefined,
          notation: finalizedNotation,
          isCastling: false,
          promotionTo: promotionPiece,
          ...(accuracyData && { 
            accuracy: accuracyData.accuracy,
            accuracyClass: accuracyData.accuracyClass
          })
        };
        
        const nextPlayerAfterPromotion = nextPlayer;
        const isCheckAfterPromotion = isKingInCheck(promotedBoard, nextPlayerAfterPromotion);
        const isCheckmateAfterPromotion = isCheckmate(promotedBoard, nextPlayerAfterPromotion);
        const isStalemateAfterPromotion = isStalemate(promotedBoard, nextPlayerAfterPromotion);
        
        const newGameState: GameState & { terminationReason?: string } = {
          board: promotedBoard,
          currentPlayer: nextPlayerAfterPromotion,
          selectedPosition: null,
          legalMoves: [],
          moveHistory: [...currentState.moveHistory, move],
          capturedPieces: newCapturedPieces,
          isCheck: isCheckAfterPromotion,
          isCheckmate: isCheckmateAfterPromotion,
          isStalemate: isStalemateAfterPromotion,
          winner: isCheckmateAfterPromotion ? currentState.currentPlayer : null,
          terminationReason: isCheckmateAfterPromotion ? 'checkmate' : undefined
        };
        
        setGameState(newGameState);
        setRedoMoves([]);
        
        if (timerEnabled && currentState.moveHistory.length === 0) {
          setTimer(prev => ({ ...prev, isActive: true }));
        }
        return;
      }
      
      // For human players, show the dialog
      setPromotion({
        position: to,
        color: piece.color,
        boardAfterMove: newBoard,
        move: {
          from,
          to,
          piece,
          captured: capturedPiece || undefined,
          notation,
          ...(accuracyData && { 
            accuracy: accuracyData.accuracy,
            accuracyClass: accuracyData.accuracyClass
          })
        },
        nextPlayer
      });
      return; // do not emit or update state until promotion is chosen
    }

    const newGameState: GameState & { terminationReason?: string } = {
      board: newBoard, currentPlayer: nextPlayer,
      selectedPosition: null, legalMoves: [],
      moveHistory: [...currentState.moveHistory, move], capturedPieces: newCapturedPieces, isCheck,
      isCheckmate: isCheckmateState, isStalemate: isStalemateState,  winner: isCheckmateState ? currentState.currentPlayer : null,
      terminationReason: isCheckmateState ? 'checkmate' : undefined
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
      
      // If game ended, notify both players with proper results
      if (isCheckmateState || isStalemateState) {
        const winner = isCheckmateState ? currentState.currentPlayer : null;
        const loser = isCheckmateState ? nextPlayer : null;
        
        socket.emit('endGame', { 
          roomId, 
          result: isCheckmateState ? 'checkmate' : 'stalemate',
          winner: winner,
          loser: loser,
          isDraw: isStalemateState,
          endedBy: resolvedColor,
          reason: isCheckmateState ? 'checkmate' : 'stalemate'
        });
      }
      
      // Auto-exit after 5 seconds when game ends locally (AI mode or local detection)
      if (isCheckmateState || isStalemateState) {
        autoExitTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onBackToSetup();
          }
        }, 5000);
      }
    }

    setGameState(newGameState);

    // Clear redo moves when a new move is made (allows piece revision without forcing alt move sequence)
    setRedoMoves([]);

    if (timerEnabled && currentState.moveHistory.length === 0) setTimer(prev => ({ ...prev, isActive: true }));
  };

  const handlePieceDrop = (from: Position, to: Position) => { makeMove(from, to); };
  
  const handlePromotionSelect = (promotionPiece: 'queen' | 'rook' | 'bishop' | 'knight') => {
    if (!promotion) return;
    const promotedBoard = promotePawn(promotion.boardAfterMove, promotion.position, promotionPiece);
    const promotedSymbol = promotionPiece === 'knight' ? 'N' : promotionPiece[0].toUpperCase();
    const finalizedNotation = promotion.move.notation
      ? `${promotion.move.notation}=${promotedSymbol}`
      : `${getMoveNotation(promotedBoard, promotion.move.from, promotion.position)}=${promotedSymbol}`;

    const finalizedMove: Move = {
      ...promotion.move,
      notation: finalizedNotation,
      promotionTo: promotionPiece
    };

    const nextPlayer = promotion.nextPlayer;
    const isCheck = isKingInCheck(promotedBoard, nextPlayer);
    const isCheckmateState = isCheckmate(promotedBoard, nextPlayer);
    const isStalemateState = isStalemate(promotedBoard, nextPlayer);

    setGameState(prev => ({ board: promotedBoard, currentPlayer: nextPlayer, selectedPosition: null, legalMoves: [],
      moveHistory: [...prev.moveHistory, finalizedMove], capturedPieces: prev.capturedPieces,
      isCheck, isCheckmate: isCheckmateState, isStalemate: isStalemateState, winner: isCheckmateState ? (prev.currentPlayer) : null,
      terminationReason: isCheckmateState ? 'checkmate' : undefined }));

    if (gameMode === 'pvp' && roomId) {
      socket.emit('makeMove', { roomId, move: { from: promotion.move.from, to: promotion.position, notation: finalizedNotation } });
      if (isCheckmateState || isStalemateState) {
        const winner = isCheckmateState ? promotion.color : null;
        const loser = isCheckmateState ? nextPlayer : null;
        
        socket.emit('endGame', { 
          roomId, 
          result: isCheckmateState ? 'checkmate' : 'stalemate',
          winner: winner,
          loser: loser,
          isDraw: isStalemateState,
          endedBy: resolvedColor,
          reason: isCheckmateState ? 'checkmate' : 'stalemate'
        });
      }
    }
    
    // Auto-exit after 5 seconds when promotion results in game end
    if (isCheckmateState || isStalemateState) {
      autoExitTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onBackToSetup();
        }
      }, 5000);
    }
    
    // Clear redo moves when promotion move is made (allows piece revision)
    setRedoMoves([]);
    setPromotion(null);
  };
  
  const handleUndo = () => {
    // In AI mode, undo both player's move and AI's response to allow piece selection revision
    // Player can freely choose a different piece without being locked into old AI response sequence
    const movesToUndo = gameMode === 'ai' ? 2 : 1;
    if (gameState.moveHistory.length < movesToUndo) return;
    
    const newHistory = gameState.moveHistory.slice(0, -movesToUndo);
    const undoMoves = gameState.moveHistory.slice(-movesToUndo);
    
    let newBoard = createInitialBoard();
    const newCapturedPieces = { white: [] as Piece[], black: [] as Piece[] };
    
    for (const move of newHistory) {
      const isCastling = move.isCastling ?? isCastlingMove(newBoard, move.from, move.to);
      if (move.captured && move.captured.color !== move.piece.color) newCapturedPieces[move.piece.color].push(move.captured);

      newBoard = isCastling
        ? executeCastling(newBoard, move.from, move.to)
        : simulateMove(newBoard, move.from, move.to);
      if (!isCastling && move.piece.type === 'pawn' && move.promotionTo && ['queen','rook','bishop','knight'].includes(move.promotionTo)) {
        newBoard = promotePawn(newBoard, move.to, move.promotionTo as 'queen' | 'rook' | 'bishop' | 'knight');
      }
    }
    
    // Determine next player based on move history length
    // White always plays on even move counts (0, 2, 4...), Black on odd counts (1, 3, 5...)
    const nextPlayer = newHistory.length % 2 === 0 ? 'white' : 'black';
    const isCheck = isKingInCheck(newBoard, nextPlayer);
    
    setGameState({ board: newBoard, currentPlayer: nextPlayer, selectedPosition: null,
      legalMoves: [], moveHistory: newHistory, capturedPieces: newCapturedPieces, isCheck,
      isCheckmate: false, isStalemate: false, winner: null });

    // Store redo moves for potential replaying in correct order
    // These will be cleared when a new move is made (allowing revision without forced sequence)
    setRedoMoves(undoMoves);
  };

  const handleRedo = () => {
    if (redoMoves.length === 0) return;

    // In AI mode, redo both the player's move and AI's original response together
    const isAIMode = gameMode === 'ai';
    const movesToRedo = isAIMode ? Math.min(2, redoMoves.length) : 1;
    
    let newBoard = gameState.board;
    let newMoveHistory = [...gameState.moveHistory];
    let newCapturedPieces = { white: [...gameState.capturedPieces.white], black: [...gameState.capturedPieces.black] };
    let successfulRedoCount = 0;

    for (let i = 0; i < movesToRedo; i++) {
      if (i >= redoMoves.length) break;
      
      const moveToRedo = redoMoves[i];
      
      // Validate move before applying: check piece exists and belongs to current player
      const piece = newBoard[moveToRedo.from.row]?.[moveToRedo.from.col];
      if (!piece) {
        console.error(`[Redo] Invalid move: no piece at ${moveToRedo.from.row}-${moveToRedo.from.col}`);
        break;
      }
      
      const currentPlayer = newMoveHistory.length % 2 === 0 ? 'white' : 'black';
      if (piece.color !== currentPlayer) {
        console.error(`[Redo] Invalid move: piece color ${piece.color} doesn't match current player ${currentPlayer}`);
        break;
      }
      
      // Validate move is legal for this piece
      const legalMoves = getLegalMoves(newBoard, moveToRedo.from);
      const isLegalMove = legalMoves.some(m => m.row === moveToRedo.to.row && m.col === moveToRedo.to.col);
      if (!isLegalMove) {
        console.error(`[Redo] Invalid move: ${moveToRedo.notation} is not legal on current board`);
        break;
      }
      
      // All validations passed, apply the move
      const isCastling = moveToRedo.isCastling ?? isCastlingMove(newBoard, moveToRedo.from, moveToRedo.to);
      
      newBoard = isCastling
        ? executeCastling(newBoard, moveToRedo.from, moveToRedo.to)
        : simulateMove(newBoard, moveToRedo.from, moveToRedo.to);

      if (!isCastling && moveToRedo.piece.type === 'pawn' && moveToRedo.promotionTo && ['queen','rook','bishop','knight'].includes(moveToRedo.promotionTo)) {
        newBoard = promotePawn(newBoard, moveToRedo.to, moveToRedo.promotionTo as 'queen' | 'rook' | 'bishop' | 'knight');
      }

      if (moveToRedo.captured && moveToRedo.captured.color !== moveToRedo.piece.color) {
        newCapturedPieces[moveToRedo.piece.color].push(moveToRedo.captured);
      }

      newMoveHistory.push(moveToRedo);
      successfulRedoCount++;
    }

    const nextPlayer = newMoveHistory.length % 2 === 0 ? 'white' : 'black';
    const isCheck = isKingInCheck(newBoard, nextPlayer);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPosition: null,
      legalMoves: [],
      moveHistory: newMoveHistory,
      capturedPieces: newCapturedPieces,
      isCheck
    }));
    
    // Only remove successfully applied moves from redo list
    const newRedoMoves = redoMoves.slice(successfulRedoCount);
    setRedoMoves(newRedoMoves);
  };

  const handleFlipBoard = () => { setIsBoardFlipped(!isBoardFlipped); };
  
  const handlePauseGame = () => {
    if (gameMode === 'pvp' && roomId) {
      socket.emit('pauseGame', { roomId }, (response: any) => {
        console.log('[GameScreen] pauseGame callback:', response);
      });
    }
  };

  const handleResumeGame = () => {
    if (gameMode === 'pvp' && roomId) {
      socket.emit('resumeGame', { roomId }, (response: any) => {
        console.log('[GameScreen] resumeGame callback:', response);
      });
    }
  };
  
  const handleResignConfirm = () => {
    const resigningColor = resolvedColor || myColor;
    const winner = resigningColor === 'white' ? 'black' : 'white';
    const loser = resigningColor;
    
    setGameState(prev => ({
      ...prev,
      isCheckmate: true,
      winner: winner,
      terminationReason: 'resignation'
    }));
    
    // Emit resignation to server in multiplayer mode with callback
    if (gameMode === 'pvp' && roomId) {
      socket.emit('endGame', { 
        roomId, 
        result: 'resignation',
        winner: winner,
        loser: loser,
        isDraw: false,
          endedBy: loser,
        reason: 'resignation'
      }, (response: any) => {
        if (response?.success) {
          console.log('[GameScreen] Resignation acknowledged by server');
          setTimeout(() => { onBackToSetup(); }, 2000);
        } else {
          console.error('[GameScreen] Server failed to acknowledge resignation:', response);
          setTimeout(() => { onBackToSetup(); }, 5000);
        }
      });
    } else {
      // For AI mode, just go back
      setTimeout(() => { onBackToSetup(); }, 5000);
    }
    setConfirmDialogOpen(false);
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" p={4} pb={12} sx={{
      backgroundImage: `url(${gameMode === 'ai' ? AI_ModeTheme : PvP_ModeTheme})`,
      backgroundSize: 'cover'
    }}>
      <Box maxWidth="1200px" width="100%">
        {/* Header */}
        <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
          {/* Player Info */}
          {gameMode === 'pvp' && (
            <Box mr={2}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle1" color="white">
                  You are <b>{myName || 'You'}</b> ({myColor})
                </Typography>
                {isRated ? (
                  <Chip
                    label="Rated Game"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 600, letterSpacing: 0.3 }}
                  />
                ) : (
                  <Chip
                    label="Casual Game"
                    size="small"
                    color="info"
                    sx={{ fontWeight: 600, letterSpacing: 0.3 }}
                  />
                )}
              </Stack>
              <Typography variant="subtitle2" color="white">
                Room ID: <b>{roomId}</b> {isHost ? '(Host)' : ''}
              </Typography>
            </Box>
          )}
          {/* Removed the old button group controls */}
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
                  {isPaused && (
                    <Typography color="warning.main" fontWeight={500}>
                      Game Paused by {pausedByName}
                    </Typography>
                  )}
                  {gameState.isCheck && !gameState.isCheckmate && (
                    <Typography color="warning.main" fontWeight={500}>Check!</Typography>
                  )}
                  {gameState.isCheckmate && gameState.terminationReason !== 'resignation' && gameState.terminationReason !== 'timeout' && (
                    <Typography color="success.main" fontWeight={500}>
                      Checkmate! {gameState.winner} wins!
                    </Typography>
                  )}
                  {gameState.terminationReason === 'resignation' && (
                    <Typography color="error.main" fontWeight={500}>
                      {gameState.winner} wins by resignation!
                    </Typography>
                  )}
                  {gameState.terminationReason === 'timeout' && (
                    <Typography color="error.main" fontWeight={500}>
                      {gameState.winner} wins by timeout!
                    </Typography>
                  )}
                  {gameState.isStalemate && (
                    <Typography color="info.main" fontWeight={500}>Stalemate!</Typography>
                  )}
                </Stack>
              </Card>
              {timerEnabled && (
                <Timer whiteTime={timer.white} blackTime={timer.black}
                  currentPlayer={gameState.currentPlayer} isActive={timer.isActive} />
              )}
            </Stack>
          </Grid>
          
          {/* Center - Chess Board */}
          <Grid size={{xs: 12, lg: 6}} order={{ xs: 1, lg: 2 }}>
            <Box display="flex" justifyContent="center">
              <Box position="relative">
                <ChessBoard board={gameState.board} selectedPosition={gameState.selectedPosition}
                  legalMoves={gameState.legalMoves} onSquareClick={handleSquareClick} onPieceDrop={handlePieceDrop}
                  flipped={isBoardFlipped} />
                <PromotionDialog open={!!promotion} color={promotion?.color || 'white'} onSelect={handlePromotionSelect} onClose={() => setPromotion(null)} />
                {isAIThinking && (
                  <Box position="absolute" top={0} left={0} right={0} bottom={0} bgcolor="rgba(0,0,0,0.3)" borderRadius={2}
                    display="flex" alignItems="center" justifyContent="center">
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
              <CapturedPieces whiteCaptured={gameState.capturedPieces.white} blackCaptured={gameState.capturedPieces.black} />
              <MoveHistory moves={gameState.moveHistory} />
              <AccuracyStats moves={gameState.moveHistory} />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Game Controller - Bottom Navigation */}
      <GameController gameMode={gameMode} onUndo={handleUndo} onPlay={handleResumeGame} 
        onPause={handlePauseGame} onRedo={handleRedo} onResign={() => setConfirmDialogOpen(true)} onFlip={handleFlipBoard}
        isPaused={isPaused} canUndo={gameState.moveHistory.length >= (gameMode === 'ai' ? 2 : 1)}
        canRedo={redoMoves.length > 0} />

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Resign Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to resign? This will end the game and your opponent will be declared the winner.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResignConfirm} color="error">Resign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default GameScreen;