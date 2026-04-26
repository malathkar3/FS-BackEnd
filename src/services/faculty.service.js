const { db } = require('../config/firebaseAdmin');
const { slugify } = require('../utils/stringUtils');

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
//
// Firestore document shape written by the upload pipeline (getTimetableJson):
//
//   timetables/{sectionId}
//   ├─ metadata   : { semester: string, section: string }
//   ├─ schedule   : Array<{ day, time, subject, faculty: fullName }>
//   └─ freeSlots  : Array<{ day, time }>
//
// The upload pipeline also writes per-faculty data (from extractTables):
//
//   faculty/{slugifiedName}
//   ├─ name       : string  (original full name)
//   ├─ schedule   : Array<{ day, time, subject, semester, section }>
//   └─ freeSlots  : Array<{ day, time }>   (cross-section aggregated)
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Faculty helpers ──────────────────────────────────────────────────────────

/**
 * Fetches all faculty documents from the "faculty" collection.
 * @returns {Promise<Array<{id, name, schedule, freeSlots}>>}
 */
const getAllFaculties = async () => {
  try {
    const snapshot = await db.collection('faculty').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all faculties:', error.message);
    throw new Error(`Failed to fetch faculties: ${error.message}`);
  }
};

/**
 * Fetches a single faculty document by slugified ID.
 * @param {string} facultyId  e.g. "mr-yogesh-b-s"
 * @returns {Promise<{id, name, schedule, freeSlots}|null>}
 */
const getFacultyById = async (facultyId) => {
  if (!facultyId) throw new Error('Faculty ID is required');

  try {
    const doc = await db.collection('faculty').doc(facultyId).get();
    if (!doc.exists) {
      console.log(`No faculty found with ID: ${facultyId}`);
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`Error fetching faculty (${facultyId}):`, error.message);
    throw new Error(`Failed to fetch faculty: ${error.message}`);
  }
};

/**
 * Fetches a single faculty document by email.
 * @param {string} email
 * @returns {Promise<{id, name, schedule, freeSlots}|null>}
 */
const getFacultyByEmail = async (email) => {
  if (!email) throw new Error('Email is required');

  try {
    const snapshot = await db.collection('faculty')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`No faculty found with email: ${email}`);
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`Error fetching faculty by email (${email}):`, error.message);
    throw new Error(`Failed to fetch faculty by email: ${error.message}`);
  }
};

// ─── Aggregated faculty timetable ─────────────────────────────────────────────

/**
 * Returns a faculty's complete timetable aggregated across all sections.
 *
 * Strategy:
 *   1. Try the dedicated "faculty" collection first (fastest — O(1) read).
 *      The upload pipeline pre-aggregates this from extractTables().
 *   2. If not found there, fall back to scanning all timetable documents and
 *      filtering by faculty name (slower but always correct).
 *
 * @param {string} facultyId  Slugified faculty name, e.g. "dr-latha-a-p"
 * @returns {Promise<{faculty, schedule, freeSlots}>}
 */
const getAggregatedFacultyTimetable = async (facultyId) => {
  if (!facultyId) throw new Error('Faculty ID is required');

  let fullSchedule = [];
  let candidateFree = [];
  let availableSections = [];
  let facultyName = facultyId;

  // ── Fast path: pre-aggregated document ──────────────────────────────────────
  try {
    const doc = await db.collection('faculty').doc(facultyId).get();

    if (doc.exists) {
      const data = doc.data();
      facultyName = data.name || facultyId;
      
      // If we have per-section data (new format)
      if (data.sections) {
        console.log(`[faculty doc] Found 'sections' field for ${facultyId}`);
        for (const [sectionId, sectionData] of Object.entries(data.sections)) {
          const schedule = sectionData.schedule || [];
          const freeSlots = sectionData.freeSlots || [];
          
          fullSchedule.push(...schedule);
          candidateFree.push(...freeSlots);
          
          availableSections.push({
            id: sectionId,
            name: sectionId.replace(/_/g, ' ').toUpperCase()
          });
        }
      } else {
        // Fallback to legacy format
        console.log(`[faculty doc] Found legacy format for ${facultyId}`);
        fullSchedule = data.schedule || [];
        candidateFree = data.freeSlots || [];
      }

      if (fullSchedule.length > 0) {
        return processAndReturn(facultyId, facultyName, fullSchedule, candidateFree, availableSections);
      }
    }
  } catch (err) {
    console.warn(`Faculty doc lookup failed for ${facultyId}, falling back to scan:`, err.message);
  }

  // ── Slow path: scan every timetable document ─────────────────────────────────
  console.log(`[scan] Faculty doc not found or empty for "${facultyId}", scanning timetables…`);

  try {
    const snapshot = await db.collection('timetables').get();

    snapshot.forEach(doc => {
      const data = doc.data();
      const { semester, section } = data.metadata || {};
      const sectionId = doc.id;
      const schedule = data.schedule || [];
      const freeSlots = data.freeSlots || [];

      const matched = schedule.filter(slot => {
        if (!slot.faculty) return false;
        return slugify(slot.faculty) === facultyId;
      });

      if (matched.length > 0) {
        console.log(`  Matched ${matched.length} slot(s) in ${semester}-${section}`);
        
        availableSections.push({
          id: sectionId,
          name: `${semester} ${section}`.trim().toUpperCase() || sectionId.replace(/_/g, ' ').toUpperCase()
        });

        matched.forEach(slot =>
          fullSchedule.push({ ...slot, semester, section })
        );

        freeSlots.forEach(slot =>
          candidateFree.push({ ...slot, semester, section })
        );
      }
    });

    return processAndReturn(facultyId, facultyName, fullSchedule, candidateFree, availableSections);
  } catch (error) {
    console.error(`Error aggregating timetable for ${facultyId}:`, error.message);
    throw new Error(`Failed to aggregate timetable: ${error.message}`);
  }
};

/**
 * Helper to deduplicate free slots and format the return object
 */
const processAndReturn = (facultyId, name, fullSchedule, candidateFree, availableSections) => {
  // A slot is truly free only if the faculty has NO class at that day+time
  // in ANY section (they might teach the same slot in another section).
  const busyKeys = new Set(fullSchedule.map(s => `${s.day}-${s.time}`));
  const seenFree = new Set();
  const uniqueFree = [];

  candidateFree.forEach(slot => {
    const key = `${slot.day}-${slot.time}`;
    if (!busyKeys.has(key) && !seenFree.has(key)) {
      uniqueFree.push({ day: slot.day, time: slot.time });
      seenFree.add(key);
    }
  });

  return {
    faculty: facultyId,
    name: name,
    schedule: fullSchedule,
    freeSlots: uniqueFree,
    sections: availableSections
  };
};

// ─── Section helpers ──────────────────────────────────────────────────────────

/**
 * Returns all section document IDs from the "timetables" collection.
 * @returns {Promise<string[]>}  e.g. ["sem6_secA", "sem6_secB"]
 */
const getSectionsList = async () => {
  try {
    const snapshot = await db.collection('timetables').get();
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching sections list:', error.message);
    throw new Error(`Failed to fetch sections: ${error.message}`);
  }
};

/**
 * Fetches a single timetable document and returns it grouped by faculty name.
 *
 * Output shape:
 *   {
 *     [facultyFullName]: {
 *       schedule:  [{ day, time, subject, semester, section }],
 *       freeSlots: [{ day, time, semester, section }]
 *     }
 *   }
 *
 * This mirrors what extractTables() returns, enriched with section metadata.
 *
 * @param {string} sectionId  e.g. "sem6_secB"
 */
const getSectionDetails = async (sectionId) => {
  if (!sectionId) throw new Error('Section ID is required');

  try {
    const doc = await db.collection('timetables').doc(sectionId).get();
    if (!doc.exists) throw new Error(`Section not found: ${sectionId}`);

    const data = doc.data();
    const { semester, section } = data.metadata || {};
    const schedule = data.schedule || [];
    const freeSlots = (data.freeSlots || []).map(fs => ({ ...fs, semester, section }));

    // Group schedule entries by faculty name
    const facultyMap = {};

    schedule.forEach(slot => {
      const name = slot.faculty || 'Unknown';

      if (!facultyMap[name]) {
        facultyMap[name] = {
          schedule: [],
          // Every faculty in this section gets the section's free slots
          freeSlots,
        };
      }

      facultyMap[name].schedule.push({ ...slot, semester, section });
    });

    return facultyMap;
  } catch (error) {
    console.error('Error fetching section details:', error.message);
    throw error;
  }
};

// ─── Upload helper (call this from your DOCX upload route) ───────────────────

/**
 * Persists parsed timetable data to Firestore.
 *
 * Writes two collections:
 *   • timetables/{sectionId}  — section-level flat schedule (from getTimetableJson)
 *   • faculty/{slugifiedName} — per-faculty aggregated schedule (from extractTables)
 *
 * @param {string}  sectionId   Firestore document ID, e.g. "sem6_secB"
 * @param {object}  metadata    { semester: string, section: string }
 * @param {object}  sectionData Output of getTimetableJson()  → { schedule, freeSlots }
 * @param {object}  facultyData Output of extractTables()     → { [fullName]: { schedule, freeSlots } }
 */
const saveParsedTimetable = async (sectionId, metadata, sectionData, facultyData) => {
  if (!sectionId) throw new Error('sectionId is required');

  const batch = db.batch();

  // ── 1. Section document ────────────────────────────────────────────────────
  const sectionRef = db.collection('timetables').doc(sectionId);
  batch.set(sectionRef, {
    metadata,
    schedule: sectionData.schedule,
    freeSlots: sectionData.freeSlots,
    updatedAt: new Date().toISOString(),
  });

  // ── 2. Per-faculty documents ───────────────────────────────────────────────
  // extractTables() gives us { fullName → { schedule, freeSlots } }.
  // We enrich each schedule entry with semester + section metadata before saving.
  for (const [fullName, data] of Object.entries(facultyData)) {
    const facultyId = slugify(fullName);
    const facultyRef = db.collection('faculty').doc(facultyId);

    // Add metadata to every schedule entry so the faculty doc is self-contained.
    const enrichedSchedule = data.schedule.map(slot => ({
      ...slot,
      semester: metadata.semester,
      section: metadata.section,
    }));

    // Use merge so uploading one section doesn't wipe data from other sections.
    // NOTE: this means free slots are always recomputed by getAggregatedFacultyTimetable;
    //       here we only store the name for quick lookups.
    batch.set(
      facultyRef,
      {
        name: fullName,
        updatedAt: new Date().toISOString(),
        // Store per-section schedule entries under a sub-key so they don't
        // overwrite entries from other sections on merge.
        [`sections.${sectionId}`]: {
          schedule: enrichedSchedule,
          freeSlots: data.freeSlots,
        },
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`Saved timetable for ${sectionId} with ${Object.keys(facultyData).length} faculty.`);
};

module.exports = {
  getAllFaculties,
  getFacultyById,
  getFacultyByEmail,
  getAggregatedFacultyTimetable,
  getSectionsList,
  getSectionDetails,
  saveParsedTimetable,
};