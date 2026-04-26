/**
 * timetableParser.js
 *
 * Parses college timetable DOCX files (converted to HTML by mammoth).
 *
 * Handles the real-world quirks found in these documents:
 *  - Merged cells (rowspan / colspan) in the timetable grid
 *  - Multiple paragraphs inside a single <td> (multi-row lab slots)
 *  - Cells containing multiple subjects separated by "/" (elective groups)
 *  - Faculty initials separated by "," or "+"
 *  - Inconsistent time labels (11:0-11:15, 01:15-2:00, dots instead of colons …)
 *  - Lunch / break slots with rowspan that share the same column index as teaching slots
 *  - Faculty map rows that have colspan on the Sub.CODE column
 */

const cheerio = require('cheerio');

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);

/**
 * These exact normalised time strings are NON-TEACHING slots.
 * "11:15-12:15" and "12:15-01:15" are regular teaching hours, do NOT add them here.
 */
const BREAK_TIMES = new Set([
  "11:00-11:15",
  "11:0-11:15",   // typo variant seen in real files
  "01:15-02:00",
  "01:15-2:00",   // typo variant
  "1:15-2:00",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a raw time-label string for reliable comparisons.
 *   "01:1 5-2:00"  →  "01:15-2:00"  (remove internal spaces)
 *   "11.15-12.15"  →  "11:15-12:15" (dots → colons)
 * We intentionally do NOT zero-pad hours/minutes here because the break set
 * already stores both the "clean" and the "typo" variants explicitly.
 */
const normaliseTime = (raw = "") =>
  raw
    .replace(/\s+/g, "")     // strip all whitespace (including non-breaking)
    .replace(/\./g, ":")     // dots → colons
    .trim();

/** Returns true when a normalised time label belongs to a break / lunch slot. */
const isBreak = (normTime) => {
  if (!normTime) return true;                         // blank header cell
  if (/LUNCH/i.test(normTime)) return true;
  return BREAK_TIMES.has(normTime);
};

/**
 * Extract all text paragraphs from a <td> element as an array of trimmed strings.
 * Multiple <p> tags inside a single cell are common for multi-subject / lab slots.
 */
const cellTexts = ($, td) => {
  const texts = [];

  // Mammoth wraps everything in <p> tags.  If there are <p> children, use them;
  // otherwise fall back to the raw text content of the cell.
  const paragraphs = $(td).find('p');
  if (paragraphs.length > 0) {
    paragraphs.each((_, p) => {
      const t = $(p).text().trim().replace(/\s+/g, ' ');
      if (t) texts.push(t);
    });
  } else {
    const t = $(td).text().trim().replace(/\s+/g, ' ');
    if (t) texts.push(t);
  }

  return texts;
};

// ─── Faculty map builder ──────────────────────────────────────────────────────

/**
 * Build { initial → fullName } from the SECOND table in the document.
 *
 * Expected columns (0-based, after skipping the header row):
 *   0  SL.NO | 1  Category | 2  Sub.CODE | 3  SUBJECTS | 4  INITIALS | 5  NAME
 *
 * Mammoth sometimes collapses the Sub.CODE column (colspan="2") so the actual
 * column count may vary.  We therefore locate INITIALS / NAME by scanning
 * from the right (they are always the last two columns).
 *
 * Initials and names can be comma- or plus-separated ("PM,VG" / "YBS+MM").
 */
const buildFacultyMap = ($) => {
  const map = {};
  const facultyTable = $('table').eq(1);

  if (!facultyTable.length) {
    console.warn("No faculty table found (expected 2nd <table>).");
    return map;
  }

  facultyTable.find('tr').each((rowIdx, tr) => {
    if (rowIdx === 0) return; // skip header

    const cells = [];
    $(tr).find('td').each((_, td) => {
      cells.push($(td).text().trim().replace(/\s+/g, ' '));
    });

    if (cells.length < 2) return;

    const nameCell = cells[cells.length - 1];
    const initialsCell = cells[cells.length - 2];

    if (!nameCell || !initialsCell) return;

    // Split on commas and pluses; trim each token.
    const initials = initialsCell.split(/[,+]/).map(s => s.trim()).filter(Boolean);
    const names = nameCell.split(/[,+]/).map(s => s.trim()).filter(Boolean);

    initials.forEach((init, i) => {
      if (!init) return;
      // Map each initial to its own name; if names are fewer, reuse the first.
      const name = names[i] || names[0] || init;
      if (name) map[init] = name;
    });
  });

  return map;
};

// ─── Grid expander ───────────────────────────────────────────────────────────

/**
 * Expand the timetable HTML table into a 2-D array of objects, correctly
 * handling both colspan and rowspan merged cells.
 *
 * Each cell object: { text: string, isSpanned: boolean }
 *
 * Algorithm:
 *   Maintain a "carry-forward" map keyed by (rowIndex, colIndex) for rowspan cells.
 *   Walk every <tr> / <td> in order, inserting carry-forward cells as needed.
 */
const expandGrid = ($, table) => {
  const grid = [];
  // pending[row][col] = { text, remaining } for rowspan carry-forwards
  const pending = {};

  const allocatePending = (r) => { if (!pending[r]) pending[r] = {}; };

  $(table).find('tr').each((r, tr) => {
    allocatePending(r);
    grid[r] = [];
    let c = 0; // virtual column cursor

    $(tr).find('td').each((_, td) => {
      // Skip over columns already filled by rowspan from previous rows
      while (pending[r][c]) {
        const p = pending[r][c];
        grid[r][c] = { text: p.text, isSpanned: true };
        if (p.remaining > 1) {
          allocatePending(r + 1);
          pending[r + 1][c] = { text: p.text, remaining: p.remaining - 1 };
        }
        delete pending[r][c];
        c++;
      }

      const colspan = parseInt($(td).attr('colspan') || '1', 10);
      const rowspan = parseInt($(td).attr('rowspan') || '1', 10);

      // Collect all paragraph texts from this cell and join with " | "
      const texts = cellTexts($, td);
      const merged = texts.join(' | ');

      for (let dc = 0; dc < colspan; dc++) {
        grid[r][c + dc] = { text: merged, isSpanned: false };

        if (rowspan > 1) {
          for (let dr = 1; dr < rowspan; dr++) {
            allocatePending(r + dr);
            pending[r + dr][c + dc] = { text: merged, remaining: rowspan - dr };
          }
        }
      }

      c += colspan;
    });

    // Flush any remaining pending carry-forwards (cells at the end of row)
    while (pending[r] && Object.keys(pending[r]).length) {
      if (!pending[r][c]) break;
      const p = pending[r][c];
      grid[r][c] = { text: p.text, isSpanned: true };
      if (p.remaining > 1) {
        allocatePending(r + 1);
        pending[r + 1][c] = { text: p.text, remaining: p.remaining - 1 };
      }
      delete pending[r][c];
      c++;
    }
  });

  return grid;
};

// ─── Cell entry parser ────────────────────────────────────────────────────────

/**
 * Parse a single timetable cell text into one or more {subject, initials[]} entries.
 *
 * Supported formats (non-exhaustive):
 *   "BDA-SP"                              → subject=BDA, initials=[SP]
 *   "CSDF- PM,VG /DWDM- APL,SKM"         → two elective groups
 *   "FS LAB B1 - YBS+MM"                 → subject=FS LAB B1, initials=[YBS, MM]
 *   "Intro to JAVA- RM,PL"               → subject=Intro to JAVA, initials=[RM, PL]
 *   "MINI PROJECT"                        → subject=MINI PROJECT, no initials
 *   "REMEDIAL CLASS" / "TUTORIAL CLASS"  → skip (no faculty)
 *   "LUNCH BREAK"                         → skip
 *
 * A cell can contain multiple lines (joined by " | ") for concurrent lab batches.
 * Each line is parsed independently.
 */
const SKIP_PATTERNS = /^(LUNCH|BREAK|REMEDIAL|TUTORIAL|MINI PROJECT|MINI PROJ)/i;

const parseEntry = (cellText) => {
  const entries = [];

  // A cell may have multiple sub-entries separated by " | " (from <p> lines) or "/"
  // We split on " | " first (physical line breaks), then on "/" for elective splits.
  const lines = cellText.split(' | ').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Each line may itself be "SUBJ1-INIT1 / SUBJ2-INIT2" for elective pairs
    const electiveParts = line.split(/\s*\/\s*/);

    for (const part of electiveParts) {
      const text = part.trim();
      if (!text) continue;
      if (SKIP_PATTERNS.test(text)) continue;

      // Split on the last " - " or "-" that separates subject from initials.
      // Use a regex that matches " - " or a dash followed by uppercase initials.
      const dashIdx = findFacultyDash(text);

      if (dashIdx === -1) {
        // No dash found → entire text is the subject, no identifiable faculty
        entries.push({ subject: text, initials: [] });
        continue;
      }

      const subject = text.slice(0, dashIdx).trim();
      const initPart = text.slice(dashIdx + 1).trim();

      // Extract 2-4 uppercase letter tokens as initials
      const initials = initPart.match(/\b[A-Z]{2,4}\b/g) || [];

      entries.push({ subject, initials });
    }
  }

  return entries;
};

/**
 * Find the index of the dash that separates the subject name from faculty initials.
 *
 * We look for the LAST occurrence of a dash that is followed (possibly after a space)
 * by 2-4 uppercase letters — which indicates faculty initials.
 *
 * Returns -1 if no such dash is found.
 */
const findFacultyDash = (text) => {
  // Matches " - INITIALS" or "-INITIALS" patterns (INITIALS = 2-4 uppercase letters)
  const re = /\s*-\s*(?=[A-Z]{2,4}\b)/g;
  let lastIdx = -1;
  let match;

  while ((match = re.exec(text)) !== null) {
    lastIdx = match.index;
  }

  return lastIdx;
};

// ─── Main extractor ───────────────────────────────────────────────────────────

/**
 * extractTables(html)
 *
 * Returns a map of { facultyFullName → { schedule, freeSlots } }
 * where:
 *   schedule  : [{ day, time, subject }]
 *   freeSlots : [{ day, time }]
 *
 * "Free" means a slot is not BREAK and not already occupied by that faculty.
 */
const extractTables = (html) => {
  const $ = cheerio.load(html);
  const facultyMap = buildFacultyMap($);

  const ttTable = $('table').eq(0);
  if (!ttTable.length) throw new Error("Timetable table not found in HTML.");

  const grid = expandGrid($, ttTable);
  if (grid.length === 0) throw new Error("Empty timetable grid.");

  // Row 0 is the header: DAY | time1 | time2 | …
  const timeLabels = grid[0].slice(1).map(cell => normaliseTime(cell ? cell.text : ''));

  // Validate we have sensible time labels
  const teachingTimes = timeLabels.filter(t => t && !isBreak(t));
  if (teachingTimes.length === 0) {
    throw new Error("Could not extract any teaching time slots from the header row.");
  }

  // facultyData[name] = { busySet: Set<"DAY-colIdx">, schedule: [], }
  const facultyData = {};

  const ensureFaculty = (name) => {
    if (!facultyData[name]) {
      facultyData[name] = { busySet: new Set(), schedule: [] };
    }
  };

  // Walk data rows (skip header)
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || !row[0]) continue;

    const day = (row[0].text || '').replace(/\s+/g, '').toUpperCase();
    if (!DAYS.has(day)) continue;

    for (let c = 1; c < timeLabels.length + 1; c++) {
      const normTime = timeLabels[c - 1];
      if (!normTime || isBreak(normTime)) continue;

      const cell = row[c];
      if (!cell || !cell.text) continue;

      const rawText = cell.text.trim();
      if (!rawText) continue;
      if (/LUNCH/i.test(rawText)) continue;

      const entries = parseEntry(rawText);

      for (const { subject, initials } of entries) {
        if (initials.length === 0) continue; // nothing to attribute

        for (const init of initials) {
          const fullName = facultyMap[init];
          if (!fullName) continue; // unknown initial

          ensureFaculty(fullName);
          const slotKey = `${day}-${c}`;

          if (!facultyData[fullName].busySet.has(slotKey)) {
            facultyData[fullName].busySet.add(slotKey);
            facultyData[fullName].schedule.push({ day, time: normTime, subject });
          }
        }
      }
    }
  }

  // Build output with free-slot calculation
  const result = {};

  for (const [name, data] of Object.entries(facultyData)) {
    const freeSlots = [];

    for (const day of DAYS) {
      timeLabels.forEach((normTime, idx) => {
        if (!normTime || isBreak(normTime)) return;
        const key = `${day}-${idx + 1}`;
        if (!data.busySet.has(key)) {
          freeSlots.push({ day, time: normTime });
        }
      });
    }

    result[name] = {
      schedule: data.schedule,
      freeSlots,
    };
  }

  return result;
};

// ─── Section-level flat view ──────────────────────────────────────────────────

/**
 * getTimetableJson(html)
 *
 * Returns a flat section-level view: { schedule, freeSlots }
 * where schedule contains every occupied slot (subject + resolved faculty name).
 *
 * Useful for rendering a section's own timetable (not per-faculty).
 */
const getTimetableJson = (html) => {
  const $ = cheerio.load(html);
  const facultyMap = buildFacultyMap($);

  const ttTable = $('table').eq(0);
  if (!ttTable.length) throw new Error("Timetable table not found.");

  const grid = expandGrid($, ttTable);
  if (grid.length === 0) throw new Error("Empty timetable grid.");

  const timeLabels = grid[0].slice(1).map(cell => normaliseTime(cell ? cell.text : ''));

  const schedule = [];
  const busyKeys = new Set();

  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || !row[0]) continue;

    const day = (row[0].text || '').replace(/\s+/g, '').toUpperCase();
    if (!DAYS.has(day)) continue;

    for (let c = 1; c < timeLabels.length + 1; c++) {
      const normTime = timeLabels[c - 1];
      if (!normTime || isBreak(normTime)) continue;

      const cell = row[c];
      if (!cell || !cell.text) continue;

      const rawText = cell.text.trim();
      if (!rawText || /LUNCH/i.test(rawText)) continue;

      const entries = parseEntry(rawText);

      for (const { subject, initials } of entries) {
        // Resolve primary faculty name (first recognized initial wins)
        let facultyName = 'Unknown';
        for (const init of initials) {
          if (facultyMap[init]) { facultyName = facultyMap[init]; break; }
        }

        const key = `${day}-${c}-${subject}`;
        if (!busyKeys.has(key)) {
          busyKeys.add(key);
          schedule.push({ day, time: normTime, subject, faculty: facultyName });
        }
      }
    }
  }

  // Free slots = columns that have no entry at all for the section
  const sectionBusyKeys = new Set(schedule.map(s => `${s.day}-${s.time}`));
  const freeSlots = [];

  for (const day of DAYS) {
    for (const normTime of timeLabels) {
      if (!normTime || isBreak(normTime)) continue;
      if (!sectionBusyKeys.has(`${day}-${normTime}`)) {
        freeSlots.push({ day, time: normTime });
      }
    }
  }

  return { schedule, freeSlots };
};

module.exports = { extractTables, getTimetableJson };