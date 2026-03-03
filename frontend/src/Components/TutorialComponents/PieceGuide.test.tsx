import { render } from '@testing-library/react';
import PieceGuide from './PieceGuide';

test('PieceGuide renders with required props', () => {
  const { container } = render(
    <PieceGuide 
      piece="♔" 
      name="King" 
      description="The king can move one square in any direction" 
      movement="One square any direction" 
      highlights={[]} 
      boardPieces={[]} 
    />
  );
  expect(container).toBeTruthy();
});