const CACHE_NAME = 'mandal-app-v2';
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
  './dashboard',
  './donations',
  './expenses',
  './aarti',
  './events',
  './contacts',
  './reports',
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
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('[ServiceWorker] Partial cache install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          let responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline / network errors
        let url = new URL(event.request.url);
        let path = url.pathname;
        let altPath = path.endsWith('.html') ? path.slice(0, -5) : path + '.html';

        return caches.match(altPath).then(altResponse => {
          if (altResponse) return altResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./dashboard.html') || caches.match('./index.html');
          }
        });
      });
    })
  );
});
