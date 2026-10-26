// Hamplard service worker — lesson download + offline progress queue

const CACHE_VERSION = 'v1';
const LESSON_CACHE = `hamplard-lessons-${CACHE_VERSION}`;
const PROGRESS_STORE_KEY = 'hamplard-offline-progress';

// ── Install: skip waiting so the SW activates immediately ──────────
self.addEventListener('install', () => self.skipWaiting());

// ── Activate: clean old caches ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('hamplard-') && k !== LESSON_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ── Fetch: serve cached lessons when offline ──────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only intercept video/resource requests from the lesson cache
  if (event.request.method !== 'GET') return;
  if (!url.pathname.startsWith('/api/') && !url.hostname.includes('blob')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    }),
  );
});

// ── Message: download a lesson ────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, lessonId, videoUrl, resourceUrl } = event.data ?? {};

  if (type === 'DOWNLOAD_LESSON') {
    const cache = await caches.open(LESSON_CACHE);
    const urls = [videoUrl, resourceUrl].filter(Boolean);
    await Promise.allSettled(urls.map((u) => cache.add(u)));
    event.source?.postMessage({ type: 'DOWNLOAD_COMPLETE', lessonId });
  }

  if (type === 'DELETE_LESSON') {
    const cache = await caches.open(LESSON_CACHE);
    const urls = [event.data.videoUrl, event.data.resourceUrl].filter(Boolean);
    await Promise.allSettled(urls.map((u) => cache.delete(u)));
    event.source?.postMessage({ type: 'DELETE_COMPLETE', lessonId });
  }

  if (type === 'GET_STORAGE_ESTIMATE') {
    if ('storage' in navigator) {
      const estimate = await navigator.storage.estimate();
      event.source?.postMessage({ type: 'STORAGE_ESTIMATE', ...estimate });
    }
  }
});

// ── Sync: flush queued progress when back online ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-progress') {
    event.waitUntil(flushProgressQueue());
  }
});

async function flushProgressQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: 'FLUSH_PROGRESS' }));
}
