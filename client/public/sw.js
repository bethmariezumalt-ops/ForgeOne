// Service Worker for Acme Fleet Management PWA
const CACHE_NAME = 'acme-fleet-v5';

// Install event - skip waiting immediately to activate new SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean ALL old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for everything, no caching of JS/CSS
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // For ALL requests, always try network first, fall back to cache only if offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
