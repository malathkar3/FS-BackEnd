from fastapi import APIRouter, HTTPException
from app.services import faculty_service
from app.schemas.faculty_schema import FacultyListResponse, FacultyTimetableResponse, FreeSlotsResponse

router = APIRouter(prefix="/api/faculty")

@router.get("/", response_model=FacultyListResponse)
async def get_faculty_list():
    data = faculty_service.get_faculty_list()
    return {"success": True, "data": data}

@router.get("/{name}/timetable", response_model=FacultyTimetableResponse)
async def get_faculty_timetable(name: str):
    data = faculty_service.get_timetable_by_faculty(name)
    if not data:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return {"success": True, **data}

@router.get("/{name}/free-slots", response_model=FreeSlotsResponse)
async def get_faculty_free_slots(name: str):
    data = faculty_service.get_faculty_free_slots(name)
    if data is None:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return {"success": True, "faculty": name.upper(), "free_slots": data}
