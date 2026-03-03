// Give the service worker access to FirebaseMessaging.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object

const firebaseConfig = {
  apiKey: "{{VITE_FIREBASE_API_KEY}}",
  authDomain: "{{VITE_FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{VITE_FIREBASE_PROJECT_ID}}",
  storageBucket: "{{VITE_FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{VITE_FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{VITE_FIREBASE_APP_ID}}"
};

// Tenta inicializar apenas se tiver config válida
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    // Log removed

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icon-192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.error('Falha ao inicializar Firebase no SW. Verifique a configuração.', e);
}
