const express = require('express');
const router = express.Router();
const authInfo = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { getMe } = require('../controllers/auth.controller');

/**
 * GET /api/me
 * Standardized endpoint to fetch current user profile and role.
 */
router.get('/me', authInfo, checkRole(['admin', 'faculty']), getMe);

module.exports = router;
