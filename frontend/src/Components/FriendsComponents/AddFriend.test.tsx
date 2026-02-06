import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AddFriend from './AddFriend';
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

describe('AddFriend Component', () => {
  beforeEach(() => {
      window.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders AddFriend component', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/Add Friend/i)).toBeInTheDocument();
  });

  test('displays search input field', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('handles search query input', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test user' } });
    
    expect(searchInput.value).toBe('test user');
  });

  test('calls onSendRequest when send request button is clicked', async () => {
    const mockOnSendRequest = vi.fn();
    const mockUsers = [
      {
        firebaseUid: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        rating: 1200
      }
    ];

      (window.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={mockOnSendRequest} />
      </AuthContext.Provider>
    );
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
        expect(window.fetch).toHaveBeenCalledWith('/user');
    });
  });

  test('displays error message when fetch fails', async () => {
      (window.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('displays no results message when no users found', async () => {
    (window.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });
});
