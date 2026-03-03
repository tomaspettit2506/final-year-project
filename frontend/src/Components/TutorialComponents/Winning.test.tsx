import { render } from '@testing-library/react';
import Winning from './Winning';

test('Winning renders without crashing', () => {
  const { container } = render(<Winning />);
  expect(container).toBeTruthy();
});