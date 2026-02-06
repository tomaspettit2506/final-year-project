import { render, screen } from '@testing-library/react';
import Settings from './Settings';

test('Settings Page', () => {
  render(<Settings />);
  const linkElement = screen.getByText(/Welcome to the Settings Page/i);
  expect(linkElement).toBeInTheDocument();
});