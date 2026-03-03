import { render } from '@testing-library/react';
import Landing from './Landing';

test('Landing renders without crashing', () => {
  const { container } = render(<Landing />);
  expect(container).toBeTruthy();
});