# 📅 Timetable Dashboard Backend (V2)

A secure Node.js & Express-based backend designed for parsing complex university timetable documents and providing personal schedules via Firebase Authentication and Role-Based Access Control (RBAC).

---

## 🛠️ Key features
- **Secure Authentication**: Verified via Firebase Admin SDK (Bearer Tokens).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin` and `faculty` managed via Firestore.
- **Advanced DOCX Parsing**: Extracts schedules and free-slots from complex table structures.
- **Automated Name Matching**: Fuzzy logic matcher that links Firestore profiles to timetable records automatically.
- **Dynamic Legend Mapping**: Maps faculty initials to full names using a document legend.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Firebase Project with Firestore enabled.

### 2. Installation
```bash
git clone <repository-url>
cd fs-backend2
npm install
```

### 3. Firebase Configuration
1. Go to **Firebase Console** > **Project Settings** > **Service Accounts**.
2. Click **Generate New Private Key**.
3. Rename the downloaded file to `serviceAccountKey.json`.
4. Place it in `src/config/serviceAccountKey.json`.

### 4. Firestore Setup
Create two collections:
- `admin`: Document ID should be the Firebase UID.
- `faculty`: Document ID should be the Firebase UID. 
  - Ensure faculty documents have a `displayName` field matching (or similar to) the name in the timetable.

### 5. Running the App
```bash
npm run dev   # Development with nodemon
npm start     # Production
```

---

## 📡 API Documentation

### **Authentication**
All requests (except `/health`) require an `Authorization: Bearer <ID_TOKEN>` header.

### **Endpoints**

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/me` | All | Returns logged-in user profile & role. |
| `GET` | `/api/my-timetable` | All | Automatically fetches the timetable matching the user's name. |
| `POST` | `/api/upload-timetable`| Admin | Uploads and parses the `.docx` timetable file. |
| `GET` | `/api/faculty-data` | All | Lists all faculty names found in the timetable. |
| `GET` | `/api/faculty-data/:name/timetable` | All | Gets the schedule for a specific faculty name. |

---

## 🏗️ Project Structure
```text
fs-backend2/
├── src/
│   ├── config/              # Firebase Admin & Service Account
│   ├── middleware/          # Auth, RBAC, and Multer
│   ├── routes/              # Modularized API routes
│   ├── controllers/         # Logic for each endpoint
│   ├── services/            # DOCX Parsing & Analysis Engine
│   └── utils/               # Fuzzy Name Matcher & Helpers
├── app.js                   # Express configuration
└── server.js                # Entry point
```

---

## 📄 License
ISC License
