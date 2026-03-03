import { render } from '@testing-library/react';
import Tutorial from './Tutorial';

test('Tutorial renders without crashing', () => {
  const { container } = render(<Tutorial />);
  expect(container).toBeTruthy();
});