import { render, screen } from '@testing-library/react';
import Rules from './Rules';

test('Rules Component', () => {
  render(<Rules />);
  const linkElement = screen.getByText(/Welcome to the Rules Component/i);
  expect(linkElement).toBeInTheDocument();
});