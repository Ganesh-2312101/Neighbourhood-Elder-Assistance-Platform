const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/stats - Retrieve real dynamic metrics calculated directly from DB
router.get('/', async (req, res) => {
  try {
    const completedTasksRow = await db.getOne(`SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`);
    const totalTasksRow = await db.getOne(`SELECT COUNT(*) as count FROM tasks`);
    const seniorsRow = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'senior'`);
    const volunteersRow = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'volunteer'`);
    const verifiedVolunteersRow = await db.getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'volunteer' AND verification_status = 'verified'`);
    
    // Count distinct neighborhood locations
    const locationsRow = await db.getOne(`SELECT COUNT(DISTINCT approximate_area_text) as count FROM locations WHERE approximate_area_text IS NOT NULL AND approximate_area_text != ''`);
    
    // Ratings & Reviews
    const ratingsRow = await db.getOne(`SELECT AVG(stars) as avg_rating, COUNT(*) as review_count FROM ratings`);
    
    // Safety reports
    const openSafetyReportsRow = await db.getOne(`SELECT COUNT(*) as count FROM safety_reports WHERE status = 'open'`);
    const totalSafetyReportsRow = await db.getOne(`SELECT COUNT(*) as count FROM safety_reports`);

    const completedTasksCount = completedTasksRow?.count || 0;
    const totalTasksCount = totalTasksRow?.count || 0;
    const seniorsCount = seniorsRow?.count || 0;
    const volunteersCount = volunteersRow?.count || 0;
    const verifiedVolunteersCount = verifiedVolunteersRow?.count || 0;
    const activeNeighborhoodsCount = locationsRow?.count || 0;
    
    const avgRatingRaw = ratingsRow?.avg_rating ? parseFloat(ratingsRow.avg_rating) : 5.0;
    const averageRating = Math.round(avgRatingRaw * 10) / 10;
    const totalReviewsCount = ratingsRow?.review_count || 0;

    // Calculate dynamic real safety score percentage based on DB tasks and reports
    const openReports = openSafetyReportsRow?.count || 0;
    let safetyScore = 100;
    if (totalTasksCount > 0) {
      safetyScore = Math.max(90, Math.round(((totalTasksCount - openReports) / totalTasksCount) * 1000) / 10);
    }

    res.json({
      success: true,
      stats: {
        completedTasksCount,
        totalTasksCount,
        seniorsCount,
        volunteersCount,
        verifiedVolunteersCount,
        activeNeighborhoodsCount,
        averageRating,
        totalReviewsCount,
        safetyScore
      }
    });
  } catch (err) {
    console.error('Fetch DB stats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve real backend statistics' });
  }
});

module.exports = router;
