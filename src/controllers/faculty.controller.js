const { 
  getAggregatedFacultyTimetable, 
  getAllFaculties,
  getSectionsList,
  getSectionDetails
} = require('../services/faculty.service');

/**
 * Returns a list of all faculties and their aggregated timetables.
 * This ensures the frontend doesn't show "Data Not Loaded" if Firestore has data.
 */
const getFacultyList = async (req, res) => {
  try {
    const faculties = await getAllFaculties();
    
    // For each faculty, get their aggregated timetable
    // This is useful for the admin view which shows workload distribution
    const detailedData = {};
    
    await Promise.all(faculties.map(async (fac) => {
      const timetable = await getAggregatedFacultyTimetable(fac.id);
      detailedData[fac.name] = {
        schedule: timetable.schedule,
        freeSlots: [] // Can be expanded if needed
      };
    }));

    res.status(200).json({
      success: true,
      data: detailedData
    });
  } catch (error) {
    console.error('Error in getFacultyList:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Aggregrated Firestore-based timetable for a specific faculty
 */
const getFacultySchedule = async (req, res) => {
  try {
    const { name: facultyId } = req.params;
    
    if (!facultyId) {
      return res.status(400).json({ success: false, message: 'Faculty ID is required' });
    }

    const result = await getAggregatedFacultyTimetable(facultyId);

    if (!result.schedule || result.schedule.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No active schedule found for this faculty.',
        faculty: facultyId,
        data: [] 
      });
    }

    res.status(200).json({
      success: true,
      faculty: result.faculty,
      data: result.schedule,
      freeSlots: result.freeSlots,
      sections: result.sections || []
    });
  } catch (error) {
    console.error(`Error in getFacultySchedule:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTimetable = async (req, res) => {
  try {
    const { slugify } = require('../utils/stringUtils');
    const displayName = req.user?.profile?.displayName;

    if (!displayName) {
      return res.status(400).json({ success: false, message: 'User display name not found in profile' });
    }

    const facultyId = slugify(displayName);
    const result = await getAggregatedFacultyTimetable(facultyId);

    res.status(200).json({
      success: true,
      matchingName: displayName,
      faculty: result.faculty,
      data: result.schedule,
      freeSlots: result.freeSlots,
      sections: result.sections || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFacultyFreeSlots = async (req, res) => {
  try {
    const { name } = req.params;
    const { slugify } = require('../utils/stringUtils');
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Faculty name is required' });
    }

    const facultyId = slugify(name);
    const result = await getAggregatedFacultyTimetable(facultyId);

    res.status(200).json({
      success: true,
      data: result.freeSlots || []
    });
  } catch (error) {
    console.error(`Error in getFacultyFreeSlots:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSectionData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getSectionDetails(id);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSections = async (req, res) => {
  try {
    const sections = await getSectionsList();
    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFacultyList,
  getMyTimetable,
  getFacultySchedule,
  getFacultyFreeSlots,
  getSections,
  getSectionData
};
