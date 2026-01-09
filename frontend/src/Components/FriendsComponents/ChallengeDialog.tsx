import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography,
    Box, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { SelectChangeEvent } from "@mui/material/Select";

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  onChallenge: (timeControl: string, rated: boolean) => void;
}

const ChallengeDialog: React.FC<ChallengeDialogProps> = ({ open, onOpenChange, friendName, onChallenge }) => {
  const [timeControl, setTimeControl] = useState("10");
  const [rated, setRated] = useState(true);

  const handleChallenge = () => {
    onChallenge(timeControl, rated);
    onOpenChange(false);
  };

  const handleTimeChange = (e: SelectChangeEvent<string>) => {
    setTimeControl(e.target.value);
  };

  const handleGameTypeChange = (e: SelectChangeEvent<string>) => {
    setRated(e.target.value === "rated");
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="xs" fullWidth>
      <DialogContent sx={{ py: 2 }}>
        <DialogTitle>Challenge {friendName}</DialogTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your game settings and send a challenge
        </Typography>

        <Box display="grid" gap={2} py={1}>
          <FormControl fullWidth size="small">
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

          <FormControl fullWidth size="small">
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
        <Button variant="outlined" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleChallenge}>Send Challenge</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChallengeDialog;
