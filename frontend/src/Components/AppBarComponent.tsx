import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
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
        <AppBar position="static" sx={{ bgcolor: isDark ? '#bebeffb6' : '#bebeff', color: isDark ? '#FFFFFF' : '#000000' }}>
            <Toolbar>
                {isBackButton && (
                    <IconButton color="inherit" onClick={() => navigate(-1)} className="icon-button">
                        ⬅️
                    </IconButton>
                )}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: isDark ? 'black' : 'text.primary', fontFamily: 'Times New Roman' }}>
                    {title}
                </Typography>
                <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton color="inherit" onClick={toggleTheme} className="icon-button">
                        {isDark ? "☀️" : "🌙"}
                    </IconButton>
                </Tooltip>
                {isSettings && (
                    <Tooltip title="Settings">
                        <IconButton color="inherit" onClick={() => navigate("/settings")} className="icon-button">
                            ⚙️
                        </IconButton>
                    </Tooltip>
                )}
                {isExit && (
                    <Tooltip title="Logout">
                        <IconButton color="inherit" onClick={handleLogout} className="icon-button">
                            <ExitToAppIcon sx={{ color: isDark ? 'black' : 'white' }}/> ⬅️
                        </IconButton>
                    </Tooltip>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default AppBarComponent;