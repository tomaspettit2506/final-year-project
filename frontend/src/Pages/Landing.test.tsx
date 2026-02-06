import { render, screen } from '@testing-library/react';
import Landing from './Landing';

test('Landing Page', () => {
  render(<Landing />);
  const linkElement = screen.getByText(/Welcome to the Landing Page/i);
  expect(linkElement).toBeInTheDocument();
});