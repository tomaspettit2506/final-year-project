import { render, screen } from '@testing-library/react';
import InstallPWA from './InstallPWA';

test('InstallPWA Component', () => {
  render(<InstallPWA />);
  const linkElement = screen.getByText(/Welcome to the InstallPWA Component/i);
  expect(linkElement).toBeInTheDocument();
});