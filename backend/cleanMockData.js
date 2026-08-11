const db = require('./config/db');

async function cleanMockData() {
  try {
    console.log('Cleaning all mock data from MySQL database...');

    // Delete tasks created by demo users or sample tasks
    await db.execute(`DELETE FROM tasks WHERE id LIKE '%demo%' OR id LIKE '%kovilpatti%' OR requester_id LIKE '%demo%' OR requester_id IN (SELECT id FROM users WHERE email IN ('senior@neap.org', 'volunteer@neap.org', 'pending.volunteer@neap.org'))`);

    // Delete locations of demo users or sample locations
    await db.execute(`DELETE FROM locations WHERE id LIKE '%demo%' OR id LIKE '%kovilpatti%' OR user_id LIKE '%demo%' OR user_id IN (SELECT id FROM users WHERE email IN ('senior@neap.org', 'volunteer@neap.org', 'pending.volunteer@neap.org'))`);

    // Delete demo users (keeping only admin accounts or real registered accounts)
    await db.execute(`DELETE FROM users WHERE email IN ('senior@neap.org', 'volunteer@neap.org', 'pending.volunteer@neap.org') OR id LIKE '%demo%'`);

    // Ensure Admin account exists
    const existingAdmin = await db.getOne(`SELECT * FROM users WHERE role = 'admin'`);
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passHash = await bcrypt.hash('password123', salt);
      await db.execute(`
        INSERT INTO users (id, role, name, email, password_hash, verification_status)
        VALUES ('admin-001', 'admin', 'Admin Coordinator', 'admin@neap.org', ?, 'verified')
      `, [passHash]);
      console.log('Admin account created: admin@neap.org');
    }

    const usersCount = await db.getOne(`SELECT COUNT(*) as count FROM users`);
    const tasksCount = await db.getOne(`SELECT COUNT(*) as count FROM tasks`);
    console.log(`Cleanup complete! Current Users count: ${usersCount.count}, Tasks count: ${tasksCount.count}`);

    process.exit(0);
  } catch (err) {
    console.error('Clean mock data error:', err.message);
    process.exit(1);
  }
}

cleanMockData();
