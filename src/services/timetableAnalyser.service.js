const { days, periods } = require('../config/slots.config');
const { parseCell } = require('../utils/cellParser');
const { generateAllSlots } = require('../utils/slotGenerator');

const analyzeTimetable = (tables) => {
  const facultyData = {};
  const allPossibleSlots = generateAllSlots();

  tables.forEach(table => {
    // Assuming Table format:
    // Row 0: Headers (Days) -> ["", "Monday", "Tuesday", ...]
    // Col 0: Period Labels -> ["", "P1", "P2", ...]
    
    // Find column indices for days
    const dayIndices = {};
    const headerRow = table[0];
    if (!headerRow) return;

    headerRow.forEach((cell, index) => {
      const dayName = cell.trim();
      if (days.includes(dayName)) {
        dayIndices[dayName] = index;
      }
    });

    // Iterate through rows (skipping header)
    table.slice(1).forEach(row => {
      const periodLabel = row[0]?.trim();
      if (!periods.includes(periodLabel)) return;

      // For each day, get the cell data
      days.forEach(day => {
        const colIndex = dayIndices[day];
        if (colIndex === undefined) return;

        const cellContent = row[colIndex];
        const parsed = parseCell(cellContent);

        if (parsed && parsed.faculty) {
          const facultyName = parsed.faculty;
          
          if (!facultyData[facultyName]) {
            facultyData[facultyName] = {
              schedule: [],
              busySlotsKeys: new Set() // For easy free slot filtering
            };
          }

          facultyData[facultyName].schedule.push({
            day,
            period: periodLabel,
            subject: parsed.subject
          });
          
          facultyData[facultyName].busySlotsKeys.add(`${day}-${periodLabel}`);
        }
      });
    });
  });

  // Calculate free slots for each faculty
  const result = {};
  Object.keys(facultyData).forEach(name => {
    const faculty = facultyData[name];
    const freeSlots = allPossibleSlots.filter(
      slot => !faculty.busySlotsKeys.has(`${slot.day}-${slot.period}`)
    );

    result[name] = {
      schedule: faculty.schedule,
      freeSlots: freeSlots
    };
  });

  return result;
};

module.exports = { analyzeTimetable };
