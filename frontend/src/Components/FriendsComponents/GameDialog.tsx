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
        timeControl?: number;
        moves?: number;
        duration?: number;
        termination?: string;
        myAccuracy?: number;
        opponentAccuracy?: number;
        playerColor?: 'white' | 'black';
        opening?: string;
        ratingChange?: number;
    }[];
    loading?: boolean;
    error?: string | null;
}

const GameDialog: React.FC<GameDialogProps> = ({ open, onClose, friendName, games, loading, error }) => {
    const recentGames = games || [];
    const [selectedGame, setSelectedGame] = React.useState<typeof recentGames[number] | null>(null);

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
                <DialogContent dividers sx={{ p: 0 }}>
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
                                        '&:hover': { bgcolor: '#f9fafb' },
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
                                        <Typography variant="body2" fontWeight={500}>
                                            {game.opening || 'Unknown Opening'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {game.date ? new Date(game.date).toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                            }) : 'Unknown date'} • {game.moves || 0} moves {formatRatingChange(game.ratingChange) && (
                                                <span style={{ 
                                                    color: (game.ratingChange || 0) > 0 ? '#22c55e' : '#ef4444',
                                                    fontWeight: 600
                                                }}>
                                                    {' '}{formatRatingChange(game.ratingChange)}
                                                </span>
                                            )}
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