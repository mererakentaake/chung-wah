// public/firebase-messaging-sw.js
// Firebase Web Messaging service worker — handles background push notifications
// in the browser/desktop version of the app.
//
// ⚠️  Replace the firebaseConfig values below with your actual project values
//     from Firebase Console → Project Settings → General.
//     Do NOT use import.meta.env here — service workers cannot access Vite env vars.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'REPLACE_WITH_VITE_FIREBASE_API_KEY',
  authDomain:        'REPLACE_WITH_VITE_FIREBASE_AUTH_DOMAIN',
  projectId:         'REPLACE_WITH_VITE_FIREBASE_PROJECT_ID',
  storageBucket:     'REPLACE_WITH_VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId:             'REPLACE_WITH_VITE_FIREBASE_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'Chung Wah E-School', body = '' } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    icon:  '/school-crest.png',
    badge: '/school-crest.png',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
