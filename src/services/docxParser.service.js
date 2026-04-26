const mammoth = require('mammoth');

/**
 * Convert DOCX buffer → HTML
 * Tables stay intact which is CRITICAL for parsing.
 */
const extractHtmlFromDocx = async (buffer) => {
  try {
    const result = await mammoth.convertToHtml({ buffer });

    if (!result.value) {
      throw new Error('Empty HTML from DOCX');
    }

    if (result.messages && result.messages.length > 0) {
      const warnings = result.messages.filter(m => m.type === 'warning');
      if (warnings.length > 0) {
        console.warn(`DOCX conversion warnings (${warnings.length}):`, warnings.map(w => w.message));
      }
    }

    console.log("HTML extracted successfully");
    return result.value;

  } catch (error) {
    console.error("DOCX → HTML error:", error);
    throw new Error("Failed to convert DOCX to HTML: " + error.message);
  }
};

module.exports = { extractHtmlFromDocx };