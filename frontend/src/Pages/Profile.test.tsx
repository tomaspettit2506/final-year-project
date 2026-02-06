import { render, screen } from '@testing-library/react';
import Profile from './Profile';

test('Profile Page', () => {
  render(<Profile />);
  const linkElement = screen.getByText(/Welcome to the Profile Page/i);
  expect(linkElement).toBeInTheDocument();
});