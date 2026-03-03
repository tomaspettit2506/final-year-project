import { render } from '@testing-library/react';
import GameDetails from './GameDetails';

test('GameDetails renders with props', () => {
  const { container } = render(
    <GameDetails 
      open={false} 
      onClose={jest.fn()} 
      gameDetails={null} 
    />
  );
  expect(container).toBeTruthy();
});