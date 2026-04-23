const { getFacultyById } = require('../services/faculty.service');
const { getAdminById } = require('../services/admin.service');

async function testFetch() {
  console.log('--- Testing Firestore Fetches ---');

  // Test Non-existent Faculty
  try {
    console.log('Fetching non-existent faculty...');
    const faculty = await getFacultyById('non-existent-id');
    console.log('Result:', faculty);
  } catch (err) {
    console.error('Error fetching faculty:', err.message);
  }

  // Test Non-existent Admin
  try {
    console.log('\nFetching non-existent admin...');
    const admin = await getAdminById('non-existent-id');
    console.log('Result:', admin);
  } catch (err) {
    console.error('Error fetching admin:', err.message);
  }

  // Test Missing ID (Error handling)
  try {
    console.log('\nFetching with missing ID...');
    await getFacultyById();
  } catch (err) {
    console.log('Expected Error caught:', err.message);
  }

  console.log('\n--- Verification Finished ---');
}

testFetch();
