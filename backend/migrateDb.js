const db = require('./config/db');

async function runMigrations() {
  console.log('Running MySQL Schema Migrations...');

  const columns = [
    'ALTER TABLE users ADD COLUMN trusted_contact_name VARCHAR(255);',
    'ALTER TABLE users ADD COLUMN trusted_contact_phone VARCHAR(50);',
    'ALTER TABLE users ADD COLUMN trusted_contact_relation VARCHAR(100);',
    'ALTER TABLE users ADD COLUMN age INT;',
    'ALTER TABLE users ADD COLUMN mobility_needs TEXT;',
    'ALTER TABLE users ADD COLUMN landmark TEXT;'
  ];

  for (const sql of columns) {
    try {
      await db.execute(sql);
      console.log('Successfully executed:', sql);
    } catch (e) {
      if (e.message.includes('Duplicate column name') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column already exists:', sql);
      } else {
        console.log('Migration note:', e.message);
      }
    }
  }

  const users = await db.query('SELECT id, name, email, age, mobility_needs, landmark, trusted_contact_name, trusted_contact_phone FROM users');
  console.log('Verified Database Columns! User count:', users ? users.length : 0);
  process.exit(0);
}

runMigrations();
