// Service Worker for GoRepireo Web Push Notifications
// This file must be at /public/sw.js to be served from root

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push messages from server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'GoRepireo Notification',
      body: event.data.text(),
      icon: '/icon.png',
      badge: '/icon.png'
    };
  }

  const options = {
    body: payload.body || 'New notification from GoRepireo',
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/icon.png',
    tag: payload.tag || 'repireo-notif',
    data: { url: payload.url || '/', orderId: payload.orderId },
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
    actions: payload.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'GoRepireo', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
