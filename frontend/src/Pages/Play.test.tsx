import { render, screen } from '@testing-library/react';
import Play from './Play';

test('Play Page', () => {
  render(<Play />);
  const linkElement = screen.getByText(/Welcome to the Play Page/i);
  expect(linkElement).toBeInTheDocument();
});