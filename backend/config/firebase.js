/**
 * Firebase Admin SDK Initializer (Modular API — firebase-admin v12+)
 * Used by the backend to send real FCM push notifications.
 */
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging }                 = require('firebase-admin/messaging');
const path                             = require('path');

let _messaging = null;

function getMessagingInstance() {
  if (!_messaging) {
    if (!getApps().length) {
      const serviceAccount = require(path.join(__dirname, 'firebase-service-account.json'));
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[Firebase Admin] Initialized — project:', serviceAccount.project_id);
    }
    _messaging = getMessaging();
  }
  return _messaging;
}

module.exports = { getMessaging: getMessagingInstance };
