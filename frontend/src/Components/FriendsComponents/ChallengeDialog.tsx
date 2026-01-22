import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Button, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { SelectChangeEvent } from "@mui/material/Select";

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  onChallenge: (timeControl: string, rated: boolean) => Promise<string>;
}

const ChallengeDialog: React.FC<ChallengeDialogProps> = ({ open, onOpenChange, friendName, onChallenge }) => {
  const [timeControl, setTimeControl] = useState("10");
  const [rated, setRated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChallenge = async () => {
    setLoading(true);
    setError("");
    try {
      await onChallenge(timeControl, rated);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to send challenge");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (e: SelectChangeEvent<string>) => {
    setTimeControl(e.target.value);
  };

  const handleGameTypeChange = (e: SelectChangeEvent<string>) => {
    setRated(e.target.value === "rated");
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ py: 2 }}>
        <DialogTitle>Challenge {friendName}</DialogTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your game settings and send an invite with your room ID
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="grid" gap={2} py={1}>
          <FormControl fullWidth size="small" disabled={loading}>
            <InputLabel id="time-control-label">
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon fontSize="small" /> Time Control
              </Box>
            </InputLabel>
            <Select
              labelId="time-control-label"
              id="time-control"
              value={timeControl}
              label="Time Control"
              onChange={handleTimeChange}
            >
              <MenuItem value="10">10 mins</MenuItem>
              <MenuItem value="30">30 mins</MenuItem>
              <MenuItem value="60">60 mins</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={loading}>
            <InputLabel id="game-type-label">
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <EmojiEventsIcon fontSize="small" /> Game Type
              </Box>
            </InputLabel>
            <Select
              labelId="game-type-label"
              id="game-type"
              value={rated ? "rated" : "casual"}
              label="Game Type"
              onChange={handleGameTypeChange}
            >
              <MenuItem value="rated">Rated</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleChallenge}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? "Sending..." : "Send Challenge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChallengeDialog;
