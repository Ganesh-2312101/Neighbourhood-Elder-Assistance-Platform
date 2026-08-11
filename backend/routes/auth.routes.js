const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const { authenticateToken } = require('../middleware/auth');
const { encrypt } = require('../services/cryptoService');
const fcmService = require('../services/fcmService');

// User Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, latitude, longitude, approximate_area_text, full_address, radius_miles, trusted_contact_name, trusted_contact_phone, trusted_contact_relation, age, mobility_needs, landmark } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const existing = await db.getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const phone_encrypted = phone ? encrypt(phone) : null;
    
    // Default verification status: volunteers need ID upload, seniors/admins auto-verified for MVP
    const verification_status = role === 'volunteer' ? 'pending' : 'verified';

    await db.execute(`
      INSERT INTO users (id, role, name, email, phone_encrypted, password_hash, verification_status, accessibility_prefs, trusted_contact_name, trusted_contact_phone, trusted_contact_relation, age, mobility_needs, landmark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, role, name, email, phone_encrypted, password_hash, verification_status, JSON.stringify({ font_scale: 1.0, high_contrast: false, voice_enabled: true }), trusted_contact_name || null, trusted_contact_phone || null, trusted_contact_relation || null, age || null, mobility_needs || 'Standard Support', landmark || null]);

    // Save location
    const locId = uuidv4();
    const lat = latitude || 9.1712;
    const lon = longitude || 77.8695;
    await db.execute(`
      INSERT INTO locations (id, user_id, label, latitude, longitude, approximate_area_text, full_address, radius_miles)
      VALUES (?, ?, 'home', ?, ?, ?, ?, ?)
    `, [locId, userId, lat, lon, approximate_area_text || 'Local Area', full_address || 'Neighborhood Location', radius_miles || 3.0]);

    const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
    const user = await db.getOne('SELECT id, role, name, email, verification_status, accessibility_prefs, trusted_contact_name, trusted_contact_phone, trusted_contact_relation, age, mobility_needs, landmark FROM users WHERE id = ?', [userId]);

    // --- REAL FIREBASE FCM WELCOME PUSH NOTIFICATION for Volunteer Registration ---
    // The FCM token won't be available yet at registration time (it's registered by
    // the frontend after the user grants notification permission). We store it in DB
    // via POST /api/auth/fcm-token. This log confirms the registration event.
    if (role === 'volunteer') {
      const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91 ${phone}`) : 'N/A';
      console.log(`\n===================================================================================`);
      console.log(`📱 VOLUNTEER REGISTERED — FCM WELCOME PUSH WILL BE SENT AFTER TOKEN REGISTRATION`);
      console.log(`   Volunteer : ${name}`);
      console.log(`   Phone     : ${formattedPhone}`);
      console.log(`   Note      : Frontend will call POST /api/auth/fcm-token to register device.`);
      console.log(`===================================================================================\n`);
    }

    res.json({ token, user, userId });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db.getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Parse accessibility prefs if string
    let accessibility_prefs = {};
    try {
      accessibility_prefs = JSON.parse(user.accessibility_prefs || '{}');
    } catch (e) {
      accessibility_prefs = {};
    }

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        verification_status: user.verification_status,
        verification_tier: user.verification_tier,
        accessibility_prefs,
        trusted_contact_name: user.trusted_contact_name,
        trusted_contact_phone: user.trusted_contact_phone,
        trusted_contact_relation: user.trusted_contact_relation,
        age: user.age,
        mobility_needs: user.mobility_needs,
        landmark: user.landmark
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Get current user profile & location
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const location = await db.getOne('SELECT * FROM locations WHERE user_id = ?', [req.user.id]);
    res.json({
      user: req.user,
      location
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update accessibility preferences
router.put('/accessibility', authenticateToken, async (req, res) => {
  try {
    const { prefs } = req.body;
    await db.execute('UPDATE users SET accessibility_prefs = ? WHERE id = ?', [JSON.stringify(prefs), req.user.id]);
    res.json({ success: true, prefs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update FCM Device Token + Send Welcome Push for first-time volunteer registration
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcm_token, is_new_registration } = req.body;
    if (!fcm_token) return res.status(400).json({ error: 'FCM token is required' });

    // Check if this user had a token before (to detect first-time registration)
    const existing = await db.getOne('SELECT fcm_token, name, phone_encrypted, role FROM users WHERE id = ?', [req.user.id]);
    const isFirstToken = !existing?.fcm_token;

    // Save/Update the real FCM device token in DB
    await db.execute('UPDATE users SET fcm_token = ? WHERE id = ?', [fcm_token, req.user.id]);

    // Send REAL Firebase welcome push notification for first-time volunteer token registration
    if ((isFirstToken || is_new_registration) && existing?.role === 'volunteer') {
      const { decrypt } = require('../services/cryptoService');
      const phone = existing.phone_encrypted ? decrypt(existing.phone_encrypted) : null;

      // Fire-and-forget — don't block the response
      fcmService.sendWelcomeNotification({
        fcmToken: fcm_token,
        name    : existing.name,
        phone   : phone
      }).then(result => {
        if (result.success) {
          console.log(`[FCM] Welcome push delivered to ${existing.name} | MsgID: ${result.messageId}`);
        } else {
          console.warn(`[FCM] Welcome push not delivered: ${result.reason || result.error}`);
        }
      });
    }

    res.json({ success: true, message: 'FCM token registered', isFirstToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
