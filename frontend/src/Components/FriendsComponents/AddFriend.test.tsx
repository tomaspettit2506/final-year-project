import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  test('renders AddFriend component', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
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

      (globalThis.fetch as any).mockResolvedValueOnce({
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
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/user$/));
    });
  });

  test('does not show the authenticated user in search results', async () => {
    const mockUsers = [
      {
        firebaseUid: 'test-uid',
        name: 'Test User',
        email: 'test@example.com',
        rating: 1200
      },
      {
        firebaseUid: 'user-2',
        name: 'Test Rival',
        email: 'rival@example.com',
        rating: 1250
      }
    ];

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Rival')).toBeInTheDocument();
    });

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
    });
  });

  test('displays no results message when no users found', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AddFriend onSendRequest={vi.fn()} />
      </AuthContext.Provider>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'missing-user' } });
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });
});
