// Kill switch. This origin used to host a video gallery PWA that registered a
// service worker at this path. Browsers that still have it will fetch this
// update, which clears its caches and unregisters, so they get the live site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
