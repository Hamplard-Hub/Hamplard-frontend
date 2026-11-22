export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

const DEFAULT_ORIGIN = 'http://localhost';

/**
 * Returns a safe same-origin absolute path for post-login redirects.
 *
 * Rejects missing/empty values, relative paths (`dashboard`, `../admin`),
 * absolute URLs (`https://evil.example`), protocol-relative URLs
 * (`//evil.example`), and backslash-normalized variants (`/\evil.example`, `\\evil.example`).
 * Falls back to `fallback` (default `/dashboard`) for anything unsafe.
 */
export function getSafeCallbackUrl(
  value: string | null | undefined,
  fallback: string = DEFAULT_LOGIN_REDIRECT,
  base?: string,
): string {
  const candidate = value?.trim();

  if (!candidate) return fallback;

  // Must be an absolute path starting with a single '/' and cannot contain backslashes
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return fallback;
  }

  const origin =
    base ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : DEFAULT_ORIGIN);

  try {
    const target = new URL(candidate, origin);
    const expectedOrigin = new URL(origin).origin;
    if (target.origin !== expectedOrigin) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

/** Alias matching issue #536 naming convention */
export const safeRedirectPath = getSafeCallbackUrl;
