const { extractHtmlFromDocx } = require('../services/docxParser.service');
const { extractTables, getTimetableJson } = require('../services/tableExtractor.service');
const { saveTimetableData } = require('../services/firestore.service');

// Store last parsed result in memory (optional, kept for compatibility)
let lastParsedData = null;

const uploadTimetable = async (req, res, next) => {
  try {
    const { semester, section } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!semester || !section) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semester and Section are required in the request body.' 
      });
    }

    // 1. Convert Docx to HTML
    const html = await extractHtmlFromDocx(req.file.buffer);

    // 2. Extract Data (both formats)
    const facultyMappedData = extractTables(html);
    const timetableJson = getTimetableJson(html);

    // Validate parsing
    if (!timetableJson.schedule || timetableJson.schedule.length === 0) {
      return res.status(422).json({ 
        success: false, 
        message: 'Parsing failed: No timetable structure detected in the document.' 
      });
    }

    // 3. Store to Firestore
    const firestoreResult = await saveTimetableData({
      semester,
      section,
      schedule: timetableJson.schedule,
      freeSlots: timetableJson.freeSlots
    });

    lastParsedData = facultyMappedData;

    res.status(200).json({
      success: true,
      message: 'Timetable uploaded and stored successfully.',
      details: firestoreResult,
      data: facultyMappedData // Returning faculty map for frontend if needed
    });

  } catch (error) {
    console.error('Upload & Storage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during processing'
    });
  }
};

const getData = () => lastParsedData;

module.exports = { uploadTimetable, getData };
