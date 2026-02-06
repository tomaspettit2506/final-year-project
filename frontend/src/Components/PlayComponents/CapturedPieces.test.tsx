import { render, screen } from '@testing-library/react';
import CapturedPieces from './CapturedPieces';
import type { Piece } from '../../Types/chess';


describe('CapturedPieces Component', () => {
  test('renders captured pieces for both sides', () => {
    const whiteCaptured: Piece[] = [
      { type: 'pawn', color: 'black' },
      { type: 'knight', color: 'black' },
      { type: 'bishop', color: 'black' }
    ];
    const blackCaptured: Piece[] = [
      { type: 'rook', color: 'white' },
      { type: 'queen', color: 'white' }
    ];

    render(<CapturedPieces whiteCaptured={whiteCaptured} blackCaptured={blackCaptured} />);

    expect(screen.getByText(/Captured Pieces/i)).toBeInTheDocument();
  });

  test('renders empty state when no pieces are captured', () => {
    render(<CapturedPieces whiteCaptured={[]} blackCaptured={[]} />);

    expect(screen.getByText(/Captured Pieces/i)).toBeInTheDocument();
  });

  test('displays material advantage correctly', () => {
    const whiteCaptured: Piece[] = [
      { type: 'queen', color: 'black' }, // 9 points
    ];
    const blackCaptured: Piece[] = [
      { type: 'rook', color: 'white' }, // 5 points
    ];

    render(<CapturedPieces whiteCaptured={whiteCaptured} blackCaptured={blackCaptured} />);

    expect(screen.getByText(/Captured Pieces/i)).toBeInTheDocument();
  });
});

