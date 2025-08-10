const CACHE_NAME = 'macwrite-pwa-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  // Fonts
  '/chicago.woff2',
  '/courier-prime.woff2',
  // External libs cached for offline
  'https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js',
  'https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/idb-keyval.iife.min.js'
];

// Install - cache all app shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve cached files when offline
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // IndexedDB requests should pass through
  if (request.url.includes('/indexeddb/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        event.waitUntil(
          fetch(request).then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }).catch(() => {})
        );
        return cachedResponse;
      }
      return fetch(request).catch(() => cachedResponse);
    })
  );
});
