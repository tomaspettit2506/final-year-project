import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameScreen from './GameScreen';
import { AuthContext } from '../../Context/AuthContext';

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
  logout: vi.fn(),
  } as any;

describe('GameScreen Component', () => {
  test('renders GameScreen component', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <GameScreen
              gameMode="ai"
              difficulty={750}
            difficultyName="Medium"
            timerEnabled={true}
            timerDuration={300}
            onBackToSetup={vi.fn()}
          />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/game status/i)).toBeInTheDocument();
  });

  test('displays game mode and difficulty', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <GameScreen
              gameMode="ai"
              difficulty={750}
            difficultyName="Medium"
            timerEnabled={true}
            timerDuration={300}
            onBackToSetup={vi.fn()}
          />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/vs ai \(medium\)/i)).toBeInTheDocument();
  });

  test('displays timer when enabled', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <GameScreen
              gameMode="ai"
              difficulty={750}
            difficultyName="Medium"
            timerEnabled={true}
            timerDuration={300}
            onBackToSetup={vi.fn()}
          />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/game timer/i)).toBeInTheDocument();
    expect(screen.getAllByText('5:00')).toHaveLength(2);
   });

  test('does not display timer when disabled', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <GameScreen
              gameMode="ai"
              difficulty={750}
            difficultyName="Medium"
            timerEnabled={false}
            timerDuration={300}
            onBackToSetup={vi.fn()}
          />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByText(/timer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/5:00/i)).not.toBeInTheDocument();
    });
});