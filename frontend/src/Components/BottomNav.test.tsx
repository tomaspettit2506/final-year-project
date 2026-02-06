import { render, screen } from '@testing-library/react';
import BottomNav from './BottomNav';

test('BottomNav Component', () => {
  render(<BottomNav />);
  const linkElement = screen.getByText(/Welcome to the BottomNav Component/i);
  expect(linkElement).toBeInTheDocument();
});