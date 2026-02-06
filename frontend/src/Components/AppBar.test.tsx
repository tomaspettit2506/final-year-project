import { render, screen } from '@testing-library/react';
import AppBar from './AppBar';

describe('AppBar Component', () => {
  test('renders title correctly', () => {
    render(<AppBar title="Test Title" isBackButton={false} isSettings={false} isExit={false} />);
    const titleElement = screen.getByText(/Test Title/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders back button when isBackButton is true', () => {
    render(<AppBar title="Test Title" isBackButton={true} isSettings={false} isExit={false} />);
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('renders settings button when isSettings is true', () => {
    render(<AppBar title="Test Title" isBackButton={false} isSettings={true} isExit={false} />);
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  test('renders exit button when isExit is true', () => {
    render(<AppBar title="Test Title" isBackButton={false} isSettings={false} isExit={true} />);
    const exitButton = screen.getByRole('button', { name: /exit/i });
    expect(exitButton).toBeInTheDocument();
  });

  test('renders all buttons when all props are true', () => {
    render(<AppBar title="Test Title" isBackButton={true} isSettings={true} isExit={true} />);
    const backButton = screen.getByRole('button', { name: /back/i });
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    const exitButton = screen.getByRole('button', { name: /exit/i });
    
    expect(backButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
    expect(exitButton).toBeInTheDocument();
  });
});

