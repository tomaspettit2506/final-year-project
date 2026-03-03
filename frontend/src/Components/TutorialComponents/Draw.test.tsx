import { render } from '@testing-library/react';
import Draw from './Draw';

test('Draw renders without crashing', () => {
  const { container } = render(<Draw />);
  expect(container).toBeTruthy();
});