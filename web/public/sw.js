// Service Worker for Push Notifications
const CACHE_NAME = 'cifras-app-v1';
const urlsToCache = ['/', '/offline.html', '/icon-192x192.png', '/icon-512x512.png'];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }),
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
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
    title: 'Moni Kash',
    body: 'Você tem uma nova notificação!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icon-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icon-dismiss.png',
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
  console.log('Service Worker received message:', event.data);

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

console.log('Service Worker loaded successfully');
