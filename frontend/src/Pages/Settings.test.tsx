import { render } from '@testing-library/react';
import Settings from './Settings';

test('Settings renders without crashing', () => {
  const { container } = render(<Settings />);
  expect(container).toBeTruthy();
});