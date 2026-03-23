const { extractHtmlFromDocx } = require('../services/docxParser.service');
const { extractTables } = require('../services/tableExtractor.service');

// Store last parsed result in memory
let lastParsedData = null;

const uploadTimetable = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // New extraction pipeline: Docx -> HTML -> Table Extractor
    const html = await extractHtmlFromDocx(req.file.buffer);
    const data = extractTables(html);

    // Validate that we actually found some faculty data
    if (!data || Object.keys(data).length === 0) {
      return res.status(422).json({ 
        success: false, 
        message: 'Parsing failed: No faculty or timetable structure detected in the document.' 
      });
    }

    lastParsedData = data;

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during parsing'
    });
  }
};

const getData = () => lastParsedData;

module.exports = { uploadTimetable, getData };
