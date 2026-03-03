import { render } from '@testing-library/react';
import Home from './Home';

test('Home Page renders without crashing', () => {
  const { container } = render(<Home />);
  expect(container).toBeTruthy();
});