from typing import List, Dict
from app.services.timetable_service import build_structured_timetable, compute_free_slots

# Simulation of a database/store
class DataStore:
    def __init__(self):
        self.faculty_map = {}
        self.schedules = {}
        self.time_labels = []

store = DataStore()

def get_faculty_list() -> List[Dict]:
    results = []
    for init, details in store.faculty_map.items():
        results.append({
            "initials": init,
            "name": details["name"],
            "subject": details["subject"]
        })
    return results

def get_timetable_by_faculty(initials: str) -> Dict:
    initials = initials.upper()
    if initials not in store.faculty_map:
        return None
    
    schedule = store.schedules.get(initials, [])
    # Group by day as per requested output format
    grouped = {}
    for item in schedule:
        day = item["day"]
        if day not in grouped:
            grouped[day] = []
        grouped[day].append({
            "time": item["time"],
            "subject": item["subject"],
            "type": item["type"]
        })
    
    formatted_schedule = [{"day": d, "slots": grouped[d]} for d in grouped]
    
    return {
        "faculty": {
            "initials": initials,
            "name": store.faculty_map[initials]["name"],
            "subject": store.faculty_map[initials]["subject"]
        },
        "schedule": formatted_schedule
    }

def get_faculty_free_slots(initials: str) -> List[Dict]:
    initials = initials.upper()
    if initials not in store.faculty_map:
        return None
        
    schedule = store.schedules.get(initials, [])
    return compute_free_slots(initials, schedule, store.time_labels)
