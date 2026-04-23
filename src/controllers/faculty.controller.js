const { getData } = require('./upload.controller');
const { findMatchingName } = require('../utils/nameMatcher');

const getFacultyList = (req, res) => {
  const data = getData();
  if (!data) {
    return res.status(200).json({ success: true, data: [] });
  }

  res.status(200).json({
    success: true,
    data: Object.keys(data)
  });
};

const getMyTimetable = (req, res) => {
  const data = getData();
  const displayName = req.user?.profile?.displayName;

  if (!data) {
    return res.status(404).json({ success: false, message: 'No timetable data loaded' });
  }

  if (!displayName) {
    return res.status(400).json({ success: false, message: 'User display name not found in profile' });
  }

  const matchingName = findMatchingName(displayName, Object.keys(data));

  if (!matchingName) {
    console.warn(`[MATCH FAILURE] Could not match profile name "${displayName}" with any faculty in timetable.`);
    return res.status(404).json({ 
      success: false, 
      message: `Identity Mismatch: Could not match your name "${displayName}" with any record in the timetable.`,
      availableNames: Object.keys(data)
    });
  }

  res.status(200).json({
    success: true,
    matchingName: matchingName,
    data: data[matchingName].schedule
  });
};

const getFacultySchedule = (req, res) => {
  const { name } = req.params;
  const data = getData();

  if (!data || !data[name]) {
    return res.status(404).json({ success: false, message: 'Faculty not found' });
  }

  res.status(200).json({
    success: true,
    data: data[name].schedule
  });
};

const getFacultyFreeSlots = (req, res) => {
  const { name } = req.params;
  const data = getData();

  if (!data || !data[name]) {
    return res.status(404).json({ success: false, message: 'Faculty not found' });
  }

  res.status(200).json({
    success: true,
    data: data[name].freeSlots
  });
};

module.exports = {
  getFacultyList,
  getMyTimetable,
  getFacultySchedule,
  getFacultyFreeSlots
};
