const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { maskTaskPrivacy } = require('../middleware/privacy');

// Submit safety report or panic trigger
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { task_id, reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason for report required' });
    }

    const reportId = uuidv4();
    await db.execute(`
      INSERT INTO safety_reports (id, task_id, reporter_id, reason, status)
      VALUES (?, ?, ?, ?, 'open')
    `, [reportId, task_id || null, req.user.id, reason]);

    // If task_id provided, mark task as disputed
    if (task_id) {
      await db.execute(`UPDATE tasks SET status = 'disputed' WHERE id = ?`, [task_id]);
      await db.execute(`
        INSERT INTO task_state_log (id, task_id, from_status, to_status, changed_by, reason)
        VALUES (?, ?, 'active', 'disputed', ?, ?)
      `, [uuidv4(), task_id, req.user.id, `SAFETY PANIC: ${reason}`]);
    }

    if (req.io) {
      req.io.emit('admin:alert', { reportId, task_id, reporter_id: req.user.id, reason });
    }

    res.json({ success: true, message: 'Safety alert submitted to admins immediately.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read-only public share view for family / trusted contacts (No auth required)
router.get('/shared-task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await db.getOne(`
      SELECT t.id, t.category, t.description, t.urgency, t.status, t.created_at,
             l.approximate_area_text,
             req.name as senior_name,
             vol.name as volunteer_name, vol.verification_tier as volunteer_tier
      FROM tasks t
      JOIN locations l ON t.location_id = l.id
      JOIN users req ON t.requester_id = req.id
      LEFT JOIN users vol ON t.assigned_volunteer_id = vol.id
      WHERE t.id = ?
    `, [taskId]);

    if (!task) {
      return res.status(404).json({ error: 'Shared task not found' });
    }

    // Mask PII for public view
    res.json({
      task: {
        id: task.id,
        category: task.category,
        description: task.description,
        urgency: task.urgency,
        status: task.status,
        created_at: task.created_at,
        area: task.approximate_area_text,
        senior_first_name: task.senior_name.split(' ')[0],
        volunteer_first_name: task.volunteer_name ? task.volunteer_name.split(' ')[0] : null,
        volunteer_is_verified: task.volunteer_tier === 'id_reviewed'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
