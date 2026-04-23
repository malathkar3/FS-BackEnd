const { db } = require('../config/firebaseAdmin');

/**
 * Fetches a single admin document from the "admin" collection by ID.
 * @param {string} adminId - The ID of the admin document.
 * @returns {Promise<Object|null>} - The document data with ID, or null if not found.
 * @throws {Error} - If the Firestore request fails.
 */
const getAdminById = async (adminId) => {
  if (!adminId) {
    throw new Error('Admin ID is required');
  }

  try {
    const docRef = db.collection('admin').doc(adminId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`No admin found with ID: ${adminId}`);
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error fetching admin document (${adminId}):`, error.message);
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }
};

/**
 * Fetches a single admin document from the "admin" collection by email.
 * @param {string} email - The email of the admin.
 * @returns {Promise<Object|null>} - The document data with ID, or null if not found.
 */
const getAdminByEmail = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    const snapshot = await db.collection('admin')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`No admin found with email: ${email}`);
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error fetching admin by email (${email}):`, error.message);
    throw new Error(`Failed to fetch admin by email: ${error.message}`);
  }
};

module.exports = {
  getAdminById,
  getAdminByEmail
};
