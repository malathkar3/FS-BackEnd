const express = require('express');
const router = express.Router();
const authInfo = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Existing controllers
const { uploadTimetable } = require('../controllers/upload.controller');
const { 
  getFacultyList, 
  getFacultySchedule, 
  getFacultyFreeSlots,
  getSections,
  getSectionData
} = require('../controllers/faculty.controller');

// Multer for upload
const upload = require('../middleware/multer.middleware');

/**
 * Requirement 5: Protected Routes
 */

/**
 * Admin-only route: POST /api/upload-timetable
 */
router.post('/upload-timetable', authInfo, checkRole('admin'), upload.single('file'), uploadTimetable);

/**
 * Faculty data routes
 */
// GET /api/faculty-data -> List all faculty
router.get('/faculty-data', authInfo, checkRole(['admin', 'faculty']), getFacultyList);

// Session/Section management routes
router.get('/faculty-data/sections/all', authInfo, checkRole(['admin', 'faculty']), getSections);
router.get('/faculty-data/sections/:id', authInfo, checkRole(['admin', 'faculty']), getSectionData);

// Detailed faculty info (accessible by both for dashboard/personal view)
router.get('/faculty-data/:name/timetable', authInfo, checkRole(['admin', 'faculty']), getFacultySchedule);
router.get('/faculty-data/:name/free-slots', authInfo, checkRole(['admin', 'faculty']), getFacultyFreeSlots);

module.exports = router;
