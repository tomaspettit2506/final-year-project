import { render, screen } from '@testing-library/react';
import Loading from './Loading';

test('Loading component renders with default message', () => {
    render(<Loading />);
    const defaultMessage = screen.getByText(/Guardians of the Chess Grandmaster/i);
    expect(defaultMessage).toBeInTheDocument();
});

test('Loading component renders with custom message', () => {
    const customMessage = "Loading your dashboard";
    render(<Loading message={customMessage} />);
    const messageElement = screen.getByText(new RegExp(`Navigating to ${customMessage}...`, 'i'));
    expect(messageElement).toBeInTheDocument();
});

test('Loading component renders logout message when isLoggingOut is true', () => {
    render(<Loading isLoggingOut />);
    const logoutMessage = screen.getByText(/Logging out.../i);
    expect(logoutMessage).toBeInTheDocument();
});