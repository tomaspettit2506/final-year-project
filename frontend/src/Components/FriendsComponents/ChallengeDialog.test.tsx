import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChallengeDialog from './ChallengeDialog';

describe('ChallengeDialog Component', () => {
  test('renders ChallengeDialog when open', () => {
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ChallengeDialog
        open={false}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('displays time control options', () => {
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    expect(screen.getByLabelText(/time control/i)).toBeInTheDocument();
  });

  test('displays rated/casual toggle', () => {
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    expect(screen.getByLabelText(/game type/i)).toBeInTheDocument();
  });

  test('calls onChallenge when send button is clicked', async () => {
    const mockOnChallenge = vi.fn().mockResolvedValue('room-123');
    
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={mockOnChallenge}
      />
    );
    
    const sendButton = screen.getByRole('button', { name: /send challenge/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockOnChallenge).toHaveBeenCalled();
    });
  });

  test('calls onOpenChange when cancel button is clicked', () => {
    const mockOnOpenChange = vi.fn();
    
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  test('allows changing time control', () => {
    render(
      <ChallengeDialog
        open={true}
        onOpenChange={vi.fn()}
        friendName="John Doe"
        onChallenge={vi.fn().mockResolvedValue('room-123')}
      />
    );
    
    const timeControlSelect = screen.getByLabelText(/time control/i);
    expect(timeControlSelect).toBeInTheDocument();
  });
});
