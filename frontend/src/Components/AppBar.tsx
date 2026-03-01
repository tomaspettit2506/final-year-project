import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Tooltip } from '@mui/material';
import { useTheme } from '../Context/ThemeContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SpaceTheme from '../assets/img-theme/space_theme.jpg';

interface AppBarComponentProps {
    title?: string;
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
        <AppBar position="static" sx={{ backgroundImage: `url(${SpaceTheme})`, backgroundSize: 'cover' }}>
            <Toolbar>
                {isBackButton && (
                    <IconButton color="inherit" onClick={() => navigate(-1)} className="icon-button">
                        ⬅️
                    </IconButton>
                )}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
                            🚪
                        </IconButton>
                    </Tooltip>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default AppBarComponent;