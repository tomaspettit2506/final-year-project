import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";

interface LoadingProps {
    message?: string;
    isLoggingOut?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message, isLoggingOut = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const normalizedMessage = message?.trim().toLowerCase();
    const shouldShowLogoutMessage = isLoggingOut || normalizedMessage === "logout" || normalizedMessage === "logging out";
    const loadingMessage = shouldShowLogoutMessage
        ? "Logging out..."
        : message
            ? `Navigating to ${message}...`
            : `Guardians\nof the\nChess Grandmaster`;

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                flexDirection: "column",
                gap: 3,
                px: 2
            }}
        >
            <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{
                    color: "#ffffff",
                    textAlign: "center",
                    fontFamily: 'Audiowide, sans-serif',
                    whiteSpace: "pre-line",
                    textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                    mt: 50
                }}
            >
                {loadingMessage}
            </Typography>
            <CircularProgress sx={{ color: "#ffffff" }} />
        </Box>
    );
};

export default Loading;
