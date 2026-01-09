import { Card, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { Trophy } from "lucide-react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const WinningComponent = () => {
    return (
    <Box>
       <Card sx={{ p: 6 }}>
              <Typography variant="h2" sx={{ fontSize: "2rem", mb: 4 }}>How to Win at Chess</Typography>
              <Box sx={{ spaceY: 4 }}>
                <Box sx={{ p: 4, backgroundColor: "#F0FDF4", borderLeft: "4px solid", borderColor: "#22C55E", borderRadius: 1, mb: 4, color:"black" }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Trophy style={{ width: 20, height: 20 }} />
                    Checkmate
                  </Typography>
                  <Typography>The primary way to win: trap your opponent's king so it has no legal moves to escape capture.</Typography>
                </Box>

                <Box sx={{ p: 4, backgroundColor: "#EFF6FF", borderLeft: "4px solid", borderColor: "#3B82F6", borderRadius: 1, mb: 4, color:"black" }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2 }}>Resignation</Typography>
                  <Typography>Your opponent may resign if they believe their position is hopeless. This is common in competitive play.</Typography>
                </Box>

                <Box sx={{ p: 4, backgroundColor: "#F3E8FF", borderLeft: "4px solid", borderColor: "#A855F7", borderRadius: 1, mb: 4, color:"black" }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2 }}>Time Forfeit</Typography>
                  <Typography>In timed games, if your opponent runs out of time on their clock, you win (unless you have insufficient material to checkmate).</Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 6 }}>
              <Typography variant="h2" sx={{ fontSize: "2rem", mb: 4 }}>Basic Checkmate Patterns</Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    Back Rank Mate
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>When a rook or queen delivers checkmate on the opponent's back rank (1st or 8th rank), and the king is trapped by its own pieces (usually pawns).</Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    Queen and King Mate
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>A fundamental endgame: use your queen and king together to force the opponent's king to the edge of the board, then deliver checkmate.</Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    Two Rooks Mate
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>Use two rooks to create a "ladder" that drives the enemy king to the edge of the board. The rooks alternate giving check on adjacent ranks or files.</Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    Scholar's Mate
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>A quick checkmate pattern (as early as move 4) that attacks f7 with the queen and bishop. Easily defended if you know it, but catches beginners off guard.</Typography>
                  </AccordionDetails>
                </Accordion>
            </Card>

            <Card sx={{ p: 6 }}>
              <Typography variant="h2" sx={{ fontSize: "2rem", mb: 4 }}>Winning Strategies</Typography>
              <Box className="grid md:grid-cols-2 gap-4">
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem" }}>Material Advantage</Typography>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Trade pieces when ahead in material</li>
                    <li>Protect your valuable pieces</li>
                    <li>Look for tactics to win material</li>
                    <li>Don't sacrifice without compensation</li>
                  </ul>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem" }}>Positional Advantage</Typography>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Control the center of the board</li>
                    <li>Place pieces on active squares</li>
                    <li>Create weaknesses in opponent's position</li>
                    <li>Coordinate your pieces together</li>
                  </ul>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem" }}>Common Tactics</Typography>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Fork:</strong> Attack two pieces at once</li>
                    <li><strong>Pin:</strong> Prevent a piece from moving</li>
                    <li><strong>Skewer:</strong> Force a valuable piece to move, exposing another</li>
                    <li><strong>Discovered attack:</strong> Move one piece to reveal an attack from another</li>
                  </ul>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem" }}>Opening Principles</Typography>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Control the center (d4, e4, d5, e5)</li>
                    <li>Develop knights before bishops</li>
                    <li>Castle early for king safety</li>
                    <li>Don't move the same piece twice in opening</li>
                  </ul>
                </Box>
              </Box>
            </Card>
        </Box>
    );
};

export default WinningComponent;