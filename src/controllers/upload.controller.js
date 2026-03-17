const { parseDocxToHtml } = require('../services/docxParser.service');
const { extractTables } = require('../services/tableExtractor.service');
const { analyzeTimetable } = require('../services/timetableAnalyser.service');

// Store last parsed result in memory
let lastParsedData = null;

const uploadTimetable = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const html = await parseDocxToHtml(req.file.buffer);
    const tables = extractTables(html);
    const data = analyzeTimetable(tables);

    lastParsedData = data;

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

const getData = () => lastParsedData;

module.exports = { uploadTimetable, getData };
