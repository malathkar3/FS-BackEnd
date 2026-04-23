/**
 * Normalizes a faculty name for comparison.
 * Removes honorifics (Mr, Ms, Dr), extra spaces, and converts to lowercase.
 * @param {string} name 
 * @returns {string}
 */
const normalizeName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(mr|ms|mrs|dr|prof|assistant|professor)\.?\s+/g, '') // Remove honorifics
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
    .trim();
};

/**
 * Finds a matching faculty name in the dataset keys.
 * @param {string} targetName - Name from profile (e.g., "Mr. YOGESH B S")
 * @param {string[]} availableNames - Keys from timetable data
 * @returns {string|null} - The actual key in the dataset if found
 */
const findMatchingName = (targetName, availableNames) => {
  const normalizedTarget = normalizeName(targetName);
  
  // 1. Try exact match first
  if (availableNames.includes(targetName)) return targetName;

  // 2. Try normalized match
  for (const name of availableNames) {
    if (normalizeName(name) === normalizedTarget) {
      return name;
    }
  }

  // 3. Try partial match (if "Yogesh" is in "Mr. Yogesh B S")
  for (const name of availableNames) {
    const normName = normalizeName(name);
    if (normalizedTarget.includes(normName) || normName.includes(normalizedTarget)) {
      if (normName.length > 3) return name; // Avoid matching very short strings
    }
  }

  return null;
};

module.exports = { normalizeName, findMatchingName };
