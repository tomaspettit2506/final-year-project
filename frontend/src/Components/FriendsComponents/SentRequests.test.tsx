import { render, screen } from '@testing-library/react';
import SentRequests from './SentRequests';

const mockRequests = [
  {
    id: '1',
    name: 'Alice Smith',
    username: 'alice',
    avatar: 'https://www.gravatar.com/avatar/alice',
    rating: 1500,
    online: true,
    sentAt: '2 hours ago',
    status: 'Pending'
  },
  {
    id: '2',
    name: 'Bob Johnson',
    username: 'bob',
    avatar: 'https://www.gravatar.com/avatar/bob',
    rating: 1300,
    online: false,
    sentAt: '1 day ago',
    status: 'Pending'
  }
];

describe('SentRequests Component', () => {
  test('renders SentRequests with requests', () => {
    render(<SentRequests requests={mockRequests} />);
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('@alice • 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('@bob • 1 day ago')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBe(2);
  });

  test('renders SentRequests with no requests', () => {
    render(<SentRequests requests={[]} />);
    
    expect(screen.getByText(/no sent friend requests/i)).toBeInTheDocument();
  });
});