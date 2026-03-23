import re

def normalize_time(time_str: str) -> str:
    """
    Fixes malformed time strings:
    - "11:0-11:15" -> "11:00-11:15"
    - "01:1-2:00" -> "01:15-02:00"
    """
    if not time_str:
        return ""
    
    # Fix 11:0 cases
    time_str = time_str.replace("11:0-", "11:00-")
    
    # Fix 01:1- cases (typically lunch or transition)
    time_str = time_str.replace("01:1-", "01:15-")
    
    # General normalization: Ensure HH:MM format for single digits if possible
    # e.g., "1:15-2:00" -> "01:15-02:00"
    def fix_format(match):
        h, m = match.groups()
        return f"{int(h):02d}:{m}"

    # Handle the start and end part of the range
    parts = time_str.split('-')
    normalized_parts = []
    for part in parts:
        part = part.strip()
        # Match H:MM or HH:MM
        match = re.match(r'^(\d{1,2}):(\d{2})$', part)
        if match:
            normalized_parts.append(fix_format(match))
        else:
            normalized_parts.append(part)
            
    return "-".join(normalized_parts)
