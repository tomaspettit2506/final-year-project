import { Box, Card, Typography, useTheme as useMuiTheme, useMediaQuery } from "@mui/material";
import { useTheme as useAppTheme } from "../../Context/ThemeContext";

const BasicComponent = () => {
    const { isDark } = useAppTheme();
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    
    return (
        <Card sx={{ 
            p: isMobile ? 3 : 6, 
            boxShadow: 3, 
            borderRadius: 5, 
            bgcolor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
            maxWidth: '100%', 
            margin: '0 auto',
            width: isMobile ? '100%' : 800
        }}>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              What is Chess♟️?
            </Typography>
            <Typography variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Chess is a strategic board game played between two players on an 8x8 checkered board. 
              It's one of the world's most popular games, combining tactics, strategy, and calculation.
            </Typography>
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: isMobile ? 2 : 3, 
                mt: 3
            }}>
              <Card variant="outlined" sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  🎲 Game Setup
                </Typography>
                <ul style={{ marginLeft: isMobile ? '1.2rem' : '1.5rem', paddingLeft: 0 }}>
                  <li>64 squares (32 light, 32 dark)</li>
                  <li>16 pieces per player (White and Black)</li>
                  <li>White always moves first</li>
                  <li>Bottom-right square must be light colored</li>
                </ul>
              </Card>
              <Card variant="outlined" sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  🎯 Objective
                </Typography>
                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                  The goal is to checkmate your opponent's king. This means the king is under attack 
                  and has no legal move to escape capture.
                </Typography>
              </Card>
            </Box>
          </Card>
    )
};

export default BasicComponent;