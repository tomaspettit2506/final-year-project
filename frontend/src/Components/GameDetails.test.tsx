import { render, screen } from '@testing-library/react';
import GameDetails from './GameDetails';

test('GameDetails Component', () => {
  render(<GameDetails open={false} onClose={function (): void {
    throw new Error('Function not implemented.');
  } } gameDetails={null} />);
  const linkElement = screen.getByText(/Welcome to the GameDetails Component/i);
  expect(linkElement).toBeInTheDocument();
});