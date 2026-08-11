/**
 * Firebase Client SDK Configuration for NEAP Frontend
 * Used for getting real FCM device tokens for Web Push notifications.
 *
 * Project: neap-461a1
 * Console: https://console.firebase.google.com/project/neap-461a1
 */
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey           : 'AIzaSyC6PH9VW0ldgvbo0_5bPP09vfN0bhh-fYw',
  authDomain       : 'neap-461a1.firebaseapp.com',
  projectId        : 'neap-461a1',
  storageBucket    : 'neap-461a1.firebasestorage.app',
  messagingSenderId: '302863679999',
  appId            : '1:302863679999:web:c3ab2924a5a3ee88cbe7ca',
  measurementId    : 'G-FTBHKKY69M'
};

// VAPID key for Web Push authentication (from Firebase Cloud Messaging settings)
export const VAPID_KEY = 'BP05uXLZVMKEvy0P2p7PVi84K9Ib62AH8W0Um4nFU7sEXZYIsHG9tW2ev_VSt5Ynj0p4GR3qTBlQ21OzZlrsFKQ';

// Initialize Firebase app (only once — prevent duplicate app error in HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get Firebase Messaging instance
// Note: messaging() will throw in non-browser envs — guard it
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('[Firebase] Messaging not available in this environment:', e.message);
}

export { app, messaging, getToken, onMessage };
export default firebaseConfig;
