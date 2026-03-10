import { render } from '@testing-library/react';
import { vi } from 'vitest';
import GameDetails from './GameDetails';

test('GameDetails renders with props', () => {
  const { container } = render(
    <GameDetails 
      open={false} 
      onClose={vi.fn()} 
      gameDetails={null} 
    />
  );
  expect(container).toBeTruthy();
});