from typing import List, Dict, Any
from app.utils.parser_utils import extract_faculty_initials

DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
IGNORE_KEYWORDS = ["LUNCH BREAK", "MINI PROJECT", "AICTE ACTIVITY"]

def build_structured_timetable(normalized_grid: List[Dict], faculty_map: Dict) -> Dict[str, List[Dict]]:
    faculty_schedules = {}
    
    for row in normalized_grid:
        day = row["day"]
        for slot in row["slots"]:
            cell_text = slot["cell_text"]
            if not cell_text or any(kw in cell_text.upper() for kw in IGNORE_KEYWORDS):
                continue
                
            extracted = extract_faculty_initials(cell_text)
            for init, subj_prefix in extracted:
                if init not in faculty_schedules:
                    faculty_schedules[init] = []
                
                # Determine subject
                subject = subj_prefix
                if not subject and init in faculty_map:
                    subject = faculty_map[init]["subject"]
                elif not subject:
                    subject = cell_text
                
                faculty_schedules[init].append({
                    "day": day,
                    "time": slot["time"],
                    "subject": subject,
                    "type": "lecture"
                })
                
    return faculty_schedules

def compute_free_slots(faculty_initials: str, schedule: List[Dict], all_time_labels: List[str]) -> List[Dict]:
    busy_slots = {f"{s['day']}-{s['time']}" for s in schedule}
    free_slots = []
    
    for day in DAYS:
        for time in all_time_labels:
            key = f"{day}-{time}"
            if key not in busy_slots:
                free_slots.append({"day": day, "time": time})
                
    return free_slots
