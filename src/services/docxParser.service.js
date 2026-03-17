const mammoth = require('mammoth');

const parseDocxToHtml = async (buffer) => {
  try {
    const result = await mammoth.convertToHtml({ buffer });
    return result.value; // The generated HTML
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse document');
  }
};

module.exports = { parseDocxToHtml };
