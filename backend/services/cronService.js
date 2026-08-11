const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const fcmService = require('./fcmService');

function initCronJobs(io) {
  // Run daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Starting daily recurring tasks check...');
    try {
      const currentDayOfWeek = new Date().getDay(); // 0 (Sun) to 6 (Sat)
      
      const schedules = await db.query(
        'SELECT * FROM recurring_schedules WHERE day_of_week = ? AND is_active = TRUE', 
        [currentDayOfWeek]
      );
      
      console.log(`[CRON] Found ${schedules.length} recurring tasks scheduled for today (day ${currentDayOfWeek}).`);

      for (const schedule of schedules) {
        const taskId = uuidv4();
        
        // Insert new task for today
        await db.execute(`
          INSERT INTO tasks (id, requester_id, category, description, urgency, status, location_id)
          VALUES (?, ?, ?, ?, 'today', 'pending', ?)
        `, [
          taskId, 
          schedule.requester_id, 
          schedule.category, 
          schedule.description, 
          schedule.location_id
        ]);

        // Audit log
        await db.execute(`
          INSERT INTO task_state_log (id, task_id, from_status, to_status, changed_by, reason)
          VALUES (?, ?, NULL, 'pending', ?, 'Task generated from recurring schedule')
        `, [uuidv4(), taskId, schedule.requester_id]);

        // Fetch task details for notification
        const createdTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
        const seniorUser = await db.getOne('SELECT name FROM users WHERE id = ?', [schedule.requester_id]);

        // Emit to feed
        if (io) {
          io.emit('task:created', createdTask);
          io.emit('feed:refresh');
        }

        // Notify volunteers
        await fcmService.notifyVolunteersNewTask({
          task: createdTask,
          requesterName: seniorUser ? seniorUser.name : 'Senior Neighbor',
          io: io
        });
      }
      
      console.log('[CRON] Daily recurring tasks generation completed.');
    } catch (err) {
      console.error('[CRON] Error running daily recurring tasks check:', err);
    }
  });

  console.log('Cron scheduler initialized.');
}

module.exports = {
  initCronJobs
};
