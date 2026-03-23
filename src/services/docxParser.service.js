const mammoth = require('mammoth');

/**
 * Convert DOCX buffer → HTML
 * (Tables stay intact, which is CRITICAL for parsing)
 */
const extractHtmlFromDocx = async (buffer) => {
  try {
    const result = await mammoth.convertToHtml({ buffer });

    if (!result.value) {
      throw new Error('Empty HTML from DOCX');
    }

    const html = result.value;

    console.log("HTML extracted successfully");
    return html;

  } catch (error) {
    console.error("DOCX → HTML error:", error);
    throw new Error("Failed to convert DOCX to HTML: " + error.message);
  }
};

module.exports = { extractHtmlFromDocx };