// lib/api/client.ts
import axios, { AxiosError } from 'axios';
import { getApiUrl } from './config';

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

function isRetryable(err: AxiosError): boolean {
  // Network timeout (no response at all)
  if (!err.response) return true;

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
      localStorage.removeItem('hamplard_token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  },
);
