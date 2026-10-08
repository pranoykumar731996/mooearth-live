// ============================================================
// MooEarth Live — PWA Service Worker
// ============================================================

const CACHE_NAME = 'mooearth-live-v6';

// Assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/file.svg',
  '/globe.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests (like Firebase Firestore POST/writes or auth state updates)
  if (event.request.method !== 'GET') {
    return;
  }

  // Only intercept HTTP/HTTPS requests (ignores chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML documents / page loads) -> Network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response and save it to the cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network is offline, attempt to find in cache, otherwise fallback to root app shell
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 2. Static Assets (Next.js chunks, fonts, textures, SVGs, audio) -> Cache first, fallback to network
  const isStatic = 
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/textures/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.mp3');

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache, and perform stale-while-revalidate background update
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Ignore background errors when offline */});
          return cachedResponse;
        }

        // Cache miss -> Fetch from network and save to cache
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Dynamic requests (APIs, dynamic feeds, remote assets) -> Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful dynamic GET responses for offline reading fallback
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

// ============================================================
// PWA Re-Engagement: Web Push & Streak Notification Listeners
// ============================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'MooEarth Live — Planetary Alert',
    body: 'Your daily Earth streak is about to expire! Complete today\'s 3-minute challenge.',
    url: '/daily',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/daily',
    },
    actions: [
      { action: 'open', title: 'Open Challenge' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/daily';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Build Timestamp: 2026-10-08T19:53:35.638Z
