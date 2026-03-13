export const MIN_PAGE_LOADING_MS = 3000;
export const MAX_PAGE_LOADING_MS = 5000;

export const getRandomPageLoadingDelayMs = (): number => {
  return Math.floor(Math.random() * (MAX_PAGE_LOADING_MS - MIN_PAGE_LOADING_MS + 1)) + MIN_PAGE_LOADING_MS;
};

export const waitForMinimumDuration = async (startedAt: number, minimumDurationMs: number): Promise<void> => {
  const elapsedMs = Date.now() - startedAt;
  const remainingMs = minimumDurationMs - elapsedMs;

  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs));
  }
};
