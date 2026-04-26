const { db } = require('../config/firebaseAdmin');

/**
 * Requirement 3: Role Authorization Middleware
 * Accept requiredRole, fetch user from Firestore (collection: users), 
 * Compare role with requiredRole.
 */
const roleMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }

      const uid = req.user.uid;
      const email = req.user.email;

      // 1. Try UID lookup in 'admin'
      let adminDoc = await db.collection('admin').doc(uid).get();
      if (!adminDoc.exists && email) {
        // Fallback to email lookup if UID doesn't match
        const snapshot = await db.collection('admin').where('email', '==', email.toLowerCase()).limit(1).get();
        if (!snapshot.empty) adminDoc = snapshot.docs[0];
      }

      if (adminDoc.exists) {
        req.user.role = 'admin';
        req.user.data = adminDoc.data();
        if (requiredRole === 'admin' || requiredRole === 'faculty') return next();
      }

      // 2. Try UID lookup in 'faculty'
      let facultyDoc = await db.collection('faculty').doc(uid).get();
      if (!facultyDoc.exists && email) {
        // Fallback to email lookup
        const snapshot = await db.collection('faculty').where('email', '==', email.toLowerCase()).limit(1).get();
        if (!snapshot.empty) facultyDoc = snapshot.docs[0];
      }

      if (facultyDoc.exists) {
        req.user.role = 'faculty';
        req.user.data = facultyDoc.data();
        if (requiredRole === 'faculty') return next();
      }

      // If no valid role match found
      return res.status(403).json({
        success: false,
        message: `Forbidden: User does not have the required '${requiredRole}' role.`
      });
    } catch (error) {
      console.error('Role Middleware Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error during role verification'
      });
    }
  };
};

module.exports = roleMiddleware;
