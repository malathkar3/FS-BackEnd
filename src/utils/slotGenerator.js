const { days, periods } = require('../config/slots.config');

const generateAllSlots = () => {
  const slots = [];
  days.forEach(day => {
    periods.forEach(period => {
      slots.push({ day, period });
    });
  });
  return slots;
};

module.exports = { generateAllSlots };
