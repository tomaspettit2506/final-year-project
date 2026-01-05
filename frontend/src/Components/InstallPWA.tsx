import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import GetAppIcon from '@mui/icons-material/GetApp';

const InstallPWA: React.FC = () => {
  const [open, setOpen] = useState(false);

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
          bgcolor: "#5500aa",
          '&:hover': { bgcolor: "#7722cc" },
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
            borderRadius: '12px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ color: "#5500aa", fontWeight: "bold" }}>📲 How to Install GOTCG</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#333" }}>
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
              color: "#5500aa",
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