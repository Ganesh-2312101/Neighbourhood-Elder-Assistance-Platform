const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// Valid state transitions
const TRANSITIONS = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'pending', 'cancelled', 'disputed'],
  in_progress: ['completed', 'pending', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['cancelled', 'completed']
};

/**
 * Transition task status atomically and write to audit log
 */
async function transitionTaskStatus(taskId, targetStatus, userId, reason = null, volunteerId = null) {
  // Fetch current task
  const task = await db.getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
  if (!task) {
    throw new Error('Task not found');
  }

  const currentStatus = task.status;
  const allowed = TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    throw new Error(`Invalid state transition from '${currentStatus}' to '${targetStatus}'`);
  }

  // Atomic claim guard for 'assigned'
  if (targetStatus === 'assigned') {
    if (!volunteerId) {
      throw new Error('Volunteer ID required for claiming task');
    }

    const updateRes = await db.execute(`
      UPDATE tasks 
      SET status = 'assigned', assigned_volunteer_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'pending'
    `, [volunteerId, taskId]);

    if (updateRes.changes === 0) {
      throw new Error('Task was already claimed by another volunteer or is no longer pending.');
    }
  } else if (targetStatus === 'pending') {
    // Release / Reset task back to pending for other volunteers
    await db.execute(`
      UPDATE tasks 
      SET status = 'pending', assigned_volunteer_id = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [taskId]);
  } else {
    // Normal state transition update
    await db.execute(`
      UPDATE tasks 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [targetStatus, taskId]);
  }

  // Write audit log
  const logId = uuidv4();
  await db.execute(`
    INSERT INTO task_state_log (id, task_id, from_status, to_status, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [logId, taskId, currentStatus, targetStatus, userId, reason || 'Status transition']);

  // Fetch updated task
  const updatedTask = await db.getOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
  return updatedTask;
}

module.exports = {
  transitionTaskStatus,
  TRANSITIONS
};
