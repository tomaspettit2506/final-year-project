import { render } from '@testing-library/react';
import Friends from './Friends';

test('Friends component renders without crashing', () => {
  const { container } = render(<Friends />);
  expect(container).toBeTruthy();
});