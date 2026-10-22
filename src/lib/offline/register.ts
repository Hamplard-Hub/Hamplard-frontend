/**
 * Service worker registration and background-sync plumbing.
 *
 * The worker itself lives in `public/sw.js` (it must be served from the site
 * root to control the whole origin).
 */

/** Background Sync tag the worker listens for. */
export const SYNC_TAG = 'hamplard-progress-sync';

/** Path of the service worker script. */
export const SERVICE_WORKER_URL = '/sw.js';

const isBrowser = typeof window !== 'undefined';

/** True when the browser supports service workers. */
export function isServiceWorkerSupported(): boolean {
  return isBrowser && 'serviceWorker' in navigator;
}

/**
 * Registers the service worker.
 *
 * Registration is a no-op in browsers without support (and during SSR), so
 * callers can invoke it unconditionally.
 */
export async function registerOfflineServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
  } catch {
    // A failed registration (insecure context, blocked by policy, …) must not
    // break the app — the site simply works without offline support.
    return null;
  }
}

/**
 * Asks the browser to run the worker's `sync` handler once connectivity
 * returns. Browsers without Background Sync ignore this.
 */
export async function requestBackgroundSync(
  registration: ServiceWorkerRegistration | null,
): Promise<void> {
  if (!registration) return;
  const syncManager = (registration as ServiceWorkerRegistration & {
    sync?: { register(tag: string): Promise<void> };
  }).sync;
  if (!syncManager?.register) return;
  try {
    await syncManager.register(SYNC_TAG);
  } catch {
    // Background Sync is best-effort — the `online` event listener covers the
    // browsers that reject the registration.
  }
}

/**
 * Subscribes to worker messages.
 *
 * The worker asks open clients to flush their queued progress when it runs a
 * background sync, because the queued updates live in the page's localStorage.
 *
 * @returns an unsubscribe function.
 */
export function listenForServiceWorkerMessages(onSync: () => void): () => void {
  if (!isServiceWorkerSupported()) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'hamplard:sync-progress') {
      onSync();
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
