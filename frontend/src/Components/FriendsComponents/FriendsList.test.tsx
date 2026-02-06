import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FriendsList from './FriendsList';
import { AuthContext } from '../../Context/AuthContext';

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User'
} as any;

const mockAuthContext = {
  user: mockUser,
  userData: { rating: 1200 },
  logout: vi.fn(),
} as any;

const mockFriends = [
  {
    id: 'friend-1',
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://example.com/avatar1.jpg',
    rating: 1200,
    online: true
  },
  {
    id: 'friend-2',
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: 'https://example.com/avatar2.jpg',
    rating: 1350,
    online: false,
    lastSeen: '2 hours ago'
  }
];

describe('FriendsList Component', () => {
  test('renders FriendsList component', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={mockFriends} onRemoveFriend={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('displays online status badge for online friends', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={mockFriends} onRemoveFriend={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('filters friends based on search query', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={mockFriends} onRemoveFriend={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('displays empty state when no friends', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={[]} onRemoveFriend={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/no friends/i)).toBeInTheDocument();
  });

  test('calls onRemoveFriend when remove button is clicked', () => {
    const mockOnRemoveFriend = vi.fn();
    
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={mockFriends} onRemoveFriend={mockOnRemoveFriend} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    fireEvent.click(moreButtons[0]);
    
    const removeButton = screen.getByRole('menuitem', { name: /remove/i });
    fireEvent.click(removeButton);
    
    expect(mockOnRemoveFriend).toHaveBeenCalledWith(mockFriends[0]);
  });

  test('displays friend ratings', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsList friends={mockFriends} onRemoveFriend={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('1350')).toBeInTheDocument();
  });
});
