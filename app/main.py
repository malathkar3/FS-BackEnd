from fastapi import FastAPI
from app.routes import upload, faculty

app = FastAPI(title="Timetable Management System")

# Include Routers
app.include_router(upload.router)
app.include_router(faculty.router)

@app.get("/")
async def root():
    return {"message": "Timetable API is running"}
