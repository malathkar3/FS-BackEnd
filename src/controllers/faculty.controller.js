const { getData } = require('./upload.controller');

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
  getFacultySchedule,
  getFacultyFreeSlots
};
