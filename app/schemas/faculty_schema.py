from pydantic import BaseModel
from typing import List, Dict, Optional

class FacultyBase(BaseModel):
    initials: str
    name: str
    subject: str

class Slot(BaseModel):
    time: str
    subject: str
    type: str = "lecture"

class DaySchedule(BaseModel):
    day: str
    slots: List[Slot]

class FreeSlot(BaseModel):
    day: str
    time: str

class FacultyListResponse(BaseModel):
    success: bool
    data: List[FacultyBase]

class FacultyTimetableResponse(BaseModel):
    success: bool
    faculty: FacultyBase
    schedule: List[DaySchedule]

class FreeSlotsResponse(BaseModel):
    success: bool
    faculty: str
    free_slots: List[FreeSlot]
