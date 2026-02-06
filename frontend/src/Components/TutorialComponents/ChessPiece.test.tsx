import { render, screen } from '@testing-library/react';
import ChessPiece from './ChessPiece';

test('ChessPiece Component', () => {
  render(<ChessPiece piece="Knight" />);
  const linkElement = screen.getByText(/Knight/i);
  expect(linkElement).toBeInTheDocument();
});