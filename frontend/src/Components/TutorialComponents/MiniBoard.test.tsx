import { render } from '@testing-library/react';
import MiniBoard from './MiniBoard';

test('MiniBoard renders without crashing', () => {
  const { container } = render(<MiniBoard />);
  expect(container).toBeTruthy();
});