import { render } from '@testing-library/react';
import InstallPWA from './InstallPWA';

test('InstallPWA renders without crashing', () => {
  const { container } = render(<InstallPWA />);
  expect(container).toBeTruthy();
});