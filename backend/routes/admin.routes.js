const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All endpoints require Admin role
router.use(authenticateToken, requireRole('admin'));

// Admin Dashboard Summary Stats
router.get('/stats', async (req, res) => {
  try {
    const totalSeniors = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'senior'`);
    const totalVolunteers = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'volunteer'`);
    const pendingVerifications = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'`);
    const activeTasks = await db.getOne(`SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'assigned', 'in_progress')`);
    const tasksCompleted = await db.getOne(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`);
    const openDisputes = await db.getOne(`SELECT COUNT(*) as count FROM safety_reports WHERE status = 'open'`);

    res.json({
      stats: {
        seniors: totalSeniors ? totalSeniors.count : 0,
        volunteers: totalVolunteers ? totalVolunteers.count : 0,
        pendingVerifications: pendingVerifications ? pendingVerifications.count : 0,
        activeTasks: activeTasks ? activeTasks.count : 0,
        tasksCompleted: tasksCompleted ? tasksCompleted.count : 0,
        openDisputes: openDisputes ? openDisputes.count : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real Activity Feed from Database
router.get('/activity', async (req, res) => {
  try {
    const activities = [];

    // 1. Recent Users registered
    const recentUsers = await db.query(`
      SELECT id, name, role, created_at 
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC 
      LIMIT 8
    `);
    for (const u of recentUsers) {
      activities.push({
        id: `user-${u.id}`,
        icon: u.role === 'senior' ? '👵' : '🙋‍♂️',
        color: u.role === 'senior' ? '#6366f1' : '#22c55e',
        text: `${u.role === 'senior' ? 'Senior' : 'Volunteer'} ${u.name} registered`,
        time: u.created_at,
        timestamp: new Date(u.created_at).getTime()
      });
    }

    // 2. Recent Safety Disputes
    const recentDisputes = await db.query(`
      SELECT r.id, r.task_id, r.created_at, u.name as reporter_name
      FROM safety_reports r
      JOIN users u ON r.reporter_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    for (const d of recentDisputes) {
      activities.push({
        id: `dispute-${d.id}`,
        icon: '🚨',
        color: '#ef4444',
        text: `Safety dispute reported by ${d.reporter_name}${d.task_id ? ` for Task #${d.task_id.substring(0, 6)}` : ''}`,
        time: d.created_at,
        timestamp: new Date(d.created_at).getTime()
      });
    }

    // 3. Recent Tasks created
    const recentTasks = await db.query(`
      SELECT t.id, t.category, t.status, t.created_at, u.name as requester_name
      FROM tasks t
      JOIN users u ON t.requester_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 8
    `);
    for (const t of recentTasks) {
      activities.push({
        id: `task-create-${t.id}`,
        icon: '📋',
        color: '#f59e0b',
        text: `New ${t.category || 'assistance'} task created by ${t.requester_name}`,
        time: t.created_at,
        timestamp: new Date(t.created_at).getTime()
      });
    }

    // 4. Task status changes
    const taskLogs = await db.query(`
      SELECT l.id, l.task_id, l.to_status, l.timestamp, u.name as actor_name
      FROM task_state_log l
      LEFT JOIN users u ON l.changed_by = u.id
      ORDER BY l.timestamp DESC
      LIMIT 8
    `);
    for (const log of taskLogs) {
      let icon = '🔄';
      let color = '#3b82f6';
      if (log.to_status === 'completed') { icon = '✅'; color = '#22c55e'; }
      else if (log.to_status === 'assigned') { icon = '🤝'; color = '#8b5cf6'; }
      
      activities.push({
        id: `log-${log.id}`,
        icon,
        color,
        text: `Task #${log.task_id ? log.task_id.substring(0, 6) : 'N/A'} status updated to '${log.to_status}'${log.actor_name ? ` by ${log.actor_name}` : ''}`,
        time: log.timestamp,
        timestamp: new Date(log.timestamp).getTime()
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const topActivities = activities.slice(0, 10);

    res.json({ activities: topActivities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List pending volunteer ID verifications
router.get('/verifications', async (req, res) => {
  try {
    const pending = await db.query(`
      SELECT id, name, email, verification_status, verification_tier, id_card_url, selfie_url, created_at
      FROM users
      WHERE role = 'volunteer' AND verification_status = 'pending'
      ORDER BY created_at ASC
    `);

    res.json({ verifications: pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or Reject volunteer verification
router.post('/verifications/:userId', async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'approve' | 'reject'
    const status = action === 'approve' ? 'verified' : 'rejected';
    const tier = action === 'approve' ? 'id_reviewed' : 'basic';

    await db.execute(`
      UPDATE users 
      SET verification_status = ?, verification_tier = ?
      WHERE id = ?
    `, [status, tier, req.params.userId]);

    res.json({ success: true, message: `Volunteer status set to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List safety alerts and disputes
router.get('/disputes', async (req, res) => {
  try {
    const disputes = await db.query(`
      SELECT r.*, u.name as reporter_name, t.description as task_description, t.status as task_status
      FROM safety_reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN tasks t ON r.task_id = t.id
      ORDER BY r.created_at DESC
    `);

    res.json({ disputes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve dispute
router.post('/disputes/:reportId/resolve', async (req, res) => {
  try {
    const { status } = req.body; // 'resolved' or 'dismissed'
    await db.execute(`UPDATE safety_reports SET status = ? WHERE id = ?`, [status || 'resolved', req.params.reportId]);
    res.json({ success: true, message: 'Dispute updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
