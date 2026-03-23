import re
from typing import List, Tuple

def extract_faculty_initials(cell_text: str) -> List[Tuple[str, str]]:
    """
    Handles complex patterns:
    - "FS-HK" -> [("HK", "FS")]
    - "CSDF- PM,VG /DWDM- APL,SKM" -> [("PM", "CSDF"), ("VG", "CSDF"), ("APL", "DWDM"), ("SKM", "DWDM")]
    - "YBS+MM" -> [("YBS", ""), ("MM", "")]
    """
    results = []
    if not cell_text:
        return results

    # Split by slash for multiple subjects
    subject_parts = re.split(r'/', cell_text)
    
    for part in subject_parts:
        subject = ""
        faculty_part = part
        
        if '-' in part:
            sub_name, fac_name = part.split('-', 1)
            subject = sub_name.strip()
            faculty_part = fac_name.strip()
            
        # Extract initials (2-4 uppercase letters)
        # Using re.split for , and +
        initials = re.split(r'[,+]', faculty_part)
        for init in initials:
            clean_init = init.strip()
            if re.match(r'^[A-Z]{2,4}$', clean_init):
                results.append((clean_init, subject))
            elif " " in clean_init:
                # Handle cases where there might be extra text
                matches = re.findall(r'\b[A-Z]{2,4}\b', clean_init)
                for m in matches:
                    results.append((m, subject))
                    
    return results

def clean_cell_text(cell_text: str) -> str:
    if not cell_text:
        return ""
    return cell_text.strip().replace('\n', ' ')
