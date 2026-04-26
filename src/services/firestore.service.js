const { db, admin } = require('../config/firebaseAdmin');
const { slugify } = require('../utils/stringUtils');

/**
 * Extracts faculty workload and subjects from a schedule array.
 */
const calculateFacultyStats = (schedule) => {
  const stats = {};

  schedule.forEach(slot => {
    // Only process slots with valid faculty and subject
    if (slot.faculty && slot.subject && !slot.subject.toLowerCase().includes('lunch')) {
      const name = slot.faculty.trim();
      const slug = slugify(name);

      if (!stats[slug]) {
        stats[slug] = {
          name: name,
          workload: 0,
          subjects: new Set()
        };
      }

      stats[slug].workload += 1;
      stats[slug].subjects.add(slot.subject.trim());
    }
  });

  // Convert Sets to Arrays for Firestore storage
  return Object.keys(stats).map(slug => ({
    slug,
    name: stats[slug].name,
    workload: stats[slug].workload,
    subjects: Array.from(stats[slug].subjects)
  }));
};

/**
 * Saves timetable and updates faculty data in Firestore.
 */
const saveTimetableData = async (timetableData) => {
  const { semester, section, schedule, freeSlots } = timetableData;
  const docId = `sem${semester}_sec${section}`;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();

  // 1. Store Timetable Document
  const timetableRef = db.collection('timetables').doc(docId);
  batch.set(timetableRef, {
    metadata: { semester, section },
    schedule,
    freeSlots,
    lastUpdated: timestamp
  }, { merge: true });

  // 2. Calculate and Store Faculty Stats
  const facultyStats = calculateFacultyStats(schedule);

  facultyStats.forEach(faculty => {
    const facultyRef = db.collection('faculty').doc(faculty.slug);
    
    batch.set(facultyRef, {
      name: faculty.name,
      // Using arrayUnion for subjects to aggregate without duplicates
      subjects: admin.firestore.FieldValue.arrayUnion(...faculty.subjects),
      // NOTE: Incrementing workload assumes each upload is unique.
      // If re-uploading the same section, this will double count unless logic to subtract old exists.
      workload: admin.firestore.FieldValue.increment(faculty.workload),
      lastUpdated: timestamp
    }, { merge: true });
  });

  await batch.commit();
  return { docId, facultyCount: facultyStats.length };
};

module.exports = { saveTimetableData, calculateFacultyStats };
