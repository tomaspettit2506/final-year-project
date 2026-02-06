import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameInvites from './GameInvites';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockInvites = [
  {
    id: 'invite-1',
    fromUserId: 'user-1',
    fromUserName: 'John Doe',
    fromUserAvatar: 'https://example.com/avatar1.jpg',
    fromUserRating: 1200,
    roomId: 'room-123',
    timeControl: '10',
    rated: true,
    createdAt: '2024-01-01T12:00:00Z'
  },
  {
    id: 'invite-2',
    fromUserId: 'user-2',
    fromUserName: 'Jane Smith',
    roomId: 'room-456',
    timeControl: '5',
    rated: false,
    createdAt: '2024-01-01T13:00:00Z'
  }
];

describe('GameInvites Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders GameInvites component', () => {
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={vi.fn()} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays empty state when no invites', () => {
    render(
      <BrowserRouter>
        <GameInvites invites={[]} onAccept={vi.fn()} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/no game invites/i)).toBeInTheDocument();
  });

  test('displays time control and rated status', () => {
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={vi.fn()} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/10 mins • Rated/i)).toBeInTheDocument();
    expect(screen.getByText(/5 mins • Casual/i)).toBeInTheDocument();
  });

  test('calls onAccept and navigates when accept button is clicked', () => {
    const mockOnAccept = vi.fn();
    
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={mockOnAccept} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    fireEvent.click(acceptButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/play?roomId=room-123&autoJoin=true&isRated=true');
    expect(mockOnAccept).toHaveBeenCalledWith(mockInvites[0]);
  });

  test('calls onDecline when decline button is clicked', () => {
    const mockOnDecline = vi.fn();
    
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={vi.fn()} onDecline={mockOnDecline} />
      </BrowserRouter>
    );
    
    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    fireEvent.click(declineButtons[0]);
    
    expect(mockOnDecline).toHaveBeenCalledWith('invite-1');
  });

  test('displays user rating when available', () => {
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={vi.fn()} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('1200')).toBeInTheDocument();
  });

  test('displays creation timestamp', () => {
    render(
      <BrowserRouter>
        <GameInvites invites={mockInvites} onAccept={vi.fn()} onDecline={vi.fn()} />
      </BrowserRouter>
    );
    
    const dateElements = screen.getAllByText(/📅/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
