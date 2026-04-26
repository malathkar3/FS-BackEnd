const fs = require('fs');
const path = require('path');
const { extractHtmlFromDocx } = require('./src/services/docxParser.service');
const { extractTables } = require('./src/services/tableExtractor.service');

async function testExtraction() {
  try {
    const docxPath = path.join(__dirname, 'sample_timetable.docx');
    const buffer = fs.readFileSync(docxPath);
    const html = await extractHtmlFromDocx(buffer);
    const result = extractTables(html);
    
    // Find a faculty that is likely showing the issue
    // (e.g. one that has some classes but mostly empty)
    const facultyNames = Object.keys(result);
    console.log("Found faculties:", facultyNames);
    
    if (facultyNames.length > 0) {
      const firstFaculty = facultyNames[0];
      console.log(`\nData for ${firstFaculty}:`);
      console.log(JSON.stringify(result[firstFaculty], null, 2));
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testExtraction();
