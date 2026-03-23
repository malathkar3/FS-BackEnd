# 📅 Timetable Dashboard Backend (V2)

A robust Node.js & Express-based backend designed for parsing complex university/college timetable documents (.docx) and extracting structured data for faculty schedules and free time slots.

---

## 🛠️ Features

- **Advanced DOCX Parsing**: Handles complex multi-table structures including merged cells (`colspan`).
- **Dynamic Legend Mapping**: Automatically maps faculty initials (e.g., `HK`) to full names (e.g., `Mr. HARI KRISHNAN N`) using a legend table.
- **Smart Filtering**: Filters out non-teaching slots like "LUNCH", "BREAK", and "PROCTORING".
- **Free Slot Calculation**: Automatically calculates available time slots for each faculty member across the entire week (MON-SAT).
- **In-Memory Store**: Performance-optimized caching for fast query responses.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
git clone <repository-url>
cd fs-backend2
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
```

### 4. Running the App
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 📡 API Documentation for Frontend Engineers

### **Base URL**: `http://localhost:5000/api`

---

### **1. Upload Timetable**
Upload a `.docx` file to parse and analyze. This action overwrites any previous data currently in memory.

- **Endpoint**: `/upload-timetable`
- **Method**: `POST`
- **Request Type**: `multipart/form-data`
- **Payload**:
  - `file`: (The `.docx` document)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "Mr. HARI KRISHNAN N": {
        "schedule": [
          { "day": "MON", "period": "09:00-10:00", "subject": "FS" },
          { "day": "TUE", "period": "11:15-12:15", "subject": "DAA" }
        ],
        "freeSlots": [
          { "day": "MON", "period": "10:00-11:00" },
          { "day": "WED", "period": "09:00-10:00" }
        ]
      }
    }
  }
  ```

---

### **2. Get Faculty List**
Returns a flat array of all parsed faculty names.

- **Endpoint**: `/faculty`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      "Mr. HARI KRISHNAN N",
      "Mrs. SARITHA P",
      "Mr. JITHEESH K"
    ]
  }
  ```

---

### **3. Get Faculty Schedule**
Returns the weekly teaching schedule for a specific faculty member.

- **Endpoint**: `/faculty/:name/timetable`
- **Method**: `GET`
- **Example**: `/api/faculty/Mr.%20HARI%20KRISHNAN%20N/timetable`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      { "day": "MON", "period": "09:00-10:00", "subject": "FS" },
      { "day": "WED", "period": "14:00-15:00", "subject": "FS LAB" }
    ]
  }
  ```

---

### **4. Get Faculty Free Slots**
Returns all available time slots where the faculty member is not teaching.

- **Endpoint**: `/faculty/:name/free-slots`
- **Method**: `GET`
- **Example**: `/api/faculty/Mrs.%20SARITHA%20P/free-slots`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      { "day": "MON", "period": "10:00-11:00" },
      { "day": "MON", "period": "14:00-15:00" },
      { "day": "TUE", "period": "09:00-10:00" }
    ]
  }
  ```

---

### **5. Health Check**
Check if the server is alive.

- **Endpoint**: `/health`
- **Method**: `GET`
- **Response**: `{ "status": "ok" }`

---

## 🏗️ Project Architecture

```text
fs-backend2/
├── src/
│   ├── routes/              # Express route declarations
│   ├── controllers/         # Request handling & data injection
│   ├── services/            # Core Business Logic
│   │   ├── docxParser       # DOCX -> HTML
│   │   ├── tableExtractor   # HTML -> Structured Row/Cell Data
│   │   └── timetableAnalyser# Data -> Faculty Schedule/FreeSlots Mapping
│   ├── middleware/          # Multer & Error Handling
│   └── utils/               # Formatting Helpers
├── app.js                   # App configuration (CORS, Middlewares)
└── server.js                # Server entry point
```

## 🛠️ Data Extraction Logic

1.  **Grid Detection**: Table 0 is assumed to be the timetable grid where Row 1 contains Days (`MON`, `TUE`, etc.) and the headers contain Time Labels.
2.  **Initial Resolving**: Table 1 is parsed as a Legend. It looks for abbreviations (like `HK`) and maps them to their honorary full names (`Mr. HARI KRISHNAN N`).
3.  **Colspan Handling**: The parser "explodes" merged cells across multiple columns to ensure time-slot accuracy.
4.  **Auto-Filter**: Any cell containing keywords like `LUNCH`, `BREAK`, or `SPORTS` is considered "Free" for the faculty unless explicitly assigned.

---

## 📄 License
ISC License
