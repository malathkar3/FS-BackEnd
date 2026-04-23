const express = require('express');
const router = express.Router();
const authInfo = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const { getMyTimetable } = require('../controllers/faculty.controller');

/**
 * GET /api/me
 * Returns the logged-in user's role and Firestore profile (including displayName).
 * Used by the frontend to identify faculty by their stored name.
 */
router.get('/me', authInfo, checkRole(['admin', 'faculty']), (req, res) => {
  const profile = req.user?.profile || {};
  res.status(200).json({
    success: true,
    uid: req.user.uid,
    email: req.user.email,
    role: req.user.role,
    displayName: profile.displayName || profile.name || null,
    profile
  });
});

/**
 * GET /api/dashboard
 * Accessible to both faculty and admin.
 */
router.get('/dashboard', authInfo, checkRole(['admin', 'faculty']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Dashboard',
    user: req.user
  });
});

/**
 * GET /api/my-timetable
 * Automatically matches the logged-in user's name with the timetable.
 */
router.get('/my-timetable', authInfo, checkRole(['admin', 'faculty']), getMyTimetable);

/**
 * GET /api/admin
 * Only accessible to admin.
 */
router.get('/admin', authInfo, checkRole('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin',
    user: req.user
  });
});

/**
 * GET /api/faculty
 * Only accessible to faculty.
 */
router.get('/faculty', authInfo, checkRole('faculty'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Faculty',
    user: req.user
  });
});

module.exports = router;
