const { db } = require('./src/config/firebaseAdmin');
const { slugify } = require('./src/utils/stringUtils');

async function testYogesh() {
  const facultyName = "MR. YOGESH B S";
  const facultyId = slugify(facultyName);
  console.log(`Searching for facultyId: ${facultyId} (slugified from "${facultyName}")`);

  try {
    const snapshot = await db.collection('timetables').get();
    console.log(`Found ${snapshot.size} timetable documents`);

    snapshot.forEach(doc => {
      const data = doc.data();
      const schedule = data.schedule || [];
      const facultyNamesInDoc = [...new Set(schedule.map(s => s.faculty).filter(Boolean))];
      console.log(`Document ${doc.id} has faculty names:`, facultyNamesInDoc);
      
      const facultySlots = schedule.filter(slot => 
        slot.faculty && slugify(slot.faculty) === facultyId
      );
      
      if (facultySlots.length > 0) {
        console.log(`Found ${facultySlots.length} slots for ${facultyId} in ${doc.id}`);
      }
    });

    // Also check faculty collection
    const facultySnapshot = await db.collection('faculty').where('name', '==', facultyName).get();
    if (!facultySnapshot.empty) {
        console.log("Found faculty 'MR. YOGESH B S' in faculty collection");
    } else {
        console.log("Faculty 'MR. YOGESH B S' NOT found in faculty collection by exact name matching");
        // Try fuzzy or normalized
        const allFaculty = await db.collection('faculty').get();
        allFaculty.forEach(doc => {
            const data = doc.data();
            console.log(`Faculty doc: name="${data.name}", email="${data.email}"`);
            if (slugify(data.name || '') === facultyId) {
                console.log(`MATCH FOUND (slugified): ${data.name}`);
            }
        });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

testYogesh();
