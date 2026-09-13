/* Service worker for Language Learner.
 *
 * Network-first: when online we always fetch the latest file and refresh the
 * cache, so updates show up on reload. We only fall back to the cache when the
 * network fails (offline), which keeps the app usable on a ride with no signal.
 * Bump CACHE whenever you want to guarantee old caches are evicted. */
const CACHE = 'langlearner-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './phrases.json',
  './manifest.webmanifest',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Only manage our own origin; let anything else go straight to the network.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache a fresh copy for offline use.
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        // Offline: serve the cached copy, falling back to the app shell.
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
