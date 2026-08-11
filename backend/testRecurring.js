const db = require('./config/db');
const { initCronJobs } = require('./services/cronService');

async function testRecurring() {
  console.log('Running test script...');
  
  // 1. Manually ensure table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurring_schedules (
      id VARCHAR(255) PRIMARY KEY,
      requester_id VARCHAR(255),
      category VARCHAR(50),
      description TEXT,
      location_id VARCHAR(255),
      day_of_week INT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    );
  `);
  console.log('Table recurring_schedules ensured.');

  // 2. We could test the cron job logic here directly
  const currentDayOfWeek = new Date().getDay();
  const schedules = await db.query(
    'SELECT * FROM recurring_schedules WHERE day_of_week = ? AND is_active = TRUE', 
    [currentDayOfWeek]
  );
  console.log(`Found ${schedules.length} recurring schedules for today.`);
  
  console.log('Done.');
  process.exit(0);
}

testRecurring();
