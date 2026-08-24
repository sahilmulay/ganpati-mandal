const CACHE_NAME = 'mandal-app-v5';
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
  './documents.html',
  './public.html',
  './dashboard',
  './donations',
  './expenses',
  './aarti',
  './events',
  './contacts',
  './reports',
  './documents',
  './public',
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
      console.log('[ServiceWorker] Pre-caching static assets v5');
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
            return caches.match('./public.html') || caches.match('./dashboard.html');
          }
        });
      });
    })
  );
});

/* Web Push Notification Listener (Shows alerts even when app/browser is closed) */
self.addEventListener('push', event => {
  let data = { title: '॥ वृंदावन गणेश मंडळ ॥', body: 'नवीन मंडळ सूचना उपलब्ध आहे.', icon: 'assets/icon.svg' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'assets/icon.svg',
    badge: 'assets/icon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || './dashboard.html' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/* Tap on Push Notification Opens Mandal App */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes('ganpati-mandal') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/* Background Delayed Notification Tester (triggers even after user minimizes/closes app) */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_TEST_NOTIFICATION') {
    setTimeout(() => {
      self.registration.showNotification('॥ श्री गणेशाय नमः ॥', {
        body: '🪔 संध्याकाळची महाआरती रात्री ८:०० वाजता सुरू होत आहे. सहकुटुंब उपस्थित राहावे!',
        icon: 'assets/icon.svg',
        badge: 'assets/icon.svg',
        vibrate: [200, 100, 200],
        data: { url: './dashboard.html' }
      });
    }, 5000);
  }
});

