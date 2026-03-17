const parseCell = (text) => {
  if (!text) return null;
  const cleanText = text.trim();
  if (!cleanText || cleanText.toLowerCase() === 'break' || cleanText.toLowerCase() === 'interval') {
    return null;
  }

  // Expecting "SubjectName - FacultyName"
  const parts = cleanText.split('-').map(s => s.trim());
  if (parts.length >= 2) {
    return {
      subject: parts[0],
      faculty: parts[1]
    };
  }

  return null;
};

module.exports = { parseCell };
