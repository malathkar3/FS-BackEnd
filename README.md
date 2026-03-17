# Timetable Dashboard Backend (fs-backend2)

A Node.js & Express-based robust backend application designed to upload, parse, and analyze university/school timetables from Word `.docx` files. It converts the `.docx` file into structured JSON data by extracting tables, determining faculty schedules, and automatically calculating the free continuous slots available for each faculty member.

## 🚀 Features

- **Upload Timetables**: Upload a Microsoft Word (`.docx`) document containing timetable tables.
- **DOCX Parsing**: Utilizes `mammoth` and `cheerio` to parse Word documents into HTML and carefully extract table rows and columns.
- **Data Analysis**: Automatically maps tables against a configuration of Days (e.g., Monday-Friday) and Periods (P1, P2...).
- **Faculty Schedules**: Extracts which subject a faculty is teaching at what period/day.
- **Free Slot Calculation**: Determines when a faculty member is free based on all possible slots in the week.
- **In-Memory Storage**: The most recently uploaded timetable data is kept in memory to provide fast query responses.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **File Upload**: Multer (In-Memory buffer)
- **DOCX Parser**: Mammoth
- **HTML DOM Parser**: Cheerio
- **Environment config**: dotenv
- **CORS Support**: cors

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have Node.js and NPM installed on your machine.

### Installation

1. Clone or download the project.
2. Navigate into the project directory:
   ```bash
   cd fs-backend2
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server (development mode with nodemon):
   ```bash
   npm run dev
   ```
5. Or start the server in production mode:
   ```bash
   npm start
   ```

By default, the server runs on `PORT 5000` (can be overridden via `.env`).

---

## 📡 API Endpoints

### 1. Health Check
Check if the server is running properly.
- **Endpoint**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  { "status": "ok" }
  ```

---

### 2. Upload Timetable
Uploads the `.docx` timetable file to be parsed and stored.
- **Endpoint**: `/api/upload-timetable`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form-Data key**: `file` (Must attach the `.docx` file)
- **Response**: Returns the fully parsed structured data linking faculties to their schedules and free slots.

---

### 3. Get Faculty List
Retrieves a list of all distinct faculty members discovered in the latest parsed timetable.
- **Endpoint**: `/api/faculty`
- **Method**: `GET`
- **Response**: Array of faculty names.

---

### 4. Get Faculty Schedule
Retrieves the assigned timetable/schedule for a specific faculty member.
- **Endpoint**: `/api/faculty/:name/timetable`
- **Method**: `GET`
- **Path Parameter**: `name` (URL encoded string of the faculty's name, e.g., `Amit%20Sharma`)
- **Response**: Array of schedule objects detailing day, period, and assigned subject.

---

### 5. Get Faculty Free Slots
Retrieves an array of computed "free" slots for a specific faculty member.
- **Endpoint**: `/api/faculty/:name/free-slots`
- **Method**: `GET`
- **Path Parameter**: `name` (URL encoded string of the faculty's name)
- **Response**: Array of slot objects (day and period) where the faculty is currently unassigned/free.

---

## 📁 Project Structure

```text
fs-backend2/
├── app.js                   # Application initialization & routing setup
├── server.js                # Server entry point
├── package.json             # Project metadata and dependencies
├── .env                     # Environment variables
├── src/
│   ├── config/              # Timetable slots config (Days, Periods)
│   ├── controllers/         # Handlers for specific API routes (upload, faculty)
│   ├── middleware/          # Express middlewares (CORS, error handling, Multer)
│   ├── routes/              # Express API route declarations 
│   ├── services/            # Business logic (DOCX parsing, extracting tables, analysis)
│   └── utils/               # Helper functions (Cell parsing, Slot generating)
```

## 🤝 How it works under the hood
1. **Upload**: A user sends a `.docx` file through the `/api/upload-timetable` POST endpoint. 
2. **Parsing**: The buffer is passed to `mammoth` to convert the DOCX file to an HTML string.
3. **Extraction**: `cheerio` reads the HTML, loops through all `<table>` tags, and constructs a 2D array of rows and columns.
4. **Analysis**: The `timetableAnalyser.service` reads the 2D array, matches the top header row with available 'Days', and the first column to available 'Periods'. It parses each grid cell to extract the assigned individual faculty name.
5. **Compute Free Slots**: Once all busy slots are identified, the system subtracts them from the total possible weekly slots to determine free time.
6. **Query Endpoints**: `GET` requests check the stored mapped data to serve faculty schedules efficiently.
