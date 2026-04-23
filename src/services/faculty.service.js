const { db } = require('../config/firebaseAdmin');

/**
 * Fetches a single faculty document from the "faculty" collection by ID.
 * @param {string} facultyId - The ID of the faculty document.
 * @returns {Promise<Object|null>} - The document data with ID, or null if not found.
 * @throws {Error} - If the Firestore request fails.
 */
const getFacultyById = async (facultyId) => {
  if (!facultyId) {
    throw new Error('Faculty ID is required');
  }

  try {
    const docRef = db.collection('faculty').doc(facultyId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`No faculty found with ID: ${facultyId}`);
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error fetching faculty document (${facultyId}):`, error.message);
    throw new Error(`Failed to fetch faculty: ${error.message}`);
  }
};

/**
 * Fetches a single faculty document from the "faculty" collection by email.
 * @param {string} email - The email of the faculty.
 * @returns {Promise<Object|null>} - The document data with ID, or null if not found.
 */
const getFacultyByEmail = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }

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
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error fetching faculty by email (${email}):`, error.message);
    throw new Error(`Failed to fetch faculty by email: ${error.message}`);
  }
};

module.exports = {
  getFacultyById,
  getFacultyByEmail
};
