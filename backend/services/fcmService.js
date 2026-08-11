const db = require('../config/db');
const { decrypt } = require('./cryptoService');
const { getMessaging } = require('../config/firebase');

/**
 * Firebase Cloud Messaging (FCM) Push Notification Service
 * Sends REAL mobile push notifications to volunteer devices via Firebase Admin SDK.
 * Volunteers must have the app open at least once to register their FCM token.
 */
const fcmService = {};

/**
 * Send a WELCOME push notification to a newly registered volunteer.
 * Called from auth.routes.js after successful volunteer registration.
 *
 * @param {string} fcmToken  - The volunteer's FCM device token
 * @param {string} name      - Volunteer's name
 * @param {string} phone     - Volunteer's phone number (for display)
 */
fcmService.sendWelcomeNotification = async function ({ fcmToken, name, phone }) {
  if (!fcmToken) {
    console.log('[FCM] No FCM token for welcome notification — skipping.');
    return { success: false, reason: 'no_token' };
  }

  try {
    const messaging = getMessaging();
    const maskedPhone = phone
      ? phone.replace(/(\d{2})(\d+)(\d{2})/, (_, a, mid, b) => `${a}${'*'.repeat(mid.length)}${b}`)
      : '';

    const message = {
      token: fcmToken,
      notification: {
        title: `🎉 Welcome to NEAP, ${name}!`,
        body: maskedPhone
          ? `Your number ${maskedPhone} is registered. You'll get alerts when seniors nearby need help.`
          : `You're now a NEAP volunteer! You'll receive real-time alerts when seniors need assistance.`
      },
      webpush: {
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'neap-welcome',
          renotify: false,
          requireInteraction: false
        },
        fcmOptions: {
          link: '/volunteer'
        }
      },
      android: {
        notification: {
          icon: 'notification_icon',
          color: '#16a34a',
          sound: 'default',
          channelId: 'neap_welcome'
        }
      }
    };

    const response = await messaging.send(message);
    console.log(`\n✅ [FCM] Welcome push sent to ${name} (${maskedPhone || 'no phone'}). Message ID: ${response}`);
    return { success: true, messageId: response };
  } catch (err) {
    console.error('[FCM] Welcome notification error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send a TASK ALERT push notification to ALL verified volunteers when a neighbour raises a request.
 * Uses Firebase Admin SDK multicast to send to all registered FCM tokens simultaneously.
 *
 * @param {object} task          - The created task object
 * @param {string} requesterName - Senior's name
 * @param {object} io            - Socket.IO instance for real-time in-app alerts
 */
fcmService.notifyVolunteersNewTask = async function ({ task, requesterName, io }) {
  try {
    console.log(`\n===================================================================================`);
    console.log(`🔥 FIREBASE FCM PUSH NOTIFICATION FOR TASK #${task.id.substring(0, 6)}`);
    console.log(`   Category   : ${task.category.toUpperCase()}`);
    console.log(`   Description: "${task.description}"`);
    console.log(`===================================================================================\n`);

    // 1. Fetch all verified volunteers with registered FCM tokens
    const volunteers = await db.query(`
      SELECT id, name, email, phone_encrypted, fcm_token
      FROM users
      WHERE role = 'volunteer' AND verification_status = 'verified' AND fcm_token IS NOT NULL
    `);

    const tokens = volunteers
      .map(v => v.fcm_token)
      .filter(t => t && t.trim() !== '');

    // 2. Build the push notification payload
    const notificationTitle  = `🚨 New Help Request from ${requesterName || 'Senior Neighbor'}`;
    const notificationBody   = `${task.category.toUpperCase()}: "${task.description}" — Urgency: ${(task.urgency || 'TODAY').toUpperCase()}`;

    const socketPayload = {
      title       : notificationTitle,
      body        : notificationBody,
      description : task.description,
      taskId      : task.id,
      category    : task.category,
      urgency     : task.urgency,
      requesterName: requesterName || 'Senior Neighbor',
      createdAt   : task.created_at || new Date().toISOString()
    };

    // 3. Send real FCM push via Firebase Admin SDK (multicast to all volunteer tokens)
    let fcmResult = { successCount: 0, failureCount: 0 };
    if (tokens.length > 0) {
      const messaging = getMessaging();

      const multicastMessage = {
        tokens,
        notification: {
          title: notificationTitle,
          body : notificationBody
        },
        webpush: {
          notification: {
            icon   : '/favicon.ico',
            badge  : '/favicon.ico',
            tag    : 'neap-task-alert',
            renotify: true,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
              { action: 'view',    title: '👀 View Task' },
              { action: 'dismiss', title: 'Dismiss'     }
            ]
          },
          fcmOptions: { link: '/volunteer' }
        },
        android: {
          priority: 'high',
          notification: {
            sound    : 'default',
            channelId: 'neap_tasks',
            priority : 'max',
            color    : '#2563eb'
          }
        },
        data: {
          taskId  : task.id,
          category: task.category,
          urgency : task.urgency || 'today',
          url     : '/volunteer'
        }
      };

      const batchResponse = await messaging.sendEachForMulticast(multicastMessage);
      fcmResult.successCount = batchResponse.successCount;
      fcmResult.failureCount = batchResponse.failureCount;

      // Log per-volunteer delivery result
      batchResponse.responses.forEach((resp, idx) => {
        const v = volunteers[idx];
        const rawPhone = v.phone_encrypted ? decrypt(v.phone_encrypted) : 'unknown';
        const phone    = rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`;
        if (resp.success) {
          console.log(`  ✅ FCM push delivered → ${v.name} (${phone}) | MsgID: ${resp.messageId}`);
        } else {
          console.warn(`  ❌ FCM push FAILED  → ${v.name} (${phone}) | Error: ${resp.error?.message}`);
        }
      });
    } else {
      console.log('[FCM] No verified volunteers with FCM tokens — push skipped.');
    }

    // 4. Also broadcast via Socket.IO for in-app real-time alert (for open tabs)
    if (io) {
      io.emit('volunteer:new_task_alert', socketPayload);
      console.log(`[FCM] Socket.IO broadcast emitted to all active volunteer sessions.`);
    }

    const notifiedList = volunteers.map(v => ({
      volunteerId: v.id,
      name       : v.name,
      phone      : v.phone_encrypted ? decrypt(v.phone_encrypted) : 'N/A'
    }));

    console.log(`\n✅ Firebase FCM push sent to ${fcmResult.successCount}/${tokens.length} volunteers!\n`);

    return {
      success      : true,
      notifiedCount: fcmResult.successCount,
      failedCount  : fcmResult.failureCount,
      volunteers   : notifiedList
    };
  } catch (err) {
    console.error('[FCM Service Error]:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send a RE-OPENED TASK push notification to all volunteers when a task is released by an assigned volunteer.
 */
fcmService.notifyTaskRelinquished = async function ({ task, releasingVolunteerName, reason, io }) {
  try {
    const requesterUser = await db.getOne('SELECT name FROM users WHERE id = ?', [task.requester_id]);
    const requesterName = requesterUser ? requesterUser.name : 'Senior Neighbor';

    const title = `⚡ Help Request Re-opened: ${task.category.toUpperCase()}`;
    const body = `${requesterName} still needs help with "${task.description}". Tap to claim first!`;

    const socketPayload = {
      title,
      body,
      taskId: task.id,
      category: task.category,
      urgency: task.urgency,
      requesterName,
      isReopened: true,
      createdAt: new Date().toISOString()
    };

    if (io) {
      io.emit('volunteer:new_task_alert', socketPayload);
      io.emit('feed:refresh');
      io.to(`task:${task.id}`).emit('task:relinquished', {
        taskId: task.id,
        reason: reason || 'Volunteer had an emergency'
      });
    }

    // Multicast FCM push to all verified volunteers
    const volunteers = await db.query(`
      SELECT fcm_token FROM users 
      WHERE role = 'volunteer' AND verification_status = 'verified' AND fcm_token IS NOT NULL
    `);
    const tokens = volunteers.map(v => v.fcm_token).filter(t => t && t.trim() !== '');

    if (tokens.length > 0) {
      const messaging = getMessaging();
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: {
          notification: {
            icon: '/favicon.ico',
            tag: 'neap-task-reopened',
            requireInteraction: true
          },
          fcmOptions: { link: '/volunteer' }
        },
        android: { priority: 'high' }
      });
    }

    return { success: true };
  } catch (err) {
    console.error('[FCM Relinquish Error]:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = fcmService;
