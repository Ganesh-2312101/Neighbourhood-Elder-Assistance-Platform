// NEAP Firebase Cloud Messaging Service Worker
// Handles REAL push notifications from Firebase when the app is fully closed or in background.
// Uses Firebase Messaging compat SDK (required in service workers — no ES module imports).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker with your project config
firebase.initializeApp({
  apiKey           : 'AIzaSyC6PH9VW0ldgvbo0_5bPP09vfN0bhh-fYw',
  authDomain       : 'neap-461a1.firebaseapp.com',
  projectId        : 'neap-461a1',
  storageBucket    : 'neap-461a1.firebasestorage.app',
  messagingSenderId: '302863679999',
  appId            : '1:302863679999:web:c3ab2924a5a3ee88cbe7ca'
});

// Get Firebase Messaging instance in the service worker
const messaging = firebase.messaging();

// Handle background push notifications sent by Firebase Admin SDK
// This fires when the app tab is CLOSED or in the BACKGROUND
messaging.onBackgroundMessage(function(payload) {
  console.log('[NEAP SW] Background push received:', payload);

  const notificationTitle = payload.notification?.title || '🚨 NEAP Help Alert';
  const notificationBody  = payload.notification?.body  || 'A senior neighbor nearby needs assistance!';
  const data              = payload.data || {};

  const options = {
    body   : notificationBody,
    icon   : '/favicon.ico',
    badge  : '/favicon.ico',
    tag    : 'neap-task-alert',
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: true,  // keeps the notification visible until user interacts
    data   : {
      url   : data.url    || '/volunteer',
      taskId: data.taskId || ''
    },
    actions: [
      { action: 'view',    title: '👀 View Task' },
      { action: 'dismiss', title: 'Dismiss'      }
    ]
  };

  self.registration.showNotification(notificationTitle, options);
});

// Handle notification click — open/focus the NEAP app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/volunteer';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If NEAP is already open in a tab — focus and navigate it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
