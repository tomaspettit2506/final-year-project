import { render, screen } from '@testing-library/react';
import ChessPiece from './ChessPiece';

test('ChessPiece Component', () => {
  render(<ChessPiece piece="white-knight" />);
  expect(screen.getByText('♘')).toBeInTheDocument();
});