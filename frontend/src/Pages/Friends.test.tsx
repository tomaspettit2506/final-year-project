import { render, screen } from '@testing-library/react';
import Friends from './Friends';

test('renders Friends component', () => {
  render(<Friends />);
  const linkElement = screen.getByText(/Friends/i);
  expect(linkElement).toBeInTheDocument();
});