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
/* eslint-disable no-restricted-globals */
/**
 * Hamplard service worker.
 *
 * Responsibilities:
 *  - Serve the app shell so the dashboard loads without a connection.
 *  - Replay lesson media that was downloaded through the "Download for
 *    offline" button (Cache Storage, `hamplard-media-v1`).
 *  - Ask open clients to flush queued progress when Background Sync fires.
 *
 * The media cache name must stay in sync with `OFFLINE_CACHE_NAME` in
 * `src/lib/offline/cache.ts` — both read and write the same bucket.
 */

const VERSION = 'v1';
const SHELL_CACHE = `hamplard-shell-${VERSION}`;
const MEDIA_CACHE = 'hamplard-media-v1';
const SYNC_TAG = 'hamplard-progress-sync';

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.svg',
];

const MEDIA_EXTENSIONS = [
  '.mp4', '.webm', '.ogv', '.m3u8', '.mpd',
  '.mp3', '.m4a', '.wav', '.ogg',
  '.pdf', '.zip', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.vtt', '.png', '.jpg', '.jpeg', '.webp', '.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Only our own versioned caches are removed; the media cache is
            // shared with the app and must survive an update.
            .filter((key) => key.startsWith('hamplard-shell-') && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** True when the request looks like lesson media or a downloadable file. */
function isMediaRequest(request, url) {
  if (request.destination === 'video' || request.destination === 'audio') return true;
  const path = url.pathname.toLowerCase();
  return MEDIA_EXTENSIONS.some((extension) => path.endsWith(extension));
}

/** Builds a 206 response for a cached file so seeking still works offline. */
async function serveRange(cached, rangeHeader) {
  if (cached.type === 'opaque' || !cached.body) return cached;

  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader || '');
  if (!match) return cached;

  const buffer = await cached.arrayBuffer();
  const total = buffer.byteLength;

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : total - 1;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= total) end = total - 1;
  if (start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const slice = buffer.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(slice.byteLength),
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
    },
  });
}

/** Cache-first: the whole point of the offline download. */
async function cacheFirst(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      try {
        return await serveRange(cached, rangeHeader);
      } catch {
        return cached;
      }
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

/** Network-first with a cached fallback — used for page navigations. */
async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await cache.match('/');
    if (shell) return shell;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
        '<h1>You are offline</h1><p>Reconnect to load this page.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

/** Stale-while-revalidate for same-origin assets. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // API traffic is never cached — it is user specific and must stay fresh.
  if (url.pathname.includes('/api/')) return;

  if (isMediaRequest(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/** Tells every open tab to flush its queued progress. */
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  clients.forEach((client) => client.postMessage({ type: 'hamplard:sync-progress' }));
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(notifyClientsToSync());
  }
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Cache a set of URLs on behalf of the page — used as a fallback when the
  // page-side download could not reach a cross-origin resource.
  if (data.type === 'CACHE_LESSON' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(MEDIA_CACHE).then((cache) =>
        Promise.all(
          data.urls.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok || response.type === 'opaque') {
                await cache.put(url, response.clone());
              }
            } catch {
              // Leave the resource uncached — the caller reports it as failed.
            }
          }),
        ),
      ),
    );
  }
});
