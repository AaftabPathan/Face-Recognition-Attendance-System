# Vision Attend - AI-Powered Face Recognition Attendance System

Vision Attend is a modern, enterprise-grade biometric attendance management platform. It combines a premium **Angular (v19) Single Page Application** frontend, a scalable **Node.js Express** backend API, and a robust relational **MySQL** database. 

The system leverages client-side biometric processing via **`face-api.js`** (built on TensorFlow.js) to scan webcam frames at 30+ FPS directly in the browser. It extracts 128-dimensional facial coordinate vectors (embeddings) and submits them to the Express backend. The backend is equipped with server-side Euclidean distance matching algorithms to provide dual-verification constraints, live classroom rosters, and detailed historical report auditing.

---

## 🚀 Key Features

* **🛡️ Secure Access Control:** Sign-in and registration pages using standard **JWT tokens** and **bcrypt** password encryption, supporting role-based access configurations (`admin`, `faculty`, `student`).
* **📷 Real-Time Face Biometrics Onboarding:** Web-guided visual capturing module collecting exactly 4 stable 128-dimensional biometric embeddings to construct a robust identification template.
* **📹 Live Biometric Attendance Room:** 30+ FPS client-side webcam feed mapping faces, identifying matches, drawing glowing overlays (landmarks/bounding boxes), and preventing attendance duplication.
* **📝 Dynamic Roster & Corrections:** Roster table updates instantly upon biometric match. Absent students can request corrections from their portals, which faculty can review (approve/reject).
* **📊 Reports & Exports:** Filter logs by dates, classes, or students, and export complete datasets to CSV/Excel instantly on the client.
* **📈 Rich Dashboard Analytics:** Stunning, glassmorphic overview gauges, circular present today tracking loops, and department comparative rating progress bars.

---

## 🛠️ Project Stack Architecture

```text
face-recognition-attendance-system/
├── backend/
│   ├── config/db.js                  # Asynchronous MySQL Connection Pool (mysql2/promise)
│   ├── controllers/                  # MVC Controllers (auth, student, faculty, attendance, analytics)
│   ├── database/                     # MySQL Database scripts (schema.sql, seed.sql)
│   ├── middleware/                   # JWT validation, Role checks, and Multer upload limits
│   ├── routes/                       # Express Router mappings
│   ├── uploads/                      # Profile picture local cache
│   ├── .env                          # Connection credentials
│   ├── server.js                     # Central boot entrypoint
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/                 # Interceptors, role guards, services (Auth, Face, Attendance)
    │   │   ├── shared/components/    # Sidebar and Navbar dynamic shells
    │   │   └── features/             # Onboarding, Admin CRUDs, Biometrics rooms, Student portals
    │   ├── index.html                # Optimized SEO & Font Preconnects
    │   └── styles.css                # Global sleeks, glassmorphism, responsive grids
    └── package.json
```

---

## 📐 Mathematical Biometric Verification

Face verification in the system relies on the **Euclidean Distance** between two 128-dimensional facial descriptor vectors ($A$ and $B$):

$$d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{128} (A_i - B_i)^2}$$

* **Threshold Configuration:** A threshold of $d \le 0.60$ is applied. A distance below $0.60$ confirms a biometric match (lower values indicate higher confidence).
* **Dual-Verification Model:** While the frontend tracks, identifies, and renders bounding boxes at 30 FPS for immediate feedback, the final marking payload is validated on the Node.js Express server using the same Euclidean mathematical constraints to prevent header forgery or token spoofing.

---

## 💾 Database Setup (MySQL)

Create a MySQL database named `face_attendance_db` and run the schema and seed scripts:

1. **Launch MySQL Server** (local instance or cloud like Laragon, XAMPP, native MySQL Installer, Docker).
2. **Execute Schema:** Source and run `backend/database/schema.sql` to initialize all 10 relational tables, indexes, and cascading foreign keys.
3. **Execute Seed Data:** Source and run `backend/database/seed.sql` to populate high-quality test values:
   * **Admin credentials:** username `admin` / password `password123`
   * **Faculty credentials:** username `prof_sarah` / password `password123`
   * **Student credentials:** username `student_john` / password `password123`

---

## ⚙️ Backend Installation & Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Configure environmental credentials. Edit `backend/.env` to reflect your MySQL settings:
   ```env
   PORT=3000
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=face_attendance_db
   DB_PORT=3306
   JWT_SECRET=super_secret_jwt_token_for_attendance_system_2026
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Express server will boot at: http://localhost:3000*

---

## 💻 Frontend Installation & Setup

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Boot the Angular development workspace:
   ```bash
   npm start
   ```
   *Navigate your browser to: http://localhost:4200*

---

## 🎓 Suitability Checklists

* **🎯 Final Year College Project:** Features structured MVC layers, relational constraints, visual biometric scanner webcams, and automated mathematical vector distance checking.
* **💼 Resume Showcase:** Demonstrates proficiency in Angular (v19) standalone component architectures, functional interceptors/guards, asynchronous MySQL pool queries, and full-stack API integration.
* **🎨 Modern UI/UX Portfolio:** Uses curated HSL tailored colors, glassy overlays, scanning laser glows, circular metrics, and responsive sidebar menus.
