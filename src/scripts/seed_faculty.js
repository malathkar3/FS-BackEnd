const { db } = require('../config/firebaseAdmin');

const seedFaculty = async () => {
  const uid = 'hXShTn9lNMgqLCqcs7gBfg2CKOH2';
  const email = 'nikhil@12.com';
  
  try {
    console.log(`Seeding faculty user: ${email} (UID: ${uid})...`);
    
    await db.collection('faculty').doc(uid).set({
      email: email,
      role: 'faculty',
      displayName: 'Mr. YOGESH B S',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('Successfully seeded faculty user.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding faculty user:', error.message);
    process.exit(1);
  }
};

seedFaculty();
