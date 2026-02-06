import { render, screen } from '@testing-library/react';
import Basic from './Basic';

test('Basic Page', () => {
  render(<Basic />);
  const linkElement = screen.getByText(/Welcome to the Basic Page/i);
  expect(linkElement).toBeInTheDocument();
});