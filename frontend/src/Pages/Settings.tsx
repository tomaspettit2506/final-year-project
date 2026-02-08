import React, { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../Context/ThemeContext";
import { useBoardTheme } from "../Context/BoardThemeContext";
import { Box, Button, Card, CardContent, Typography, Divider, Snackbar, Alert, Dialog, DialogActions, 
  DialogContent, DialogContentText,DialogTitle, Select, MenuItem, FormControl, FormLabel, 
  CircularProgress } from "@mui/material";
import InstallPWA from "../Components/InstallPWA";
import GridOnIcon from '@mui/icons-material/GridOn';
import AppBar from "../Components/AppBar";
import SettingsLight from "../assets/SettingsLight.jpeg";
import SettingsDark from "../assets/SettingsDark.jpeg";

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Appearance settings with state
  const { boardTheme, setBoardTheme, pieceSet, setPieceSet } = useBoardTheme();

  // Function to clear cache (only Cache API, not auth storage)
  const clearCache = async () => {
    setIsClearing(true);
    try {
      // Clear caches using Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      setSnackbarMessage("Cache cleared successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      setSnackbarMessage("Failed to clear cache");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      
      return false;
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearCacheConfirmed = async () => {
    setConfirmDialogOpen(false);
    const success = await clearCache();
    if (success) {
      // Only logout and redirect if cache was cleared successfully
      await logout();
      navigate("/", { replace: true });
    }
  };

  // Handle appearance changes
  const handleBoardThemeChange = (theme: string) => {
    setBoardTheme(theme as "classic" | "modern" | "wooden");
  };

  const handlePieceSetChange = (set: string) => {
    setPieceSet(set as "standard" | "fancy" | "minimal");
  };

  return (
    <>
    <AppBar title="Settings" isBackButton={true} isSettings={false} isExit={true}/>
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", p: 2,
      backgroundImage: `url(${isDark ? SettingsDark : SettingsLight})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
     }}>
      <Card sx={{ 
        width: "100%",
        maxWidth: "450px", 
        padding: 3, 
        textAlign: "center", 
        boxShadow: 3,
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        bgcolor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      }}>
        <CardContent>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            Manage your account settings.
          </Typography>

          {/* Cache Management Section */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: 'divider',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Cache Management
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              If you're experiencing issues with outdated content, clearing the cache may help.
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={isClearing ? <CircularProgress size={20} /> : "🔄️"}
              onClick={() => setConfirmDialogOpen(true)} 
              disabled={isClearing}
              fullWidth
              sx={{ borderRadius: 2, mb: 2 }}
            >
              Clear Cache & Reload
            </Button>
          </Box>

          {/* PWA Install Section */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: 'divider',
            mb: 3
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Install App
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              Install GOTCG on your device for a better experience and offline access.
            </Typography>
            <InstallPWA />
          </Box>

          {/* Appearance Section */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.05)',
            border: 1,
            borderColor: 'divider',
            mb: 3,
            textAlign: 'left'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              🎨 Appearance
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
              Customize the look and feel of the application.
            </Typography>

            {/* Board Theme */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.primary' }}>
                Board Theme
              </FormLabel>
              <Select 
                value={boardTheme}
                onChange={(e) => handleBoardThemeChange(e.target.value)}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="classic">
                  🎨
                  Classic
                </MenuItem>
                <MenuItem value="modern">
                  <GridOnIcon sx={{ color: "#1976d2", mr: 1 }} />
                  Modern
                </MenuItem>
                <MenuItem value="wooden">
                  🪵
                  Wooden
                </MenuItem>
                <MenuItem value="dark">
                  🌑
                  Dark
                </MenuItem>
              </Select>
            </FormControl>

            {/* Piece Set */}
            <FormControl fullWidth>
              <FormLabel sx={{ mb: 1, fontSize: '0.875rem', color: 'text.primary' }}>
                Piece Set
              </FormLabel>
              <Select 
                value={pieceSet}
                onChange={(e) => handlePieceSetChange(e.target.value)}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="standard">
                  🏆
                  Standard
                </MenuItem>
                <MenuItem value="fancy">
                  ⭐
                  Fancy
                </MenuItem>
                <MenuItem value="minimal">
                  ⚫
                  Minimal
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog for Cache Clearing */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          ⚠️
          <Typography fontWeight="bold">Warning: This Will Log You Out</Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Clearing the cache will remove all stored data and log you out of the application. 
            You will need to log in again after this action.
            <br /><br />
            Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearCacheConfirmed}
            variant="contained"
            color="warning"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear Cache & Log Out'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

export default Settings;