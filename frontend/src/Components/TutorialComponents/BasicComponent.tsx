import { Box, Card, Typography } from "@mui/material";

const BasicComponent = () => {
    return (
        <Card sx={{ p: 6 }}>
              <Typography variant="h5" gutterBottom>
                What is Chess?
              </Typography>
              <Typography>
                Chess is a strategic board game played between two players on an 8x8 checkered board. 
                It's one of the world's most popular games, combining tactics, strategy, and calculation.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Game Setup
                  </Typography>
                  <ul style={{ marginLeft: 16 }}>
                    <li>64 squares (32 light, 32 dark)</li>
                    <li>16 pieces per player (White and Black)</li>
                    <li>White always moves first</li>
                    <li>Bottom-right square must be light colored</li>
                  </ul>
                </Card>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Objective
                  </Typography>
                  <Typography>
                    The goal is to checkmate your opponent's king. This means the king is under attack 
                    and has no legal move to escape capture.
                  </Typography>
                </Card>
              </Box>
            </Card>
    )
}
export default BasicComponent;