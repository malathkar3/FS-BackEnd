const axios = require('axios');

async function verify() {
  const baseURL = 'http://localhost:5001'; // Assuming default port
  
  try {
    console.log("Checking /api/my-timetable (mocking auth/profile required if server is running)");
    console.log("Since I cannot easily mock auth tokens here, I will check if the service returns correct data directly.");
    
    const { getAggregatedFacultyTimetable } = require('./src/services/faculty.service');
    const { slugify } = require('./src/utils/stringUtils');
    
    // Test with a faculty name that exists in your data
    // From my previous analysis, I saw 'yogesh' or similar
    const testName = 'yogesh';
    const result = await getAggregatedFacultyTimetable(testName);
    
    console.log(`\nResult for ${testName}:`);
    console.log(`Schedule count: ${result.schedule.length}`);
    console.log(`Free slots count: ${result.freeSlots.length}`);
    
    if (result.freeSlots.length > 0) {
      console.log("\nSample Free Slot:", result.freeSlots[0]);
      console.log("SUCCESS: Free slots are being calculated.");
    } else {
      console.log("WARNING: No free slots found. Check if the faculty teaches in any sections with free slots.");
    }

  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verify();
