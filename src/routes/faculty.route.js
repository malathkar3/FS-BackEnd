const express = require('express');
const router = express.Router();
const {
  getFacultyList,
  getFacultySchedule,
  getFacultyFreeSlots
} = require('../controllers/faculty.controller');

router.get('/', getFacultyList);
router.get('/:name/timetable', getFacultySchedule);
router.get('/:name/free-slots', getFacultyFreeSlots);

module.exports = router;
