import { render } from '@testing-library/react';
import Profile from './Profile';

test('Profile renders without crashing', () => {
  const { container } = render(<Profile />);
  expect(container).toBeTruthy();
});