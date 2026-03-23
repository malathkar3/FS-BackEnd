from typing import List, Dict, Any
from app.utils.time_utils import normalize_time
from app.utils.parser_utils import extract_faculty_initials
import re

async def process_raw_data(raw_data: List[List[Any]]):
    """
    raw_data[0] -> GRID
    raw_data[1] -> FACULTY_TABLE
    """
    grid = raw_data[0]
    faculty_table = raw_data[1]
    
    time_labels = [normalize_time(t) for t in grid[0][1:]]
    faculty_map = build_faculty_map(faculty_table)
    
    normalized_grid = []
    for row in grid[1:]:
        day = row[0].strip().upper()
        slots = []
        for i, cell in enumerate(row[1:]):
            slots.append({
                "time": time_labels[i],
                "cell_text": cell
            })
        normalized_grid.append({"day": day, "slots": slots})
        
    return normalized_grid, faculty_map, time_labels

def build_faculty_map(faculty_table: List[List[str]]) -> Dict[str, Dict[str, str]]:
    """
    Expected row: [Subject Code, Subject Name, Initials, Full Name]
    """
    f_map = {}
    for row in faculty_table:
        if len(row) < 4: continue
        
        subj_name = row[1].strip()
        initials_str = row[2].strip()
        full_names_str = row[3].strip()
        
        # Split initials and full names (handle , and +)
        inits = re.split(r'[,+]', initials_str)
        names = re.split(r'[,+]', full_names_str)
        
        for i, init in enumerate(inits):
            clean_init = init.strip()
            if not clean_init: continue
            
            full_name = names[i].strip() if i < len(names) else names[0].strip()
            f_map[clean_init] = {
                "name": full_name,
                "subject": subj_name
            }
    return f_map
