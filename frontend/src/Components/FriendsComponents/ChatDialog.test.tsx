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
  test('renders ChatDialog when open', () => {
    render(
      <ChatDialog
        open={true}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
          currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ChatDialog
        open={false}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
          currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('displays chat messages', () => {
    render(
      <ChatDialog
        open={true}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
          currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('displays empty state when no messages', () => {
    render(
      <ChatDialog
        open={true}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={[]}
          currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  test('calls onSendMessage when send button is clicked', () => {
    const mockOnSendMessage = vi.fn();
    
    render(
      <ChatDialog
        open={true}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
          currentUserId="user-1"
        onSendMessage={mockOnSendMessage}
      />
    );
    
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
      expect(mockOnSendMessage).toHaveBeenCalled();
  });

  test('clears input after sending message', () => {
    render(
      <ChatDialog
        open={true}
          onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
          currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    const messageInput = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    expect(messageInput.value).toBe('');
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnOpenChange = vi.fn();
    
    render(
      <ChatDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        friend={mockFriend}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={vi.fn()}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('handles Enter key to send message', () => {
    const mockOnSendMessage = vi.fn();
    
    render(
      <ChatDialog
        open={true}
        onOpenChange={vi.fn()}
        friend={mockFriend}
        messages={mockMessages}
        currentUserId="user-1"
        onSendMessage={mockOnSendMessage}
      />
    );
    
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.keyPress(messageInput, { key: 'Enter', code: 13, charCode: 13 });
    
      expect(mockOnSendMessage).toHaveBeenCalled();
  });
});
