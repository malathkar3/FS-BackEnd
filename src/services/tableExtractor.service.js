const cheerio = require('cheerio');

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Normalize time string for exact comparison
 */
const cleanTime = (time) =>
  (time || "")
    .replace(/\./g, ":")                     // handle dots as colons (11.15 -> 11:15)
    .replace(/\s+/g, "")                     // remove spaces
    .replace(/\b(\d):(\d{2})/g, "0$1:$2")   // 1:15 → 01:15
    .replace(/\b(\d{2}):(\d)\b/g, "$1:0$2"); // 2:0 → 02:00

/**
 * ✅ Exact matches only for breaks. 
 * Note: 11:15-12:15 and 12:15-01:15 are TEACHING SLOTS.
 */
const BREAK_SLOTS = ["11:00-11:15", "01:15-02:00"];

const isBreakSlot = (timeLabel) => {
  const clean = cleanTime(timeLabel);
  if (/LUNCH/i.test(clean)) return true;
  // Use exact match to avoid catching 11:15 inside 11:00-11:15 checks if logic is changed
  return BREAK_SLOTS.some(b => clean === cleanTime(b));
};

/**
 * Build faculty map (initial → full name)
 */
const buildFacultyMap = ($) => {
  const facultyMap = {};

  $('table').eq(1).find('tr').each((i, tr) => {
    if (i === 0) return;

    const cells = [];
    $(tr).find('td').each((_, td) => {
      cells.push($(td).text().trim());
    });

    if (cells.length < 2) return;

    const fullNameCell = cells[cells.length - 1];
    const initialsCell = cells[cells.length - 2];

    if (!fullNameCell || !initialsCell) return;

    const names = fullNameCell.split(/[,+]/).map(n => n.trim()).filter(n => n);
    const inits = initialsCell.split(/[,+]/).map(i => i.trim()).filter(i => i);

    inits.forEach((init, idx) => {
      const correspondingName = names[idx] || names[0];
      if (init && correspondingName) {
        facultyMap[init] = correspondingName;
      }
    });
  });

  return facultyMap;
};

/**
 * Handle colspan properly
 */
const expandRow = ($, tr) => {
  const row = [];

  $(tr).find('td').each((_, td) => {
    const colspan = parseInt($(td).attr('colspan') || '1', 10);
    const text = $(td).text().trim().replace(/\s+/g, ' ');

    for (let i = 0; i < colspan; i++) {
      row.push(text);
    }
  });

  return row;
};

/**
 * MAIN PARSER
 */
const extractTables = (html) => {
  const $ = cheerio.load(html);

  const facultyMap = buildFacultyMap($);

  const table = $('table').eq(0);

  const rows = [];

  table.find('tr').each((_, tr) => {
    rows.push(expandRow($, tr));
  });

  if (rows.length === 0) {
    throw new Error("No timetable data found");
  }

  const timeLabels = rows[0].slice(1);

  const facultyData = {};

  rows.slice(1).forEach((row) => {
    const day = row[0];

    if (!DAYS.includes(day)) return;

    row.slice(1).forEach((cell, index) => {
      const timeLabel = timeLabels[index];

      // ✅ 11:15-12:15 will NOT be skipped anymore
      if (isBreakSlot(timeLabel)) return;

      if (!cell || cell.toUpperCase().includes("LUNCH")) return;

      let facultyPart = cell;
      let subject = cell;

      if (cell.includes("-")) {
        const parts = cell.split("-");
        subject = parts[0].trim();
        facultyPart = parts[1].trim();
      }

      const initials = facultyPart.match(/\b[A-Z]{2,4}\b/g);

      if (!initials) return;

      initials.forEach(init => {
        if (!facultyMap[init]) return;

        const fullName = facultyMap[init];

        if (!facultyData[fullName]) {
          facultyData[fullName] = {
            schedule: [],
            busySet: new Set()
          };
        }

        const slotKey = `${day}-${index}`;

        if (!facultyData[fullName].busySet.has(slotKey)) {
          facultyData[fullName].schedule.push({
            day,
            time: timeLabel,
            subject: subject
          });

          facultyData[fullName].busySet.add(slotKey);
        }
      });
    });
  });

  /**
   * FREE SLOT CALCULATION
   */
  const parsedData = {};

  Object.keys(facultyData).forEach(name => {
    const faculty = facultyData[name];

    const freeSlots = [];

    DAYS.forEach(day => {
      timeLabels.forEach((time, index) => {

        if (isBreakSlot(time)) return;

        const key = `${day}-${index}`;

        if (!faculty.busySet.has(key)) {
          freeSlots.push({ day, time });
        }
      });
    });

    parsedData[name] = {
      schedule: faculty.schedule,
      freeSlots
    };
  });

  console.log("FINAL PARSED DATA:", parsedData);

  return parsedData;
};

module.exports = { extractTables };