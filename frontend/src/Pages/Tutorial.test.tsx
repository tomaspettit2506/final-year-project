import { render, screen } from '@testing-library/react';
import Tutorial from './Tutorial';

test('Tutorial Page', () => {
  render(<Tutorial />);
  const linkElement = screen.getByText(/Welcome to the Tutorial Page/i);
  expect(linkElement).toBeInTheDocument();
});