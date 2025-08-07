const CACHE_NAME = 'video-pwa-cache-v1';
const OFFLINE_DB_NAME = 'offline-videos-db';
const OFFLINE_STORE_NAME = 'videos';

const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    'https://cdn.tailwindcss.com',
    // Add the local video URLs to the cache list for precaching
    'video1.mp4',
    'video2.mp4',
    'video3.mp4',
];

// Install event: caches the app shell and videos
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching app shell and videos');
            return cache.addAll(urlsToCache);
        })
        .catch(error => console.error('[Service Worker] Failed to cache on install', error))
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    event.waitUntil(self.clients.claim());
});

// Function to open IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
                db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        request.onerror = event => {
            reject('Error opening database');
        };
    });
}

// Fetch event: serves content from IndexedDB or cache, otherwise fetches from network.
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Serve app shell assets and precached videos from cache-first strategy
    if (urlsToCache.includes(requestUrl.pathname) || requestUrl.hostname === 'cdn.tailwindcss.com') {
        event.respondWith(
            caches.match(event.request)
            .then(response => response || fetch(event.request))
        );
        return;
    }

    // Handle video requests
    event.respondWith(
        (async () => {
            const db = await openIndexedDB();
            const transaction = db.transaction([OFFLINE_STORE_NAME], 'readonly');
            const store = transaction.objectStore(OFFLINE_STORE_NAME);
            
            // Check if the video is in IndexedDB by its URL
            const videoData = await new Promise(resolve => {
                const request = store.get(requestUrl.href);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });

            if (videoData && videoData.blob) {
                console.log('[Service Worker] Serving video from IndexedDB:', requestUrl.href);
                return new Response(videoData.blob, {
                    headers: { 'Content-Type': 'video/mp4' }
                });
            } else {
                console.log('[Service Worker] Video not in IndexedDB, fetching from network:', requestUrl.href);
                // Video is not cached, so fetch it from the network
                return fetch(event.request);
            }
        })()
    );
});

// Listen for messages from the main page to handle sync requests
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'syncVideo') {
        const video = event.data.video;
        const videoId = video.id;
        const videoUrl = video.url;

        (async () => {
            try {
                // Fetch the video data
                const response = await fetch(videoUrl);
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                const videoBlob = await response.blob();
                
                // Store the video blob and its metadata in IndexedDB
                const db = await openIndexedDB();
                const transaction = db.transaction([OFFLINE_STORE_NAME], 'readwrite');
                const store = transaction.objectStore(OFFLINE_STORE_NAME);
                store.put({ id: videoUrl, title: video.title, blob: videoBlob });

                await transaction.oncomplete;
                console.log(`[Service Worker] Video synced: ${video.title}`);

                // Send a message back to the main page to update the UI
                event.source.postMessage({
                    action: 'syncComplete',
                    videoId: videoId
                });

            } catch (error) {
                console.error(`[Service Worker] Failed to sync video: ${video.title}`, error);
                event.source.postMessage({
                    action: 'syncError',
                    videoId: videoId
                });
            }
        })();
    }
});
