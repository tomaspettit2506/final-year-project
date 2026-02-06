import { render, screen } from '@testing-library/react';
import MoveHistory from './MoveHistory';
import type { Move } from '../../Types/chess';

const createMove = (notation: string, color: 'white' | 'black', accuracy?: number, accuracyClass?: string): Move => ({
  from: { row: 6, col: 4 },
  to: { row: 4, col: 4 },
  piece: { type: 'pawn', color },
  notation,
  accuracy,
  accuracyClass: accuracyClass as any
});

describe('MoveHistory Component', () => {
  test('renders move history correctly', () => {
    const moves: Move[] = [
      createMove('e4', 'white', 95, 'excellent'),
      createMove('e5', 'black', 90, 'excellent'),
      createMove('Nf3', 'white', 88, 'good'),
      createMove('Nc6', 'black', 70, 'inaccuracy'),
    ];

    render(<MoveHistory moves={moves} />);

    expect(screen.getByText('Move History')).toBeInTheDocument();
    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('e5')).toBeInTheDocument();
    expect(screen.getByText('Nf3')).toBeInTheDocument();
    expect(screen.getByText('Nc6')).toBeInTheDocument();
  });

  test('renders empty state when no moves are made', () => {
    render(<MoveHistory moves={[]} />);

    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument();
  });
});