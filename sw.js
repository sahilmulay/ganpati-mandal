const CACHE_NAME = 'mandal-app-v1';
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './donations.html',
  './expenses.html',
  './aarti.html',
  './events.html',
  './contacts.html',
  './reports.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/receipt_template.png',
  './assets/payment-qr.png',
  './assets/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Pre-caching offline static assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignore non-GET or cross-domain external calls if offline
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline mode */});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // If offline and request is an HTML page navigation, fallback to cached dashboard.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./dashboard.html');
        }
      });
    })
  );
});
