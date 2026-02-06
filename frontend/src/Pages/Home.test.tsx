import { render, screen } from '@testing-library/react';
import Home from './Home';

test('Home Page', () => {
  render(<Home />);
  const linkElement = screen.getByText(/Home/i);
  expect(linkElement).toBeInTheDocument();
});