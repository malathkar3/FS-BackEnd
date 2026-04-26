const { db } = require('../config/firebaseAdmin');

/**
 * Fetches a single admin document from the "admin" collection by ID.
 * @param {string} adminId
 * @returns {Promise<{id, ...data}|null>}
 */
const getAdminById = async (adminId) => {
  if (!adminId) throw new Error('Admin ID is required');

  try {
    const doc = await db.collection('admin').doc(adminId).get();

    if (!doc.exists) {
      console.log(`No admin found with ID: ${adminId}`);
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`Error fetching admin (${adminId}):`, error.message);
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }
};

/**
 * Fetches a single admin document from the "admin" collection by email.
 * @param {string} email
 * @returns {Promise<{id, ...data}|null>}
 */
const getAdminByEmail = async (email) => {
  if (!email) throw new Error('Email is required');

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
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error(`Error fetching admin by email (${email}):`, error.message);
    throw new Error(`Failed to fetch admin by email: ${error.message}`);
  }
};

module.exports = { getAdminById, getAdminByEmail };