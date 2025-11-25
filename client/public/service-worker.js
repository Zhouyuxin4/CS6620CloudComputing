/* eslint-disable no-restricted-globals */
// Service Worker for browser push notifications

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/notifications');
      }
    })
  );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: icon || '/logo192.png',
      badge: '/logo192.png',
      tag: tag || 'default',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: event.data.payload,
    });
  }
});

console.log('📡 Service Worker loaded');

