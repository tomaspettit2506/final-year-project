import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createTheme, type Theme } from '@mui/material/styles';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: Theme; // <-- Add theme here
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Create MUI theme based on isDark
  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#5500aa',
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};