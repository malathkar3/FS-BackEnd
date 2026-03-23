from pydantic import BaseModel
from typing import List, Dict

# Internal data models (can be used for DB storage)
class FacultyRecord(BaseModel):
    initials: str
    name: str
    subject: str
    schedule: List[Dict] = []
