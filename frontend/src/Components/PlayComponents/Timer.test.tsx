import { render, screen } from '@testing-library/react';
import Timer from './Timer';

describe('Timer Component', () => {
  test('renders Timer component', () => {
    render(
      <Timer
        whiteTime={600}
        blackTime={600}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText(/Game Timer/i)).toBeInTheDocument();
  });

  test('displays white and black timers', () => {
    render(
      <Timer
        whiteTime={600}
        blackTime={600}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('White')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
  });

  test('formats time correctly in minutes and seconds', () => {
    render(
      <Timer
        whiteTime={125}
        blackTime={90}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  test('displays zero seconds with padding', () => {
    render(
      <Timer
        whiteTime={60}
        blackTime={120}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  test('highlights current player when active', () => {
    render(
      <Timer
        whiteTime={600}
        blackTime={600}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('White')).toBeInTheDocument();
  });

  test('displays low time warning', () => {
    render(
      <Timer
        whiteTime={25}
        blackTime={600}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('0:25')).toBeInTheDocument();
  });

  test('renders when timer is not active', () => {
    render(
      <Timer
        whiteTime={600}
        blackTime={600}
        currentPlayer="white"
        isActive={false}
      />
    );
    
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  test('displays both timers with different values', () => {
    render(
      <Timer
        whiteTime={300}
        blackTime={450}
        currentPlayer="black"
        isActive={true}
      />
    );
    
    expect(screen.getByText('5:00')).toBeInTheDocument();
    expect(screen.getByText('7:30')).toBeInTheDocument();
  });

  test('handles zero time', () => {
    render(
      <Timer
        whiteTime={0}
        blackTime={600}
        currentPlayer="white"
        isActive={true}
      />
    );
    
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });
});
