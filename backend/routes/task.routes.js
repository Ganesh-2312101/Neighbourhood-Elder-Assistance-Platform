const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { maskTaskPrivacy } = require('../middleware/privacy');
const { calculateDistanceMiles } = require('../services/geoService');
const { transitionTaskStatus } = require('../services/stateMachine');
const fcmService = require('../services/fcmService');

// Post a Request (Senior only)
router.post('/', authenticateToken, requireRole('senior', 'admin'), async (req, res) => {
  try {
    const { category, description, urgency, latitude, longitude, full_address, approximate_area_text } = req.body;

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    // Get senior's default location or create one
    let location = await db.getOne('SELECT * FROM locations WHERE user_id = ?', [req.user.id]);
    let locationId;

    if (!location) {
      locationId = uuidv4();
      await db.execute(`
        INSERT INTO locations (id, user_id, label, latitude, longitude, approximate_area_text, full_address, radius_miles)
        VALUES (?, ?, 'home', ?, ?, ?, ?, 2.0)
      `, [locationId, req.user.id, latitude || 40.7128, longitude || -74.0060, approximate_area_text || 'Neighborhood', full_address || 'Senior Residence']);
    } else {
      locationId = location.id;
      if (latitude && longitude && full_address) {
        await db.execute(`
          UPDATE locations 
          SET latitude = ?, longitude = ?, full_address = ?, approximate_area_text = ?
          WHERE id = ?
        `, [latitude, longitude, full_address, approximate_area_text || 'Neighborhood', locationId]);
      }
    }

    const taskId = uuidv4();
    await db.execute(`
      INSERT INTO tasks (id, requester_id, category, description, urgency, status, location_id)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `, [taskId, req.user.id, category, description, urgency || 'today', locationId]);

    // Initial audit log
    await db.execute(`
      INSERT INTO task_state_log (id, task_id, from_status, to_status, changed_by, reason)
      VALUES (?, ?, NULL, 'pending', ?, 'Task created')
    `, [uuidv4(), taskId, req.user.id]);

    const createdTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);

    // Fetch requester name for notification
    const seniorUser = await db.getOne('SELECT name FROM users WHERE id = ?', [req.user.id]);

    // Notify connected Socket.IO sockets
    if (req.io) {
      req.io.emit('task:created', createdTask);
    }

    // Trigger FCM Mobile Push & SMS Notifications to Volunteer Phone Numbers
    const notifResult = await fcmService.notifyVolunteersNewTask({
      task: createdTask,
      requesterName: seniorUser ? seniorUser.name : 'Senior Neighbor',
      io: req.io
    });

    res.json({
      success: true,
      task: createdTask,
      notificationSummary: {
        notifiedVolunteersCount: notifResult?.notifiedCount || 0,
        smsBody: notifResult?.smsBody || ''
      }
    });
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SOS Emergency Route (Senior only)
router.post('/sos', authenticateToken, requireRole('senior', 'admin'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Get senior's default location or create one
    let location = await db.getOne('SELECT * FROM locations WHERE user_id = ?', [req.user.id]);
    let locationId;

    if (!location) {
      locationId = uuidv4();
      await db.execute(`
        INSERT INTO locations (id, user_id, label, latitude, longitude, approximate_area_text, full_address, radius_miles)
        VALUES (?, ?, 'home', ?, ?, 'Emergency Location', 'Emergency Location', 2.0)
      `, [locationId, req.user.id, latitude || 40.7128, longitude || -74.0060]);
    } else {
      locationId = location.id;
      // If live location is provided, update the location coordinates specifically for this SOS event.
      // Alternatively, we could create a new temporary location, but updating existing home location is fine for now
      // as they might be away from home.
      if (latitude && longitude) {
        await db.execute(`
          UPDATE locations 
          SET latitude = ?, longitude = ?
          WHERE id = ?
        `, [latitude, longitude, locationId]);
      }
    }

    const taskId = uuidv4();
    const emergencyDescription = '[EMERGENCY SOS] Immediate assistance required! Location provided.';
    
    await db.execute(`
      INSERT INTO tasks (id, requester_id, category, description, urgency, status, location_id)
      VALUES (?, ?, 'other', ?, 'today', 'pending', ?)
    `, [taskId, req.user.id, emergencyDescription, locationId]);

    // Initial audit log
    await db.execute(`
      INSERT INTO task_state_log (id, task_id, from_status, to_status, changed_by, reason)
      VALUES (?, ?, NULL, 'pending', ?, 'Emergency SOS Triggered')
    `, [uuidv4(), taskId, req.user.id]);

    const createdTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const seniorUser = await db.getOne('SELECT name FROM users WHERE id = ?', [req.user.id]);

    // Notify connected Socket.IO sockets with a special event
    if (req.io) {
      req.io.emit('task:sos', createdTask); // New event type
      req.io.emit('task:created', createdTask); // Also emit normal create for feed update
    }

    // Trigger FCM Mobile Push & SMS Notifications
    const notifResult = await fcmService.notifyVolunteersNewTask({
      task: createdTask,
      requesterName: seniorUser ? seniorUser.name : 'Senior Neighbor',
      io: req.io
    });

    res.json({
      success: true,
      task: createdTask,
      notificationSummary: {
        notifiedVolunteersCount: notifResult?.notifiedCount || 0,
        smsBody: notifResult?.smsBody || ''
      }
    });
  } catch (err) {
    console.error('SOS task creation error:', err);
    res.status(500).json({ error: err.message });
  }
});


// Localized Task Feed (Volunteer or Admin)
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    // Get current user location
    let userLoc = await db.getOne('SELECT * FROM locations WHERE user_id = ?', [req.user.id]);
    let userLat = userLoc ? userLoc.latitude : 9.1712;
    let userLon = userLoc ? userLoc.longitude : 77.8695;

    // Fallback to local region default if lat/lon are missing or set to US defaults
    if (userLat > 30 || userLon < 0) {
      userLat = 9.1712;
      userLon = 77.8695;
    }

    // Fetch all pending or active tasks, excluding tasks declined by this volunteer
    const tasks = await db.query(`
      SELECT 
        t.*,
        l.latitude, l.longitude, l.approximate_area_text, l.full_address,
        u.name as requester_name, u.age as requester_age, u.mobility_needs as requester_mobility_needs, u.phone_encrypted as requester_phone_encrypted, u.trusted_contact_phone as requester_trusted_contact_phone
      FROM tasks t
      JOIN locations l ON t.location_id = l.id
      JOIN users u ON t.requester_id = u.id
      WHERE t.status IN ('pending', 'assigned', 'in_progress')
        AND t.id NOT IN (SELECT task_id FROM declined_tasks WHERE volunteer_id = ?)
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    // Calculate distance for sorting & privacy masking
    const feed = tasks.map(t => {
      const distance = calculateDistanceMiles(userLat, userLon, t.latitude, t.longitude);
      const masked = maskTaskPrivacy(t, req.user.id);
      return {
        ...masked,
        distance_miles: distance
      };
    })
    .sort((a, b) => {
      // 1. Urgency: 'today' before 'this_week'
      if (a.urgency === 'today' && b.urgency !== 'today') return -1;
      if (a.urgency !== 'today' && b.urgency === 'today') return 1;

      // 2. Distance: closer first
      if (a.distance_miles !== b.distance_miles) {
        return a.distance_miles - b.distance_miles;
      }

      // 3. Recency: newer first
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({ feed });
  } catch (err) {
    console.error('Feed fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's own tasks (Senior's created requests or Volunteer's claimed tasks)
router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    let sql = '';
    let params = [];

    if (req.user.role === 'senior') {
      sql = `
        SELECT t.*, l.approximate_area_text, l.full_address, v.name as volunteer_name, v.phone_encrypted as volunteer_phone_encrypted, v.selfie_url as volunteer_photo, v.id_card_url as volunteer_id_photo, v.verification_status as volunteer_verified
        FROM tasks t
        JOIN locations l ON t.location_id = l.id
        LEFT JOIN users v ON t.assigned_volunteer_id = v.id
        WHERE t.requester_id = ?
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id];
    } else {
      sql = `
        SELECT t.*, l.approximate_area_text, l.full_address, u.name as requester_name, u.phone_encrypted as requester_phone_encrypted, u.age as requester_age, u.mobility_needs as requester_mobility_needs, u.trusted_contact_phone as requester_trusted_contact_phone
        FROM tasks t
        JOIN locations l ON t.location_id = l.id
        JOIN users u ON t.requester_id = u.id
        WHERE t.assigned_volunteer_id = ?
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id];
    }

    const tasks = await db.query(sql, params);
    const maskedTasks = tasks.map(t => maskTaskPrivacy(t, req.user.id));
    res.json({ tasks: maskedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await db.getOne(`
      SELECT t.*, l.latitude, l.longitude, l.approximate_area_text, l.full_address,
             req.name as requester_name, req.phone_encrypted as requester_phone_encrypted,
             vol.name as volunteer_name, vol.phone_encrypted as volunteer_phone_encrypted, vol.selfie_url as volunteer_photo, vol.verification_status as volunteer_verification
      FROM tasks t
      JOIN locations l ON t.location_id = l.id
      JOIN users req ON t.requester_id = req.id
      LEFT JOIN users vol ON t.assigned_volunteer_id = vol.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const masked = maskTaskPrivacy(task, req.user.id);
    res.json({ task: masked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atomic Task Claim Endpoint (Volunteer only)
router.post('/:id/claim', authenticateToken, requireRole('volunteer', 'admin'), async (req, res) => {
  try {
    // Check if volunteer is verified
    if (req.user.role === 'volunteer' && req.user.verification_status !== 'verified') {
      return res.status(403).json({ error: 'Identity verification required before claiming tasks.' });
    }

    const updatedTask = await transitionTaskStatus(req.params.id, 'assigned', req.user.id, 'Volunteer claimed task', req.user.id);

    if (req.io) {
      req.io.to(`task:${req.params.id}`).emit('task:updated', updatedTask);
      req.io.emit('feed:refresh');
    }

    res.json({ success: true, task: maskTaskPrivacy(updatedTask, req.user.id) });
  } catch (err) {
    console.error('Claim error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Task status update (State machine transition)
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Target status required' });
    }

    const updatedTask = await transitionTaskStatus(req.params.id, status, req.user.id, reason);

    if (req.io) {
      req.io.to(`task:${req.params.id}`).emit('task:updated', updatedTask);
      req.io.emit('feed:refresh');
    }

    res.json({ success: true, task: maskTaskPrivacy(updatedTask, req.user.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Audit trail for a task
router.get('/:id/audit', authenticateToken, async (req, res) => {
  try {
    const logs = await db.query(`
      SELECT l.*, u.name as actor_name, u.role as actor_role
      FROM task_state_log l
      JOIN users u ON l.changed_by = u.id
      WHERE l.task_id = ?
      ORDER BY l.timestamp ASC
    `, [req.params.id]);

    res.json({ audit: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Rating
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { stars, comment, ratee_id } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Valid star rating (1-5) required' });
    }

    const ratingId = uuidv4();
    await db.execute(`
      INSERT INTO ratings (id, task_id, rater_id, ratee_id, stars, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [ratingId, req.params.id, req.user.id, ratee_id, stars, comment || '']);

    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Release/Cancel Accepted Task (Volunteer relinquishes task due to unexpected emergency)
router.post('/:id/release', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    // Transition status back to 'pending'
    const updatedTask = await transitionTaskStatus(
      req.params.id, 
      'pending', 
      req.user.id, 
      reason || 'Volunteer released task due to emergency'
    );

    // Track decline so releasing volunteer doesn't immediately reclaim it
    try {
      await db.execute(`
        INSERT INTO declined_tasks (id, task_id, volunteer_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE declined_at = CURRENT_TIMESTAMP
      `, [uuidv4(), req.params.id, req.user.id]);
    } catch (e) {
      console.warn('Declined track warning:', e.message);
    }

    // Re-broadcast push alert to all other nearby volunteers & notify senior
    await fcmService.notifyTaskRelinquished({
      task: updatedTask,
      releasingVolunteerName: req.user.name,
      reason,
      io: req.io
    });

    res.json({
      success: true,
      message: 'Task released back to pending pool. Forwarded to other nearby volunteers.',
      task: maskTaskPrivacy(updatedTask, req.user.id)
    });
  } catch (err) {
    console.error('Release error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Decline/Pass open task from volunteer feed
router.post('/:id/decline', authenticateToken, requireRole('volunteer', 'admin'), async (req, res) => {
  try {
    await db.execute(`
      INSERT INTO declined_tasks (id, task_id, volunteer_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE declined_at = CURRENT_TIMESTAMP
    `, [uuidv4(), req.params.id, req.user.id]);

    res.json({ success: true, message: 'Request declined and hidden from your feed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
