import { render } from '@testing-library/react';
import Basic from './Basic';

test('Basic renders without crashing', () => {
  const { container } = render(<Basic />);
  expect(container).toBeTruthy();
});