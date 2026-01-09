import { Card, Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";

const RulesComponent = () => {
  return (
    <Box>
      <Card sx={{ p: 6 }}>
              <Typography sx={{ fontSize: "2rem", mb: 4 }}>Essential Rules</Typography>
                <Accordion defaultExpanded>
                  <AccordionSummary>Check and Checkmate</AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ spaceY: 2 }}>
                      <p><strong>Check:</strong> When your king is under attack, you are in check. You must immediately:</p>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Move the king to a safe square</li>
                        <li>Block the attack with another piece</li>
                        <li>Capture the attacking piece</li>
                      </ul>
                      <Typography sx={{ mt: 4 }}><strong>Checkmate:</strong> When your king is in check and has no legal way to escape, you are checkmated and lose the game.</Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary>Castling</AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ spaceY: 2 }}>
                      <Typography>A special move involving the king and rook that helps protect your king.</Typography>
                      <Typography><strong>Requirements:</strong></Typography>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Neither the king nor the rook has moved before</li>
                        <li>No pieces between the king and rook</li>
                        <li>King is not in check</li>
                        <li>King doesn't pass through or land on a square under attack</li>
                      </ul>
                      <Typography sx={{ mt: 4 }}><strong>How to castle:</strong> Move king two squares toward the rook, then place the rook on the square the king crossed.</Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary>En Passant</AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ spaceY: 2 }}>
                      <Typography>A special pawn capture that can occur when an opponent's pawn moves two squares forward from its starting position and lands beside your pawn.</Typography>
                      <Typography>You can capture it as if it had only moved one square, but you must do so immediately on the next move or lose the opportunity.</Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary>Pawn Promotion</AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ spaceY: 2 }}>
                      <Typography>When a pawn reaches the opposite end of the board (8th rank for white, 1st rank for black), it must be promoted to:</Typography>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Queen (most common choice)</li>
                        <li>Rook</li>
                        <li>Bishop</li>
                        <li>Knight</li>
                      </ul>
                      <Typography sx={{ mt: 2 }}>You cannot promote to a king or keep it as a pawn.</Typography>
                    </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary>Touch-Move Rule</AccordionSummary>
                <AccordionDetails>
                  <Typography>In formal games, if you touch a piece, you must move it (if you can legally do so). If you touch an opponent's piece, you must capture it (if you can legally do so).</Typography>
                </AccordionDetails>
              </Accordion>
            </Card>

            <Card className="p-6">
              <Typography variant="h2" sx={{ fontSize: "1.875rem", mb: 4 }}>Game Phases</Typography>
              <Box sx={{ display: "grid", md: { gridTemplateColumns: "repeat(3, 1fr)" }, gap: 4 }}>
                <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2 }}>Opening</Typography>
                  <Typography className="text-sm">The first 10-15 moves. Focus on:</Typography>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Controlling the center</li>
                    <li>Developing pieces</li>
                    <li>King safety (castling)</li>
                  </ul>
                </Box>
                <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2 }}>Middlegame</Typography>
                  <Typography className="text-sm">The tactical and strategic heart of the game:</Typography>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Attack and defend</li>
                    <li>Create threats</li>
                    <li>Improve piece positions</li>
                  </ul>
                </Box>
                <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: "1.25rem", mb: 2 }}>Endgame</Typography>
                  <Typography className="text-sm">Few pieces remain on the board:</Typography>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>King becomes active</li>
                    <li>Pawn promotion crucial</li>
                    <li>Precise calculation needed</li>
                  </ul>
                </Box>
              </Box>
            </Card>
    </Box>
  );
};

export default RulesComponent;