import { render, screen } from '@testing-library/react';
import Draw from './Draw';

test('Draw Page', () => {
  render(<Draw />);
  const linkElement = screen.getByText(/Welcome to the Draw Page/i);
  expect(linkElement).toBeInTheDocument();
});