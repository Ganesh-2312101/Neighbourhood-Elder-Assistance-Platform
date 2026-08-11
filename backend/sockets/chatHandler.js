const db = require('../config/db');
const { encrypt, decrypt } = require('../services/cryptoService');
const { v4: uuidv4 } = require('uuid');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join task room
    socket.on('join:task', ({ taskId }) => {
      if (taskId) {
        socket.join(`task:${taskId}`);
        console.log(`Socket ${socket.id} joined room task:${taskId}`);
      }
    });

    // Leave task room
    socket.on('leave:task', ({ taskId }) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
      }
    });

    // Send real-time chat message
    socket.on('message:send', async ({ taskId, senderId, senderName, senderRole, content }) => {
      try {
        if (!taskId || !senderId || !content) return;

        const msgId = uuidv4();
        const encryptedContent = encrypt(content.trim());

        await db.execute(`
          INSERT INTO messages (id, task_id, sender_id, content_encrypted)
          VALUES (?, ?, ?, ?)
        `, [msgId, taskId, senderId, encryptedContent]);

        const payload = {
          id: msgId,
          task_id: taskId,
          sender_id: senderId,
          sender_name: senderName || 'User',
          sender_role: senderRole || 'user',
          content: content.trim(),
          sent_at: new Date().toISOString()
        };

        io.to(`task:${taskId}`).emit('message:received', payload);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};
