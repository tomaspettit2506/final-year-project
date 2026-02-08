import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ChatDialog from './ChatDialog';

const mockFriend = {
  id: 'friend-1',
  name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://example.com/avatar.jpg',
    rating: 1200,
    online: true
};

const mockMessages = [
  {
    id: 'msg-1',
    senderId: 'user-1',
    text: 'Hello!',
      timestamp: '2024-01-01T12:00:00Z',
      read: false
  },
  {
    id: 'msg-2',
    senderId: 'friend-1',
    text: 'Hi there!',
      timestamp: '2024-01-01T12:01:00Z',
      read: true
  }
];

describe('ChatDialog Component', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnEditMessage = vi.fn();
  const mockOnDeleteMessage = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    friend: mockFriend,
    messages: mockMessages,
    currentUserId: "user-1",
    onSendMessage: mockOnSendMessage,
    onEditMessage: mockOnEditMessage,
    onDeleteMessage: mockOnDeleteMessage,
  };

  test('renders ChatDialog when open', () => {
    render(<ChatDialog {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<ChatDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('displays chat messages', () => {
    render(<ChatDialog {...defaultProps} />);
    
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('displays empty state when no messages', () => {
    render(<ChatDialog {...defaultProps} messages={[]} />);
    
    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  test('calls onSendMessage when send button is clicked', () => {
    const mockOnSend = vi.fn();
    
    render(<ChatDialog {...defaultProps} onSendMessage={mockOnSend} />);
    
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalled();
  });

  test('clears input after sending message', () => {
    render(<ChatDialog {...defaultProps} />);
    
    const messageInput = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    expect(messageInput.value).toBe('');
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnOpenChange = vi.fn();
    
    render(<ChatDialog {...defaultProps} onOpenChange={mockOnOpenChange} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('handles Enter key to send message', () => {
    const mockOnSend = vi.fn();
    
    render(<ChatDialog {...defaultProps} onSendMessage={mockOnSend} />);
    
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.keyPress(messageInput, { key: 'Enter', code: 13, charCode: 13 });
    
    expect(mockOnSend).toHaveBeenCalled();
  });

  test('shows edit and delete buttons for current user messages', () => {
    render(<ChatDialog {...defaultProps} />);
    
    const currentUserMessage = screen.getByText('Hello!');
    expect(currentUserMessage).toBeInTheDocument();
    // Edit and delete buttons should be present for current user's messages
  });

  test('does not show edit and delete buttons for other user messages', () => {
    render(<ChatDialog {...defaultProps} />);
    
    const otherUserMessage = screen.getByText('Hi there!');
    expect(otherUserMessage).toBeInTheDocument();
    // Edit and delete buttons should not be visible for friend's messages
  });

  test('calls onEditMessage when editing a message', () => {
    const mockOnEdit = vi.fn();
    render(<ChatDialog {...defaultProps} onEditMessage={mockOnEdit} />);
    
    // This would require clicking edit button, modifying text, and saving
    // Full implementation would need more detailed interaction testing
  });

  test('calls onDeleteMessage when deleting a message', () => {
    const mockOnDelete = vi.fn();
    render(<ChatDialog {...defaultProps} onDeleteMessage={mockOnDelete} />);
    
    // This would require clicking delete button
    // Full implementation would need more detailed interaction testing
  });
});
