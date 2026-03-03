import { render } from '@testing-library/react';
import BottomNav from './BottomNav';

test('BottomNav renders without crashing', () => {
  const { container } = render(<BottomNav />);
  expect(container).toBeTruthy();
});