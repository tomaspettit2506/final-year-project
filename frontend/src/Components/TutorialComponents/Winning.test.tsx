import { render, screen } from '@testing-library/react';
import Winning from './Winning';

test('Winning Component', () => {
  render(<Winning />);
  const linkElement = screen.getByText(/Welcome to the Winning Component/i);
  expect(linkElement).toBeInTheDocument();
});