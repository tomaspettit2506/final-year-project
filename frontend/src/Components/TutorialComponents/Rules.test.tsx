import { render } from '@testing-library/react';
import Rules from './Rules';

test('Rules renders without crashing', () => {
  const { container } = render(<Rules />);
  expect(container).toBeTruthy();
});