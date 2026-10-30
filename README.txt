HOSPITAL APPOINTMENT MANAGEMENT PORTAL
Beginner-friendly React + JSON Server project

REQUIREMENTS
1. Install Node.js (LTS) from the official Node.js website.
2. Extract this ZIP file.
3. Open the extracted hospital-appointment-portal folder in VS Code.

INSTALL
Open Terminal in VS Code and run:
npm install

START JSON SERVER
Open Terminal 1 and run:
npm run server

Keep this terminal running. JSON Server uses http://localhost:3000.

START REACT
Open a second terminal in VS Code and run:
npm run dev

Open the local address printed by Vite (usually http://localhost:5173).

FEATURES
- Dashboard counts and appointment status summary
- Doctors: add, view, edit, delete, search and specialization filter
- Patients: add, view, edit, delete and search
- Appointments: book, edit, cancel, and filter by date, doctor and status
- Form validation and unavailable-doctor warning
- Prevents booking the same doctor at the same date/time
- API service layer in src/api.js
- JSON Server database in db.json

IMPORTANT
- Run both terminals at the same time.
- The sample db.json has demo data. You can remove the sample records if you want a blank database.
- This is an educational demo, not a real hospital system. Do not enter real patient information.
