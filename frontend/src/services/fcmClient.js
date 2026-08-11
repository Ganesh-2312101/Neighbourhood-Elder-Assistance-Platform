/**
 * NEAP Frontend FCM Client — Real Firebase Cloud Messaging
 *
 * Scenarios:
 *  1. Volunteer registers → requestPermission() → real FCM token → backend → welcome push fires.
 *  2. Neighbour raises request → backend sends FCM multicast → device receives push even when app closed.
 *  3. App is open → Socket.IO broadcasts → showTaskNotification() shows in-app banner + sound.
 */
import api from './api';
import { messaging, getToken, onMessage, VAPID_KEY } from './firebaseConfig';

const fcmClient = {};

/**
 * Request notification permission, get a REAL Firebase FCM device token,
 * and register it with the NEAP backend.
 *
 * @param {boolean} isNewRegistration - Pass true when called from volunteer registration
 * @returns {Promise<string|null>} The FCM token, or null if denied/failed
 */
fcmClient.requestPermission = async function (isNewRegistration = false) {
  if (!('Notification' in window)) {
    console.warn('[FCM] Browser does not support notifications.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    console.log('[FCM] Notification permission granted!');

    // Register the service worker for Firebase background push handling
    let swRegistration = null;
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM] Service worker registered for background push.');
    } catch (swErr) {
      console.warn('[FCM] Service worker registration warning:', swErr.message);
    }

    if (!messaging) {
      console.warn('[FCM] Firebase messaging not available.');
      return null;
    }

    // Get the real FCM token using the VAPID key
    const fcmToken = await getToken(messaging, {
      vapidKey         : VAPID_KEY,
      serviceWorkerRegistration: swRegistration || undefined
    });

    if (!fcmToken) {
      console.warn('[FCM] No FCM token returned — user may be blocking notifications at OS level.');
      return null;
    }

    console.log('[FCM] Real FCM token obtained:', fcmToken.substring(0, 20) + '...');

    // Send the real token to the backend for storage & welcome push trigger
    try {
      await api.post('/auth/fcm-token', {
        fcm_token        : fcmToken,
        is_new_registration: isNewRegistration
      });
      console.log('[FCM] Token registered with NEAP backend successfully.');
    } catch (apiErr) {
      console.warn('[FCM] Token sync warning:', apiErr.message);
    }

    return fcmToken;
  } catch (err) {
    console.error('[FCM] requestPermission error:', err);
    return null;
  }
};

/**
 * Listen for FCM messages when the app is in the FOREGROUND.
 * This is needed because FCM doesn't show a notification when app is focused —
 * we manually show one via the Notification API.
 *
 * Call this once after the user has granted permission (e.g., in SocketContext or App.jsx).
 * @param {function} onClickNavigate - Callback when notification is clicked
 */
fcmClient.listenForeground = function (onClickNavigate) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);

    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    fcmClient.showTaskNotification(
      { title, body, taskId: data.taskId, category: data.category },
      onClickNavigate
    );
  });
};

/**
 * Show a welcome notification when a volunteer successfully registers.
 * The real push comes from the backend via Firebase Admin SDK.
 * This is a fallback in-browser notification shown immediately after registration.
 *
 * @param {string} volunteerName
 * @param {string} phone
 */
fcmClient.showWelcomeNotification = function ({ volunteerName, phone }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const maskedPhone = phone
      ? phone.replace(/(\d{2})(\d+)(\d{2})/, (_, a, mid, b) => `${a}${'*'.repeat(mid.length)}${b}`)
      : '';

    const n = new Notification(`🎉 Welcome to NEAP, ${volunteerName || 'Volunteer'}!`, {
      body: maskedPhone
        ? `Your number ${maskedPhone} is registered. You'll receive real alerts when seniors need help!`
        : `You're registered as a NEAP volunteer! Alerts will come whenever a senior needs help nearby.`,
      icon    : '/favicon.ico',
      tag     : 'neap-welcome',
      renotify: false
    });

    fcmClient.playChime();

    n.onclick = () => { window.focus(); n.close(); };
  } catch (e) {
    console.warn('[FCM] Welcome notification error:', e.message);
  }
};

/**
 * Show a task alert notification when a neighbour raises a help request.
 * Called by SocketContext when 'volunteer:new_task_alert' socket event fires (app open),
 * AND by listenForeground() when FCM foreground message arrives.
 *
 * @param {object}   payload          - { title, body, taskId, category, requesterName, description, urgency }
 * @param {function} [onClickNavigate]- Callback(taskId) when notification is clicked
 */
fcmClient.showTaskNotification = function (payload, onClickNavigate) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('[FCM] Permission not granted — skipping in-app notification.');
    return;
  }

  try {
    const title = payload.title || '🚨 New Help Request!';
    const body  = payload.body
      || `${payload.requesterName || 'A senior'} needs help: ${payload.description || payload.category}`;

    const n = new Notification(title, {
      body,
      icon    : '/favicon.ico',
      badge   : '/favicon.ico',
      tag     : 'neap-task-alert',
      renotify: true,
      data    : { taskId: payload.taskId, url: '/volunteer' }
    });

    fcmClient.playChime();

    n.onclick = () => {
      window.focus();
      n.close();
      if (typeof onClickNavigate === 'function') {
        onClickNavigate(payload.taskId);
      }
    };
  } catch (e) {
    console.warn('[FCM] Task notification error:', e.message);
  }
};

/**
 * Audio chime for new task alerts.
 */
fcmClient.playChime = function () {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
};

export default fcmClient;
