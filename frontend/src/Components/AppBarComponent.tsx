import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Sun, Moon } from "lucide-react";
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';

interface AppBarComponentProps {
    title: string;
    isBackButton?: boolean;
    isSettings?: boolean;
    isExit?: boolean;
}

const AppBarComponent: React.FC<AppBarComponentProps> = ({ title, isBackButton, isSettings, isExit }) => {
    const { isDark, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AppBar position="static" sx={{ bgcolor: "primary.main", color: '#000000' }}>
            <Toolbar>
                {isBackButton && (
                    <IconButton color="inherit" onClick={() => navigate(-1)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                    {title}
                </Typography>
                <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton color="inherit" onClick={toggleTheme}>
                        {isDark ? <Sun /> : <Moon />}
                    </IconButton>
                </Tooltip>
                {isSettings && (
                    <Tooltip title="Settings">
                        <IconButton color="inherit" onClick={() => navigate("/settings")}>
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {isExit && (
                    <Tooltip title="Logout">
                        <IconButton color="inherit" onClick={handleLogout}>
                            <ExitToAppIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default AppBarComponent;