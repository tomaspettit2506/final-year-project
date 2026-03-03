import { render } from '@testing-library/react';
import Play from './Play';

test('Play renders without crashing', () => {
  const { container } = render(<Play />);
  expect(container).toBeTruthy();
});