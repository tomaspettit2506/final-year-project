// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { createTheme } from '@mui/material/styles';

const mockNavigate = vi.fn();

const mockAuthUser = {
	uid: 'test-uid',
	email: 'test@example.com',
	displayName: 'Test User',
	metadata: {
		creationTime: '2024-01-01T00:00:00.000Z',
	},
} as any;

const mockAuthContext = {
	user: mockAuthUser,
	userData: { rating: 1200, name: 'Test User' },
	logout: vi.fn().mockResolvedValue(undefined),
} as any;

const mockAppTheme = {
	isDark: false,
	toggleTheme: vi.fn(),
	theme: createTheme({
		palette: {
			mode: 'light',
			primary: { main: '#5500aa' },
		},
	}),
};

const mockBoardTheme = {
	boardTheme: 'classic',
	setBoardTheme: vi.fn(),
	pieceSet: 'standard',
	setPieceSet: vi.fn(),
};

const createMockResponse = (data: unknown, ok = true, status = 200) => ({
	ok,
	status,
	json: async () => data,
	text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
}) as Response;

const defaultFetchImplementation = async (input: RequestInfo | URL) => {
	const url = input.toString();

	if (url.includes('/user/email/')) {
		return createMockResponse({ _id: 'mongo-user-1', rating: 1200, name: 'Test User' });
	}

	if (/\/user\/[^/]+\/games/.test(url)) {
		return createMockResponse([]);
	}

	if (url.includes('/message/')) {
		return createMockResponse([]);
	}

	if (url.includes('/game-invite/room/')) {
		return createMockResponse({ rated: true, timeControl: '10' });
	}

	if (url.includes('/game-invite')) {
		return createMockResponse({ success: true, roomId: 'ROOM123' });
	}

	if (url.includes('/game/user/')) {
		return createMockResponse([]);
	}

	if (/\/user\/[^/]+$/.test(url)) {
		return createMockResponse({ rating: 1200, name: 'Test User' });
	}

	return createMockResponse({});
};

vi.mock('react-router-dom', async () => {
	const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

	return {
		...actual,
		useNavigate: () => mockNavigate,
		useLocation: () => ({
			pathname: '/',
			search: '',
			hash: '',
			state: null,
			key: 'default',
		}),
		useParams: () => ({}),
		useSearchParams: () => [new URLSearchParams(), vi.fn()],
	};
});

vi.mock('react-firebase-hooks/auth', () => ({
	useAuthState: () => [null, false, undefined],
}));

vi.mock('./Context/AuthContext', async () => {
	const actual = await vi.importActual<typeof import('./Context/AuthContext')>('./Context/AuthContext');

	return {
		...actual,
		useAuth: () => mockAuthContext,
	};
});

vi.mock('./Context/ThemeContext', async () => {
	const actual = await vi.importActual<typeof import('./Context/ThemeContext')>('./Context/ThemeContext');

	return {
		...actual,
		useTheme: () => mockAppTheme,
	};
});

vi.mock('./Context/BoardThemeContext', async () => {
	const actual = await vi.importActual<typeof import('./Context/BoardThemeContext')>('./Context/BoardThemeContext');

	return {
		...actual,
		useBoardTheme: () => mockBoardTheme,
	};
});

vi.mock('./Services/socket', () => ({
	socket: {
		connected: false,
		id: 'socket-1',
		connect: vi.fn(),
		disconnect: vi.fn(),
		emit: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		once: vi.fn(),
	},
}));

vi.mock('./Services/api', async () => {
	const actual = await vi.importActual<typeof import('./Services/api')>('./Services/api');

	return {
		...actual,
		getApiBaseUrl: () => 'http://localhost:8000',
		saveGame: vi.fn().mockResolvedValue(undefined),
	};
});

vi.mock('./Utils/FirestoreService', () => ({
	getUserRating: vi.fn().mockResolvedValue({ rating: 1200, name: 'Test User' }),
}));

beforeEach(() => {
	mockNavigate.mockReset();

	globalThis.fetch = vi.fn(defaultFetchImplementation) as any;
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});