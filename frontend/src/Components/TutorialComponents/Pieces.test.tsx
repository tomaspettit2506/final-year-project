import { render, screen } from '@testing-library/react';
import Pieces from './Pieces';

test('Pieces Component', () => {
  render(<Pieces />);
  const linkElement = screen.getByText(/Welcome to the Pieces Component/i);
  expect(linkElement).toBeInTheDocument();
});