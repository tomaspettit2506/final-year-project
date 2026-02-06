import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProfileDialog from './ProfileDialog';

const mockProfile = {
  friendName: 'John Doe',
  friendEmail: 'john.doe@example.com',
  friendRating: 1200,
  wins: 15,
  losses: 10,
  draws: 5,
  isLoading: false
};

describe('ProfileDialog Component', () => {
  test('renders ProfileDialog when open', () => {
    render(
      <ProfileDialog
        open={true}
        onClose={vi.fn()}
        friendName={mockProfile.friendName}
        friendEmail={mockProfile.friendEmail}
        friendRating={mockProfile.friendRating}
        wins={mockProfile.wins}
        losses={mockProfile.losses}
        draws={mockProfile.draws}
        isLoading={mockProfile.isLoading}
      />
    );
    
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
    expect(screen.getByText(/wins/i)).toBeInTheDocument();
    expect(screen.getByText(/losses/i)).toBeInTheDocument();
    expect(screen.getByText(/draws/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <ProfileDialog
        open={false}
        onClose={vi.fn()}
        friendName={mockProfile.friendName}
        friendEmail={mockProfile.friendEmail}
        friendRating={mockProfile.friendRating}
        wins={mockProfile.wins}
        losses={mockProfile.losses}
        draws={mockProfile.draws}
        isLoading={mockProfile.isLoading}
      />
    );
    
    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
  });

  test('displays loading state', () => {
    render(
      <ProfileDialog
        open={true}
        onClose={vi.fn()}
        friendName={mockProfile.friendName}
        friendEmail={mockProfile.friendEmail}
        friendRating={mockProfile.friendRating}
        wins={mockProfile.wins}
        losses={mockProfile.losses}
        draws={mockProfile.draws}
        isLoading={true}
      />
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});