const LOCAL_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5174',
  'http://localhost:5175',
  'https://localhost:5175',
];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseClientOriginsFromEnv(): string[] {
  const fromClientUrl = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [];
  const fromClientUrls = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const merged = [...fromClientUrl, ...fromClientUrls]
    .map((origin) => normalizeOrigin(origin))
    .flatMap((origin) => {
      if (origin.startsWith('http://')) {
        return [origin, origin.replace('http://', 'https://')];
      }
      return [origin];
    });

  return Array.from(new Set(merged));
}

const allowedOrigins = new Set([
  ...LOCAL_ALLOWED_ORIGINS,
  ...parseClientOriginsFromEnv(),
]);

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.has(normalized)) {
    return true;
  }

  try {
    const hostname = new URL(normalized).hostname;
    return hostname.endsWith('.app.github.dev');
  } catch {
    return false;
  }
}

export function validateCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Not allowed by CORS: ${origin}`));
}
