const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require('./env');

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      // Create DB if it doesn't exist
      const tempConn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      await tempConn.end();
    } catch (err) {
      console.warn('MySQL DB auto-create check warning (using existing connection):', err.message);
    }

    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to NEAP MySQL database '${DB_NAME}' at ${DB_HOST}:${DB_PORT}`);
  }
  return pool;
}

const db = {};

// Helper to run SELECT queries returning array of rows
db.query = async function (sql, params = []) {
  const p = await getPool();
  const [rows] = await p.query(sql, params);
  return rows;
};

// Helper to run INSERT, UPDATE, DELETE returning { lastID, changes }
db.execute = async function (sql, params = []) {
  const p = await getPool();
  const [result] = await p.query(sql, params);
  return { lastID: result.insertId, changes: result.affectedRows };
};

// Helper to run SELECT queries returning a single row
db.getOne = async function (sql, params = []) {
  const p = await getPool();
  const [rows] = await p.query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
};

// Initialize MySQL DB schema & seed demo users
async function initDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        role VARCHAR(50) CHECK (role IN ('senior', 'volunteer', 'admin')),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_encrypted TEXT,
        password_hash TEXT NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'unverified',
        verification_tier VARCHAR(50) DEFAULT 'basic',
        id_card_url TEXT,
        selfie_url TEXT,
        id_card_blob LONGBLOB,
        id_card_mime VARCHAR(100),
        selfie_blob LONGBLOB,
        selfie_mime VARCHAR(100),
        accessibility_prefs TEXT,
        fcm_token TEXT,
        trusted_contact_name VARCHAR(255),
        trusted_contact_phone VARCHAR(50),
        trusted_contact_relation VARCHAR(100),
        age INT,
        mobility_needs TEXT,
        landmark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate columns if missing
    const alterColumns = [
      'trusted_contact_name VARCHAR(255)',
      'trusted_contact_phone VARCHAR(50)',
      'trusted_contact_relation VARCHAR(100)',
      'age INT',
      'mobility_needs TEXT',
      'landmark TEXT',
      'id_card_blob LONGBLOB',
      'id_card_mime VARCHAR(100)',
      'selfie_blob LONGBLOB',
      'selfie_mime VARCHAR(100)'
    ];
    for (const colDef of alterColumns) {
      try {
        await db.execute(`ALTER TABLE users ADD COLUMN ${colDef};`);
      } catch (e) {
        // Ignore duplicate column errors
      }
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        label VARCHAR(50) DEFAULT 'home',
        latitude DOUBLE NOT NULL,
        longitude DOUBLE NOT NULL,
        approximate_area_text TEXT,
        full_address TEXT NOT NULL,
        radius_miles DOUBLE DEFAULT 3.0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        requester_id VARCHAR(255),
        category VARCHAR(50) CHECK (category IN ('groceries', 'repair', 'tech', 'transport', 'other')),
        description TEXT NOT NULL,
        urgency VARCHAR(50) CHECK (urgency IN ('today', 'this_week')),
        status VARCHAR(50) DEFAULT 'pending',
        location_id VARCHAR(255),
        assigned_volunteer_id VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_volunteer_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS task_state_log (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        changed_by VARCHAR(255),
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        sender_id VARCHAR(255),
        content_encrypted LONGTEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    try {
      await db.execute('ALTER TABLE messages MODIFY COLUMN content_encrypted LONGTEXT NOT NULL;');
    } catch (e) {
      // Ignore if column is already LONGTEXT
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ratings (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        rater_id VARCHAR(255),
        ratee_id VARCHAR(255),
        stars INT CHECK(stars BETWEEN 1 AND 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS safety_reports (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        reporter_id VARCHAR(255),
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS declined_tasks (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255) NOT NULL,
        volunteer_id VARCHAR(255) NOT NULL,
        declined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY task_vol_idx (task_id, volunteer_id)
      );
    `);

    console.log('MySQL Database schema verified.');

    // Seed default Admin account if no admin user exists
    const existingAdmin = await db.getOne(`SELECT * FROM users WHERE role = 'admin'`);
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passHash = await bcrypt.hash('password123', salt);

      const adminId = 'admin-001';
      await db.execute(`
        INSERT INTO users (id, role, name, email, password_hash, verification_status)
        VALUES (?, 'admin', 'Admin Coordinator', 'admin@neap.org', ?, 'verified')
      `, [adminId, passHash]);

      console.log('MySQL Database initialized with default Admin account (admin@neap.org).');
    }
  } catch (err) {
    console.error('MySQL database init error:', err.message);
  }
}

initDatabase();

module.exports = db;
