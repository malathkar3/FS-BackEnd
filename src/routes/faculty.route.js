const express = require('express');
const router = express.Router();
const {
  getFacultyList,
  getFacultySchedule,
  getFacultyFreeSlots,
  getSections,
  getSectionData
} = require('../controllers/faculty.controller');

router.get('/', getFacultyList);
router.get('/sections/all', getSections);
router.get('/sections/:id', getSectionData);
router.get('/:name/timetable', getFacultySchedule);
router.get('/:name/free-slots', getFacultyFreeSlots);

module.exports = router;
