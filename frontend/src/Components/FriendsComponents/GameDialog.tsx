// Game Dialog component: Looking at a friend's games recently played
import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Box,
    Chip,
    Typography,
    IconButton,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GameDetails from "../GameDetails";
import { calculateEloChange } from "../../Utils/eloCalculator";
import { useTheme } from "../../Context/ThemeContext";

interface GameDialogProps {
    open: boolean;
    onClose: () => void;
    friendName: string;
    games: {
        id?: string;
        _id?: string;
        result?: 'win' | 'loss' | 'draw';
        date?: string;
        opponent?: string;
        opponentRating?: number;
        myRating?: number;
        timeControl?: number;
        moves?: number;
        duration?: number;
        termination?: string;
        myAccuracy?: number;
        opponentAccuracy?: number;
        playerColor?: 'white' | 'black';
        ratingChange?: number;
    }[];
    loading?: boolean;
    error?: string | null;
}

const GameDialog: React.FC<GameDialogProps> = ({ open, onClose, friendName, games, loading, error }) => {
    const recentGames = games || [];
    const [selectedGame, setSelectedGame] = React.useState<typeof recentGames[number] | null>(null);
    const { isDark } = useTheme();

    // Debug: Log games to see what data we're receiving
    React.useEffect(() => {
        if (recentGames.length > 0) {
            console.log('Game data:', recentGames[0]);
            console.log('playerColor field:', recentGames[0].playerColor);
        }
    }, [recentGames]);

    const getResultColor = (result?: string) => {
        switch (result?.toLowerCase()) {
            case 'win': return '#22c55e';
            case 'loss': return '#ef4444';
            case 'draw': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getResultIcon = (result?: string) => {
        switch (result?.toLowerCase()) {
            case 'win': return <CheckIcon fontSize="small" />;
            case 'loss': return <CloseIcon fontSize="small" />;
            case 'draw': return '½';
            default: return '';
        }
    };

    const formatTimeControl = (timeControl?: number) => {
        if (!timeControl) return 'N/A';
        const minutes = Math.floor(timeControl / 60);
        const increment = timeControl % 60;
        return `${minutes}+${increment}`;
    };

    const formatRatingChange = (change?: number) => {
        if (change === undefined || change === null) return null;
        return change > 0 ? `+${change}` : `${change}`;
    };

    const getDisplayRatingChange = (game: typeof recentGames[number]) => {
        if (game.ratingChange !== undefined && game.ratingChange !== null && game.ratingChange !== 0) {
            return game.ratingChange;
        }

        if (game.myRating === undefined || game.opponentRating === undefined || !game.result) {
            return game.ratingChange ?? null;
        }

        const score = game.result === 'win' ? 1 : game.result === 'loss' ? 0 : 0.5;
        return calculateEloChange(game.myRating, game.opponentRating, score);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Games with {friendName}</Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, bgcolor: isDark ? 'grey.900' : 'grey.50' }}>
                    {loading ? (
                        <Box p={3}>
                            <Typography>Loading games...</Typography>
                        </Box>
                    ) : error ? (
                        <Box p={3}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    ) : recentGames.length === 0 ? (
                        <Box p={3}>
                            <Typography>No recent games available.</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {recentGames.map((game, index) => (
                                <Box
                                    key={game.id || game._id || index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        borderBottom: index < recentGames.length - 1 ? '1px solid #e5e7eb' : 'none',
                                        '&:hover': { bgcolor: isDark ? 'grey.800' : '#f9fafb' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                        {/* Result Badge */}
                                        <Chip
                                            label={game.result?.charAt(0).toUpperCase() + (game.result?.slice(1) || '')}
                                            sx={{
                                                bgcolor: getResultColor(game.result),
                                                color: 'white',
                                                fontWeight: 600,
                                                minWidth: 60,
                                            }}
                                            size="small"
                                        />

                                        {/* Color Badge */}
                                        <Chip
                                            label={game.playerColor || 'unknown'}
                                            sx={{
                                                bgcolor: game.playerColor === 'white' ? '#f3f4f6' : '#1f2937',
                                                color: game.playerColor === 'white' ? '#1f2937' : '#f3f4f6',
                                                minWidth: 60,
                                            }}
                                            size="small"
                                        />

                                        {/* Time Control */}
                                        <Chip
                                            label={formatTimeControl(game.timeControl)}
                                            variant="outlined"
                                            size="small"
                                            icon={<span>⏱</span>}
                                        />
                                    </Box>

                                    {/* Game Info */}
                                    <Box sx={{ flex: 2, px: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {game.date ? new Date(game.date).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                            }) : 'Unknown date'} • {game.moves || 0} moves {(() => {
                                                const ratingChange = getDisplayRatingChange(game);
                                                const formattedRatingChange = formatRatingChange(ratingChange ?? undefined);

                                                if (!formattedRatingChange) {
                                                    return null;
                                                }

                                                const ratingColor = ratingChange === 0
                                                    ? '#6b7280'
                                                    : (ratingChange || 0) > 0
                                                        ? '#22c55e'
                                                        : '#ef4444';

                                                return (
                                                    <span style={{
                                                        color: ratingColor,
                                                        fontWeight: 600
                                                    }}>
                                                        {' '}{formattedRatingChange}
                                                    </span>
                                                );
                                            })()}
                                        </Typography>
                                    </Box>

                                    {/* Result Icon and View Button */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 32,
                                                height: 32,
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {getResultIcon(game.result)}
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => setSelectedGame(game)}
                                        >
                                            View
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <GameDetails
                open={!!selectedGame}
                onClose={() => setSelectedGame(null)}
                gameDetails={selectedGame}
            />
        </>
    );
};

export default GameDialog;