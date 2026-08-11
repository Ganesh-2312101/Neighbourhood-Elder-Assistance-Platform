const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt } = require('../services/cryptoService');

// Fetch chat message history for an assigned task
router.get('/:taskId/messages', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify participant or admin
    const task = await db.getOne('SELECT requester_id, assigned_volunteer_id FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'admin' && req.user.id !== task.requester_id && req.user.id !== task.assigned_volunteer_id) {
      return res.status(403).json({ error: 'Not authorized to view messages for this task' });
    }

    const rows = await db.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.task_id = ?
      ORDER BY m.sent_at ASC
    `, [taskId]);

    const messages = rows.map(m => ({
      id: m.id,
      task_id: m.task_id,
      sender_id: m.sender_id,
      sender_name: m.sender_name,
      sender_role: m.sender_role,
      content: decrypt(m.content_encrypted),
      sent_at: m.sent_at
    }));

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message via HTTP REST (fallback to Socket.IO)
router.post('/:taskId/messages', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const task = await db.getOne('SELECT requester_id, assigned_volunteer_id, status FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.id !== task.requester_id && req.user.id !== task.assigned_volunteer_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to chat in this task' });
    }

    const msgId = uuidv4();
    const encryptedContent = encrypt(content.trim());

    await db.execute(`
      INSERT INTO messages (id, task_id, sender_id, content_encrypted)
      VALUES (?, ?, ?, ?)
    `, [msgId, taskId, req.user.id, encryptedContent]);

    const formattedMsg = {
      id: msgId,
      task_id: taskId,
      sender_id: req.user.id,
      sender_name: req.user.name,
      sender_role: req.user.role,
      content: content.trim(),
      sent_at: new Date().toISOString()
    };

    if (req.io) {
      req.io.to(`task:${taskId}`).emit('message:received', formattedMsg);
    }

    res.json({ success: true, message: formattedMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
