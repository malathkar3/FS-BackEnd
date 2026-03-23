from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services import parser_service, timetable_service, faculty_service
from typing import Dict, Any

router = APIRouter(prefix="/api")

@router.post("/upload-timetable/")
async def upload_timetable(payload: Dict[str, Any]):
    """
    Accepts the already parsed JSON data:
    { "success": true, "data": [GRID, FACULTY_TABLE] }
    """
    if "data" not in payload or len(payload["data"]) < 2:
        raise HTTPException(status_code=400, detail="Invalid data format")
        
    raw_data = payload["data"]
    normalized_grid, faculty_map, time_labels = await parser_service.process_raw_data(raw_data)
    
    # Update Store
    faculty_service.store.faculty_map = faculty_map
    faculty_service.store.time_labels = time_labels
    faculty_service.store.schedules = timetable_service.build_structured_timetable(normalized_grid, faculty_map)
    
    return {"success": True, "message": "Timetable processed and stored successfully"}
