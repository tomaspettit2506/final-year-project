import { render, screen } from '@testing-library/react';
import MiniBoard from './MiniBoard';

test('MiniBoard Page', () => {
  render(<MiniBoard />);
  const linkElement = screen.getByText(/Welcome to the MiniBoard Page/i);
  expect(linkElement).toBeInTheDocument();
});