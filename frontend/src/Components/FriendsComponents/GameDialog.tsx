// Game Dialog component: Looking at a friend's games recently played
import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";

interface GameDialogProps {
    open: boolean;
    onClose: () => void;
    friendName: string;
    games: { id?: string; _id?: string; result?: string; date?: string }[];
    loading?: boolean;
    error?: string | null;
}
// GET User's recent games and display them backend/api/user/:id/games
const GameDialog: React.FC<GameDialogProps> = ({ open, onClose, friendName, games, loading, error }) => {
    const recentGames = games || [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{friendName}'s Recent Games</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <p>Loading games...</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>{error}</p>
                ) : recentGames.length === 0 ? (
                    <p>No recent games available.</p>
                ) : (
                    <List>
                        {recentGames.map((game) => (
                            <ListItem key={game.id || game._id}>
                                <ListItemText
                                    primary={`Result: ${game.result || 'N/A'}`}
                                    secondary={`Date: ${game.date ? new Date(game.date).toLocaleDateString() : 'Unknown'}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GameDialog;