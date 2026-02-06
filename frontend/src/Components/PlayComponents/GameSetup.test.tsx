import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameSetup from './GameSetup';
import { AuthContext } from '../../Context/AuthContext';
import { ThemeProvider as AppThemeProvider } from '../../Context/ThemeContext';

{/* const GameSetup = ({ onStartGame, onRoomJoined }: GameSetupProps) => { */}

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: false,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  phoneNumber: null,
  photoURL: null,
  refreshToken: '',
  tenantId: null,
  toJSON: () => ({})
} as any;

const mockAuthContext = {
  user: mockUser,
  userData: { rating: 1200, name: 'Test User' },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn()
};

describe('GameSetup Component', () => {
  test('renders GameSetup component', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AppThemeProvider>
            <GameSetup onStartGame={vi.fn()} onRoomJoined={vi.fn()} />
          </AppThemeProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/game setup/i)).toBeInTheDocument();
  });

  test('allows user to select game mode and start game', async () => {
    const mockOnStartGame = vi.fn();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <AppThemeProvider>
            <GameSetup onStartGame={mockOnStartGame} onRoomJoined={vi.fn()} />
          </AppThemeProvider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText(/play against ai/i));
    fireEvent.click(screen.getByText(/start game/i));
    
    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalledWith({
        gameMode: 'ai',
        difficulty: 750,
        difficultyName: 'Medium',
        timerEnabled: true,
        timerDuration: 600
      });
    });
  });
});