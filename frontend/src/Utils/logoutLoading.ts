export const MIN_LOGOUT_LOADING_MS = 3000;
const LOGOUT_LOADING_UNTIL_KEY = 'gotcg_logout_loading_until';

export const markLogoutLoadingWindow = (durationMs: number = MIN_LOGOUT_LOADING_MS): void => {
  if (typeof window === 'undefined') return;
  const until = Date.now() + durationMs;
  window.sessionStorage.setItem(LOGOUT_LOADING_UNTIL_KEY, String(until));
};

export const getRemainingLogoutLoadingMs = (): number => {
  if (typeof window === 'undefined') return 0;

  const raw = window.sessionStorage.getItem(LOGOUT_LOADING_UNTIL_KEY);
  const until = Number(raw);

  if (!Number.isFinite(until)) return 0;

  return Math.max(0, until - Date.now());
};

export const clearLogoutLoadingWindow = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(LOGOUT_LOADING_UNTIL_KEY);
};
