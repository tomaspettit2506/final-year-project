import { render, screen } from '@testing-library/react';
import PieceGuide from './PieceGuide';

test('PieceGuide Component', () => {
  render(<PieceGuide piece={'pawn'} name={'Pawn'} description={'The pawn is the most basic piece in chess.'} movement={'Pawns move forward one square, but capture diagonally.'} highlights={['Can move two squares on its first move.']} boardPieces={[]} />);
  const linkElement = screen.getByText(/Welcome to the PieceGuide Component/i);
  expect(linkElement).toBeInTheDocument();
});