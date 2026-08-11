const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Store uploaded files in memory as Buffers for MySQL BLOB conversion
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Volunteer submit ID photo + selfie stored as BLOB inside MySQL
router.post('/upload-id', authenticateToken, upload.fields([{ name: 'id_card', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), async (req, res) => {
  try {
    const files = req.files;
    if (!files || !files.id_card || !files.selfie) {
      return res.status(400).json({ error: 'Both Government ID photo and selfie photo are required' });
    }

    const idCardFile = files.id_card[0];
    const selfieFile = files.selfie[0];

    const idCardUrl = `/api/verification/photo/${req.user.id}/id_card`;
    const selfieUrl = `/api/verification/photo/${req.user.id}/selfie`;

    await db.execute(`
      UPDATE users 
      SET id_card_blob = ?, id_card_mime = ?, id_card_url = ?,
          selfie_blob = ?, selfie_mime = ?, selfie_url = ?,
          verification_status = 'pending'
      WHERE id = ?
    `, [
      idCardFile.buffer, idCardFile.mimetype, idCardUrl,
      selfieFile.buffer, selfieFile.mimetype, selfieUrl,
      req.user.id
    ]);

    res.json({
      success: true,
      message: 'ID verification documents uploaded as BLOB to MySQL database successfully! An admin will review your profile shortly.',
      id_card_url: idCardUrl,
      selfie_url: selfieUrl,
      verification_status: 'pending'
    });
  } catch (err) {
    console.error('ID BLOB upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stream BLOB image directly from MySQL DB to browser <img> tags
router.get('/photo/:userId/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    if (type !== 'id_card' && type !== 'selfie') {
      return res.status(400).send('Invalid photo type');
    }

    const blobCol = type === 'id_card' ? 'id_card_blob' : 'selfie_blob';
    const mimeCol = type === 'id_card' ? 'id_card_mime' : 'selfie_mime';
    const urlCol = type === 'id_card' ? 'id_card_url' : 'selfie_url';

    const user = await db.getOne(`SELECT ${blobCol} AS blob_data, ${mimeCol} AS mime_type, ${urlCol} AS fallback_url FROM users WHERE id = ?`, [userId]);

    if (!user) {
      return res.status(404).send('Photo not found');
    }

    // If BLOB exists, stream it back with matching Content-Type header
    if (user.blob_data && user.blob_data.length > 0) {
      res.setHeader('Content-Type', user.mime_type || 'image/jpeg');
      return res.send(user.blob_data);
    }

    // Fallback if URL points to external demo image URL
    if (user.fallback_url && user.fallback_url.startsWith('http')) {
      return res.redirect(user.fallback_url);
    }

    return res.status(404).send('Photo binary data not found');
  } catch (err) {
    console.error('Fetch photo BLOB error:', err);
    res.status(500).send('Error retrieving photo BLOB from database');
  }
});

module.exports = router;
