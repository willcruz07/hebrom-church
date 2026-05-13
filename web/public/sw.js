// Service Worker for Push Notifications
const CACHE_NAME = 'hebrom-sys-v2';
const urlsToCache = ['/logo.png']; // '/' removido para evitar cache de redirect no Safari

// Install event - cache resources
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation of the new SW
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache v2');
      return cache.addAll(urlsToCache);
    }),
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Ignorar requisições de navegação — Safari não aceita SW servindo redirects em navigate
  if (event.request.mode === 'navigate') {
    return;
  }

  // Ignorar Firebase Storage, Firestore e métodos que não sejam GET (uploads)
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Hebrom Sys',
    body: 'Você tem uma nova notificação!',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'default',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/logo.png',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/logo.png',
      },
    ],
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: notificationData.data.timestamp,
    }),
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Default action or 'view' action
  const urlToOpen = action === 'view' ? notificationData.url || '/' : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      doBackgroundSync(),
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);

  // Track notification dismissal analytics if needed
  // const notificationData = event.notification.data || {};

  // You could send analytics data here
  // trackNotificationDismissal(notificationData);
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Helper function for background sync
async function doBackgroundSync() {
  try {
    // Sync offline actions, update caches, etc.
    console.log('Performing background sync...');

    // Example: sync offline chord saves, ratings, etc.
    // await syncOfflineActions();

    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    return Promise.reject(error);
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

