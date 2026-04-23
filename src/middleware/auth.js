const { auth } = require('../config/firebaseAdmin');

/**
 * Middleware to verify Firebase ID Token.
 * Attaches the decoded UID to req.user.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH FAILURE] Missing or malformed Authorization header from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or invalid token'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { 
      uid: decodedToken.uid,
      email: decodedToken.email 
    };
    next();
  } catch (error) {
    console.error(`[AUTH FAILURE] Invalid token from IP: ${req.ip} - Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
