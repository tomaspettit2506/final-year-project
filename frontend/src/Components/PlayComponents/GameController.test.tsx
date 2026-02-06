import { render, screen } from '@testing-library/react';
import GameController from './GameController';

describe('GameController Component', () => {
  test('renders AI mode controls correctly', () => {
    render(
      <GameController
        gameMode="ai"
        onUndo={() => {}}
        onRedo={() => {}}
        onResign={() => {}}
        onFlip={() => {}}
        canUndo={true}
        canRedo={false}
      />
    );

    const undoButton = screen.getByText(/Undo/i);
    expect(undoButton).toBeInTheDocument();
    
    const redoButton = screen.getByText(/Redo/i);
    expect(redoButton).toBeInTheDocument();
    
    const resignButton = screen.getByText(/Resign/i);
    expect(resignButton).toBeInTheDocument();
    
    const flipButton = screen.getByText(/Flip/i);
    expect(flipButton).toBeInTheDocument();
  });
});