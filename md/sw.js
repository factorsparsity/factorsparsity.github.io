const CACHE_NAME = 'system1-md-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './courier-prime.woff2',
  './chicago.woff2'
];

// on install: cache all shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// fetch: prefer cache, fallback to network, and update cache
self.addEventListener('fetch', event => {
  const req = event.request;
  // For same-origin navigation (index.html) prefer network-first for updates
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // cache fonts and other assets
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          // avoid caching opaque third-party responses
          if (res && res.status === 200) cache.put(req, resClone);
        });
        return res;
      }).catch(() => {
        // fallback: maybe return a placeholder for images etc.
      });
    })
  );
});
