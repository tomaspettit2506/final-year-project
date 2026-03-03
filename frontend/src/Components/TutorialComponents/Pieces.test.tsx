import { render } from '@testing-library/react';
import Pieces from './Pieces';

test('Pieces renders without crashing', () => {
  const { container } = render(<Pieces />);
  expect(container).toBeTruthy();
});