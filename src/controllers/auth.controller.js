/**
 * Requirement 4: User Endpoint logic
 * Purpose: Returns user's uid, email, and role from decoded token/Firestore.
 */
const getMe = async (req, res) => {
  try {
    const { uid, email, role, profile } = req.user;
    
    res.status(200).json({
      success: true,
      uid,
      email: profile?.email || email,
      displayName: profile?.displayName || null,
      role: role,
      createdAt: profile?.createdAt || null
    });
  } catch (error) {
    console.error('getMe controller error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user profile'
    });
  }
};

module.exports = { getMe };
