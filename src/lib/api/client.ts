// lib/api/client.ts
import axios, { AxiosError } from 'axios';
import { getApiUrl } from './config';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

const baseURL = getApiUrl();

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

// ─── Request interceptor: attach auth token ───────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hamplard_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Retry configuration ─────────────────────────────────────────────────
const MAX_RETRIES = 3;

/** Status codes that are safe to retry. */
const RETRYABLE_STATUSES = new Set([429, 503]);

/** Status codes we must never retry (client errors). */
const NO_RETRY_STATUSES = new Set([400, 401, 403, 404]);

/** HTTP methods that are safe to retry (idempotent). */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Determines if an error is safe to retry.
 * Only retries idempotent methods (GET, HEAD, OPTIONS) on network timeouts.
 * For POST/PATCH/DELETE, only retries if Idempotency-Key header is present.
 */
function isRetryable(err: AxiosError): boolean {
  const config = err.config as (typeof err.config & { _retryCount?: number }) | undefined;
  const method = (config?.method ?? 'GET').toUpperCase();

  // Network timeout (no response at all)
  if (!err.response) {
    // Only retry idempotent methods on network timeout
    if (RETRYABLE_METHODS.has(method)) return true;

    // For non-idempotent methods, only retry if Idempotency-Key is present
    if (config?.headers?.['Idempotency-Key']) return true;

    return false;
  }

  const status = err.response.status;
  if (NO_RETRY_STATUSES.has(status)) return false;
  return RETRYABLE_STATUSES.has(status);
}

/** Exponential back-off: 1 s, 2 s, 4 s … */
function backoffMs(attempt: number): number {
  return 1000 * Math.pow(2, attempt - 1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Response interceptor: retry + 401 redirect ──────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as (typeof err.config & { _retryCount?: number }) | undefined;

    if (config && isRetryable(err)) {
      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount <= MAX_RETRIES) {
        // Tag the retry count on the request header for debugging.
        config.headers = config.headers ?? {};
        config.headers['X-Retry-Count'] = String(config._retryCount);

        await sleep(backoffMs(config._retryCount));
        return apiClient(config);
      }
    }

    // Redirect to login on 401 (only after retries are exhausted / not retryable)
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Clear the full session via the store so the cookie is also removed.
      useAuthStore.getState().logout();
      // Avoid a redirect loop when already on /login.
      if (currentPath !== '/login') {
        const url = new URL('/login', window.location.href);
        // Only allow same-origin callback paths to prevent open-redirect.
        if (currentPath.startsWith('/')) {
          url.searchParams.set('callbackUrl', currentPath);
        }
        window.location.href = url.toString();
      }
    }

    return Promise.reject(err);
  },
);
