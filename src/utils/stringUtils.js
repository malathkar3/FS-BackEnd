/**
 * Converts a faculty name to a Firestore-friendly document ID (slug).
 * Example: "Mr. Hari Krishnan" -> "hari_krishnan"
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\b(mr|ms|mrs|dr|prof)\.?\s+/g, '') // Remove titles
    .replace(/\./g, '')                           // Remove dots (to handle B.S. -> BS)
    .replace(/\s+/g, '_')                         // Replace spaces with underscores
    .replace(/[^\w-]+/g, '')                      // Remove non-word chars
    .replace(/--+/g, '_')                         // Replace multiple underscores with one
    .replace(/^-+/, '')                           // Trim - from start
    .replace(/-+$/, '');                          // Trim - from end
};

module.exports = { slugify };
