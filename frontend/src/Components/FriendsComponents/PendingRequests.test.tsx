import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PendingRequests from './PendingRequests';

const mockRequests = [
  {
    id: 'request-1',
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://example.com/avatar1.jpg',
    rating: 1200,
    online: true,
    receivedAt: '2 hours ago'
  },
  {
    id: 'request-2',
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: 'https://example.com/avatar2.jpg',
    rating: 1350,
    online: false,
    receivedAt: '1 day ago'
  }
];

describe('PendingRequests Component', () => {
  test('renders PendingRequests component', () => {
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays empty state when no pending requests', () => {
    render(
      <PendingRequests requests={[]} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    expect(screen.getByText(/no pending friend requests/i)).toBeInTheDocument();
  });

  test('displays user information correctly', () => {
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    expect(screen.getByText('@johndoe • 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('@janesmith • 1 day ago')).toBeInTheDocument();
  });

  test('displays user ratings', () => {
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('1350')).toBeInTheDocument();
  });

  test('calls onAccept when accept button is clicked', () => {
    const mockOnAccept = vi.fn();
    
    render(
      <PendingRequests requests={mockRequests} onAccept={mockOnAccept} onDecline={vi.fn()} />
    );
    
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    fireEvent.click(acceptButtons[0]);
    
    expect(mockOnAccept).toHaveBeenCalledWith('request-1');
  });

  test('calls onDecline when decline button is clicked', () => {
    const mockOnDecline = vi.fn();
    
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={mockOnDecline} />
    );
    
    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    fireEvent.click(declineButtons[0]);
    
    expect(mockOnDecline).toHaveBeenCalledWith('request-1');
  });

  test('shows online status badge for online users', () => {
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('renders multiple requests correctly', () => {
    render(
      <PendingRequests requests={mockRequests} onAccept={vi.fn()} onDecline={vi.fn()} />
    );
    
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    
    expect(acceptButtons).toHaveLength(2);
    expect(declineButtons).toHaveLength(2);
  });
});
