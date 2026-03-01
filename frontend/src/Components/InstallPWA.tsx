import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import GetAppIcon from '@mui/icons-material/GetApp';
import { useTheme as useAppTheme } from "../Context/ThemeContext";

const InstallPWA: React.FC = () => {
  const [open, setOpen] = useState(false);
  const isDark = useAppTheme();

  const handleInstallClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button 
        variant="contained" 
        startIcon={<GetAppIcon />}
        onClick={handleInstallClick} 
        sx={{ 
          width: "100%",
          bgcolor: isDark ? "#110b16" : "#ffffff",
          '&:hover': { bgcolor: isDark ? "#ffffffa1" : "#3c3741", color: isDark ? "#3c3741" : "#ffffffa1" },
          borderRadius: '8px',
          fontWeight: 500,
        }}
      >
        Install App
      </Button>
      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: isDark ? "#110b16" : "#ffffff",
            color: isDark ? "#fff" : "#000000",
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: isDark ? "#fff" : "#000000" }}>📲 How to Install GOTCG</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: isDark ? "#fff" : "#000000" }}>
            🔹 <strong>Chrome (Android & Desktop):</strong><br />
            &nbsp;&nbsp;&nbsp;- Tap the three dots (⋮) in the top-right<br />
            &nbsp;&nbsp;&nbsp;- Select 'Install App'<br /><br />
            🔹 <strong>Safari (iPhone & iPad):</strong><br />
            &nbsp;&nbsp;&nbsp;- Tap the Share button (⬆️)<br />
            &nbsp;&nbsp;&nbsp;- Select 'Add to Home Screen'<br /><br />
            🔹 <strong>Firefox & Other Browsers:</strong><br />
            &nbsp;&nbsp;&nbsp;- Open the browser menu<br />
            &nbsp;&nbsp;&nbsp;- Look for 'Add to Home Screen' or 'Install' option<br /><br />
            ✨ Enjoy your PWA experience!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} 
            sx={{ 
              color: isDark ? "#a861f0" : "#a861f0",
              fontWeight: 500
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InstallPWA;