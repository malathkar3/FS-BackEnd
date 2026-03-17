const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer.middleware');
const { uploadTimetable } = require('../controllers/upload.controller');

router.post('/', upload.single('file'), uploadTimetable);

module.exports = router;
