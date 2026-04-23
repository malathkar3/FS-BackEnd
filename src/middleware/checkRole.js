const { db } = require('../config/firebaseAdmin');

/**
 * Reusable middleware to check user roles in Firestore.
 * @param {Array|string} allowedRoles - Role or array of roles allowed to access the route.
 */
const checkRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: No user UID found'
        });
      }

      const { uid, email } = req.user;
      console.log(`[DEBUG] Verifying role for UID: "${uid}", Email: "${email}"`);

      let userDoc = null;
      let assignedRole = null;

      // 1. Try UID lookup in 'admin'
      let doc = await db.collection('admin').doc(uid).get();
      if (doc.exists) {
        userDoc = doc;
        assignedRole = 'admin';
      } else {
        // 2. Try UID lookup in 'faculty'
        doc = await db.collection('faculty').doc(uid).get();
        if (doc.exists) {
          userDoc = doc;
          assignedRole = 'faculty';
        }
      }

      // 3. Fallback: Search by email if UID lookup failed (Resilience)
      if (!userDoc && email) {
        console.log(`[DEBUG] UID lookup failed. Attempting email search for: ${email}`);
        
        const adminQuery = await db.collection('admin').where('email', '==', email).limit(1).get();
        if (!adminQuery.empty) {
          userDoc = adminQuery.docs[0];
          assignedRole = 'admin';
        } else {
          const facultyQuery = await db.collection('faculty').where('email', '==', email).limit(1).get();
          if (!facultyQuery.empty) {
            userDoc = facultyQuery.docs[0];
            assignedRole = 'faculty';
          }
        }
      }

      if (userDoc) {
        req.user.role = assignedRole;
        req.user.profile = userDoc.data();
        
        if (roles.includes(assignedRole)) {
          console.log(`[DEBUG] Success! User ${email} assigned role: ${assignedRole}`);
          return next();
        }

        console.warn(`[AUTH FAILURE] User ${uid} has role '${assignedRole}' but needed one of: [${roles}]`);
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Insufficient permissions'
        });
      }

      console.warn(`[AUTH FAILURE] UID ${uid} (${email}) not found in database.`);
      return res.status(403).json({
        success: false,
        message: 'Access Denied: User role not authorized in database'
      });

    } catch (error) {
      console.error(`[ROLE ERROR]`, error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error during authorization'
      });
    }
  };
};

module.exports = checkRole;
