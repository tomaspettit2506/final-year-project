import { render, screen } from '@testing-library/react';
import AccuracyStats from './AccuracyStats';
import type { Move } from '../../Types/chess';

const createMove = (notation: string, accuracy?: number, accuracyClass?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'): Move => ({
  from: { row: 6, col: 4 },
  to: { row: 4, col: 4 },
  piece: { type: 'pawn', color: 'white' },
  notation,
  accuracy,
  accuracyClass
});

describe('AccuracyStats Component', () => {
  test('renders AccuracyStats component with moves', () => {
    const moves: Move[] = [
      createMove('e4', 95, 'excellent'),
      createMove('e5', 85, 'good'),
    ];

    render(<AccuracyStats moves={moves} />);

    expect(screen.getByText(/Accuracy Stats/i)).toBeInTheDocument();
  });

  test('displays average accuracy percentage', () => {
    const moves: Move[] = [
      createMove('e4', 95, 'excellent'),
      createMove('e5', 90, 'excellent'),
      createMove('Nf3', 70, 'inaccuracy'),
    ];

    render(<AccuracyStats moves={moves} />);

    // Average of 95, 90, 70 = 85
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
  });

  test('returns null when no moves have accuracy', () => {
    const moves: Move[] = [
      createMove('e4'),
    ];

    const { container } = render(<AccuracyStats moves={moves} />);

    expect(container.firstChild).toBeNull();
  });
});