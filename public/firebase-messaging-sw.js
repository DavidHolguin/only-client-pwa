/* Firebase Cloud Messaging Service Worker - Only Home PWA */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAYaBcH0-4SGlolrf6pBIqw0UR7R2zZlT8',
  authDomain: 'only-home-ai-prod.firebaseapp.com',
  projectId: 'only-home-ai-prod',
  storageBucket: 'only-home-ai-prod.firebasestorage.app',
  messagingSenderId: '761070090235',
  appId: '1:761070090235:web:ba3d169e507cfa6f0b3d5e',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const { notification, data } = payload || {};
  const title = notification?.title || data?.title || 'Only Home';
  const body = notification?.body || data?.body || 'Actualización de tu pedido en tiempo real';
  const actionUrl = data?.action_url || data?.url || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [150, 50, 150],
    data: {
      action_url: actionUrl,
    },
    tag: data?.notification_id || 'only-home-delivery-update',
    renotify: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.action_url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
