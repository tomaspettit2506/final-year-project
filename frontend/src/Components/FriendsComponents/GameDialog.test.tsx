import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import GameDialog from './GameDialog';

const mockGames = [
  {
    _id: 'game-1',
    result: 'win' as const,
    date: '2024-01-01',
  },
  {
    _id: 'game-2',
    result: 'loss' as const,
    date: '2024-01-02',
  }
];

describe('GameDialog Component', () => {
  test('renders GameDialog when open', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    expect(screen.getByText(/John Doe's Recent Games/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <GameDialog
        open={false}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    expect(screen.queryByText(/John Doe's Recent Games/i)).not.toBeInTheDocument();
  });

  test('displays game history', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    expect(screen.getByText(/win/i)).toBeInTheDocument();
    expect(screen.getByText(/loss/i)).toBeInTheDocument();
  });

  test('displays game results', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    expect(screen.getByText(/Result: win/i)).toBeInTheDocument();
    expect(screen.getByText(/Result: loss/i)).toBeInTheDocument();
  });

  test('displays empty state when no games', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={[]}
        loading={false}
      />
    );
    
    expect(screen.getByText(/no recent games available/i)).toBeInTheDocument();
  });

  test('shows loading state when loading is true', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={true}
      />
    );
    
    expect(screen.getByText(/loading games/i)).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    
    render(
      <GameDialog
        open={true}
        onClose={mockOnClose}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays error message when error is provided', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={[]}
        loading={false}
        error="Failed to load games"
      />
    );
    
    expect(screen.getByText(/Failed to load games/i)).toBeInTheDocument();
  });

  test('displays game dates', () => {
    render(
      <GameDialog
        open={true}
        onClose={vi.fn()}
        friendName="John Doe"
        games={mockGames}
        loading={false}
      />
    );
    
    expect(screen.getByText(/Date:/i)).toBeInTheDocument();
  });
});
