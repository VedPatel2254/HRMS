# PHASE 3 — Attendance Management
# PRSECURITY HRMS

## IMPORTANT RULES
- Output every file 100% completely. Never use '...' or 'rest remains same'.
- After each file write "--- FILE COMPLETE ---" then start the next file immediately.
- If about to hit output limit, finish current file and write "--- PAUSED: Type CONTINUE ---"
- This is Phase 3 of 8. Phases 1 & 2 already built: Auth, Employees, Dashboards.
- DO NOT rebuild previous phase files. Only add NEW files or EXTEND existing ones where specified.

---

## CONTEXT
Project: PRSECURITY HRMS | Stack: React+Vite+TS+Tailwind+shadcn/ui | Node+Express+Prisma+PostgreSQL
Roles: ADMIN, HR, EMPLOYEE, INTERN | Currency: ₹ | Dates: DD MMM YYYY
Attendance: Hybrid office — capture geolocation + IP on punch. No hard geofencing, just record + display.

---

## STEP 1 — Update Prisma Schema: Attendance Model

Replace the placeholder Attendance model with the full schema:

```prisma
model Attendance {
  id            String   @id @default(uuid())
  userId        String
  date          DateTime @db.Date
  punchIn       DateTime?
  punchOut      DateTime?
  punchInLat    Float?
  punchInLong   Float?
  punchOutLat   Float?
  punchOutLong  Float?
  punchInIP     String?
  punchOutIP    String?
  workingHours  Float?
  status        AttendanceStatus @default(ABSENT)
  notes         String?
  isManualEntry Boolean  @default(false)
  approvedBy    String?
  approver      User?    @relation("AttendanceApprover", fields: [approvedBy], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, date])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  HALF_DAY
  HOLIDAY
  WEEKEND
  ON_LEAVE
}
```

Run: `npx prisma migrate dev --name add_attendance`

---

## STEP 2 — Attendance Backend

### FILE: backend/src/services/attendance.service.ts

`punchIn(userId, lat?, long?, ip)`:
- Check no punch-in exists for today
- Create Attendance record with date=today, punchIn=now, punchInLat, punchInLong, punchInIP
- Set status = PRESENT
- Return record

`punchOut(userId, lat?, long?, ip)`:
- Find today's attendance record for user
- Throw error if no punch-in found
- Throw error if already punched out
- Update: punchOut=now, punchOutLat, punchOutLong, punchOutIP
- Calculate workingHours = (punchOut - punchIn) in decimal hours (e.g. 7.5)
- If workingHours < 4: set status = HALF_DAY
- Return updated record

`getTodayAttendance(userId)`:
- Return today's attendance record for user or null

`getMyAttendance(userId, month, year)`:
- Return all attendance records for user for given month/year
- Include weekends as WEEKEND status and holidays from HolidayCalendar

`getAllAttendance(query)`:
- Paginated list: all users' attendance for a given date or date range
- Params: date (default today), userId (optional), status, page, limit
- Include user name and employeeId

`getMonthlyAttendanceSummary(userId, month, year)`:
- Count: workingDays (excluding weekends+holidays), presentDays, absentDays, halfDays, leaveDays
- Calculate attendance percentage
- Return summary object

`manualAttendanceEntry(data, adminUserId)`:
- HR/Admin creates or updates an attendance record for any user
- Set isManualEntry=true, approvedBy=adminUserId

`getAttendanceStats()`:
- For today: total present, total absent, total on leave
- Return counts

### FILE: backend/src/controllers/attendance.controller.ts
Controllers for all service functions. Extract IP from req.ip or req.headers['x-forwarded-for'].

### FILE: backend/src/routes/attendance.routes.ts
```
POST /api/attendance/punch-in       → punchIn (EMPLOYEE/INTERN/HR/ADMIN)
POST /api/attendance/punch-out      → punchOut (EMPLOYEE/INTERN/HR/ADMIN)
GET  /api/attendance/today          → getTodayAttendance (authenticated)
GET  /api/attendance/my             → getMyAttendance?month=&year= (authenticated)
GET  /api/attendance/my/summary     → getMonthlyAttendanceSummary?month=&year= (authenticated)
GET  /api/attendance                → getAllAttendance (HR/ADMIN)
GET  /api/attendance/:userId        → getUserAttendance (HR/ADMIN)
POST /api/attendance/manual         → manualAttendanceEntry (HR/ADMIN)
GET  /api/attendance/stats/today    → getAttendanceStats (HR/ADMIN)
```

---

## STEP 3 — Attendance Frontend

### FILE: frontend/src/api/attendance.api.ts
Functions for all attendance endpoints.

### FILE: frontend/src/components/attendance/PunchWidget.tsx
Large punch in/out widget used on employee dashboard:
- Shows current time (updates every second)
- Shows today's date
- Big button: "Punch In" (green) when not punched in, "Punch Out" (red) when punched in
- On click: request browser geolocation (navigator.geolocation.getCurrentPosition)
  - If granted: send lat/long with request
  - If denied: send request without lat/long (still works)
- Shows punch-in time after punching in
- Shows punch-out time + working hours after punching out
- Shows "Already completed for today" if both punched
- Loading state on button while API call in progress

### FILE: frontend/src/components/attendance/AttendanceCalendar.tsx
Monthly calendar heatmap component:
Props: `{ records: AttendanceRecord[], month: number, year: number, onMonthChange: fn }`
- Grid of days (7 columns)
- Colour per status: Present=green, Absent=red, Half Day=yellow, Leave=blue, Weekend=light grey, Holiday=purple
- Each day shows status initial (P/A/H/L/W/Ho)
- Hover tooltip: full date + status + punch times if available
- Previous/Next month navigation
- Legend at bottom

### FILE: frontend/src/components/attendance/AttendanceSummaryCard.tsx
Component showing monthly summary:
- Working Days, Present, Absent, Half Days, On Leave, Attendance %
- Circular progress showing attendance percentage

### FILE: frontend/src/pages/attendance/AttendancePage.tsx
Employee/Intern view:
- Month/Year selector at top right
- PunchWidget (today's punch)
- AttendanceSummaryCard for selected month
- AttendanceCalendar for selected month
- Attendance Log table below calendar:
  - Columns: Date, Day, Punch In, Punch Out, Working Hours, Status, Location (shows "📍 Captured" if lat/long exists, clickable to show coordinates)
  - Paginated, 31 rows max per month

### FILE: frontend/src/pages/attendance/TeamAttendancePage.tsx
HR/Admin view — 2 tabs:

Tab 1 — Today's Overview:
- Stats row: Present, Absent, On Leave (using attendance/stats/today endpoint)
- Table: all employees, their today status, punch-in time, punch-out time, working hours
- Status badge per row
- Search by name

Tab 2 — Monthly Logs:
- Month/Year selector
- DataTable: Employee Name, Employee ID, Total Present, Total Absent, Half Days, Leave Days, Attendance %
- Click row → opens employee's detailed monthly log in a modal/drawer
- Export CSV

### FILE: frontend/src/components/attendance/ManualEntryModal.tsx
HR/Admin modal to manually add/edit an attendance record:
- Select Employee (dropdown), Date picker
- Status dropdown, Punch In time, Punch Out time
- Notes field
- Submit → calls manual entry API

Add "Manual Entry" button to TeamAttendancePage that opens this modal.

---

## STEP 4 — Connect Punch Widget to Employee Dashboard

### Update frontend/src/pages/dashboard/EmployeeDashboardPage.tsx
- Replace the placeholder punch widget with the real `<PunchWidget />` component
- Below it show `<AttendanceSummaryCard />` for current month
- Fetch today's attendance on mount and pass to PunchWidget

---

## STEP 5 — Update Employee Detail Page (from Phase 2)

### Update frontend/src/pages/employees/EmployeeDetailPage.tsx
Replace the "Attendance" tab EmptyState with:
- Month/Year selector
- AttendanceSummaryCard
- AttendanceCalendar
- Attendance log table

---

## STEP 6 — Update Admin Dashboard Stats

### Update backend/src/services/dashboard.service.ts
Fill in the `presentToday` and `onLeaveToday` counts using real Attendance data.

---

## AFTER ALL FILES ARE COMPLETE

Write this exactly:
"✅ PHASE 3 COMPLETE — Attendance punch in/out with geolocation capture, monthly calendar view, team attendance overview, and manual entry are ready. Proceed to Phase 4 for Leave Management."
