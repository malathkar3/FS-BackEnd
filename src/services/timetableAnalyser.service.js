// const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

// const BREAK_SLOTS = ["11:0-11:15", "01:1-2:00"];

// const cleanTime = (time) => time.replace(/\s+/g, "");

// const extractFacultyFromCell = (cellText) => {
//   if (!cellText) return [];

//   return cellText
//     .split(/[\s,\/+-]+/)
//     .map(t => t.trim())
//     .filter(t => /^[A-Z]{2,4}$/.test(t));
// };

// const analyzeTimetable = ({ timetableRows, facultyMap }) => {
//   const facultyData = {};

//   timetableRows.forEach(({ day, slots }) => {
//     slots.forEach(({ timeLabel, cellText }) => {

//       const cleanLabel = cleanTime(timeLabel);

//       // 🚫 Skip breaks
//       if (BREAK_SLOTS.some(b => cleanLabel.includes(cleanTime(b)))) {
//         return;
//       }

//       if (/LUNCH/i.test(cellText)) return;

//       const facultyInitials = extractFacultyFromCell(cellText);

//       facultyInitials.forEach(init => {
//         const fullName = facultyMap[init] || init;

//         if (!facultyData[fullName]) {
//           facultyData[fullName] = {
//             schedule: [],
//             busySet: new Set()
//           };
//         }

//         const key = `${day}-${cleanLabel}`;

//         if (!facultyData[fullName].busySet.has(key)) {
//           facultyData[fullName].schedule.push({
//             day,
//             time: cleanLabel,
//             subject: cellText
//           });

//           facultyData[fullName].busySet.add(key);
//         }
//       });
//     });
//   });

//   // 🧮 Calculate free slots
//   const allSlots = [];

//   timetableRows.forEach(({ day, slots }) => {
//     slots.forEach(({ timeLabel }) => {
//       const cleanLabel = cleanTime(timeLabel);

//       if (BREAK_SLOTS.some(b => cleanLabel.includes(cleanTime(b)))) return;

//       allSlots.push({ day, time: cleanLabel });
//     });
//   });

//   const result = {};

//   Object.keys(facultyData).forEach(name => {
//     const busy = facultyData[name].busySet;

//     const freeSlots = allSlots.filter(
//       slot => !busy.has(`${slot.day}-${slot.time}`)
//     );

//     result[name] = {
//       schedule: facultyData[name].schedule,
//       freeSlots
//     };
//   });

//   console.log("Final Parsed Data:", result);

//   return result;
// };

// module.exports = { analyzeTimetable };