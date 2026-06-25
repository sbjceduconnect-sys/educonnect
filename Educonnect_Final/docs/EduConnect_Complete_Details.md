# 📋 EduConnect — Complete Application Documentation

**SaiBalaji Junior College — College Management System**
*Comprehensive Technical & Functional Reference*
*Version 1.0 | June 2026*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Project Structure](#3-architecture--project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Security](#5-authentication--security)
6. [API Reference (All Endpoints)](#6-api-reference-all-endpoints)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Design System & Theming](#8-design-system--theming)
9. [Feature Modules (Complete Breakdown)](#9-feature-modules-complete-breakdown)
10. [Mobile Application (Capacitor)](#10-mobile-application-capacitor)
11. [Deployment & Infrastructure](#11-deployment--infrastructure)
12. [Environment Variables](#12-environment-variables)
13. [Codebase Statistics](#13-codebase-statistics)

---

## 1. Project Overview

| Property | Value |
|----------|-------|
| **Application Name** | EduConnect |
| **Institution** | SaiBalaji Junior College (SBJC) |
| **Type** | Full-Stack College Management System |
| **Platforms** | Web Application + Android APK (Capacitor) |
| **Frontend URL** | `http://localhost:3000` (dev) |
| **Backend URL** | `http://localhost:8000` (dev) |
| **Production URL** | `https://educonnectsbjc.ddns.net` |
| **App ID (Android)** | `com.sbjc.educonnect` |
| **Academic Year** | 2026-27 |
| **Streams** | 11th Science, 11th Commerce, 12th Science, 12th Commerce |
| **Sections** | A, B, C, D |
| **User Roles** | Admin, Teacher, Student |

### What EduConnect Does

EduConnect is a comprehensive college management platform that digitizes and automates:
- Student enrollment, approval, and profile management
- Course and subject organization across departments
- Attendance tracking (QR code + manual marking)
- Examination scheduling and result management
- Study material distribution and question paper uploads
- Timetable creation and viewing
- Library book catalog with issue/return tracking
- College-wide announcements with scope targeting
- Academic calendar event management
- Teacher office hours booking system
- Student feedback collection and analytics
- AI-powered topic summary generation (Gemini)
- Administrative audit logging for all write operations
- Lesson plan management for teachers

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.7 | UI framework |
| **Vite** | 8.0.13 | Build tool and dev server |
| **MUI (Material-UI)** | 5.18.0 | Component library |
| **MUI X Data Grid** | 6.20.4 | Advanced data tables |
| **MUI X Date Pickers** | 6.20.2 | Date/time inputs |
| **MUI Icons Material** | 5.18.0 | Icon library |
| **Emotion (React + Styled)** | 11.14.x | CSS-in-JS styling engine |
| **React Router DOM** | 6.30.4 | Client-side routing |
| **Axios** | 1.17.0 | HTTP client |
| **TanStack React Query** | 5.101.0 | Server state management / data fetching |
| **Framer Motion** | 12.40.0 | Animations and transitions |
| **Recharts** | 2.15.4 | Charts and data visualization |
| **FullCalendar** | 6.1.20 | Calendar component (Core, DayGrid, TimeGrid, Interaction) |
| **React Hook Form** | 7.77.0 | Form state management |
| **Yup** | 1.7.1 | Schema validation |
| **React Hot Toast** | 2.6.0 | Toast notifications |
| **React Quill** | 2.0.0 | Rich text editor (WYSIWYG) |
| **React Dropzone** | 14.4.1 | Drag-and-drop file uploads |
| **React QR Code** | 2.0.21 | QR code generation |
| **html5-qrcode** | 2.3.8 | QR code scanning (camera) |
| **jwt-decode** | 4.0.0 | JWT token decoding |
| **DayJS** | 1.11.21 | Date/time formatting |
| **XLSX** | 0.18.5 | Excel file generation/parsing |
| **Socket.IO Client** | 4.8.3 | Real-time communication (socket placeholder) |
| **Capacitor Core** | 8.4.0 | Native mobile bridge |
| **Capacitor Android** | 8.4.0 | Android platform |
| **Capacitor Camera** | 8.2.0 | Native camera access |
| **Capacitor Filesystem** | 8.1.2 | Native file system access |
| **Capacitor Share** | 8.0.1 | Native share dialog |
| **Capacitor Local Notifications** | 8.2.0 | Push notifications |
| **@capacitor-community/file-opener** | 8.0.1 | Open files natively |
| **Playwright** | 1.60.0 | End-to-end testing (dev) |
| **TypeScript** | 6.0.2 | Type checking (dev, partial) |

### 2.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | ≥ 3.11 | Runtime |
| **Django** | 5.0.7 | Web framework |
| **Django REST Framework** | 3.15.2 | REST API toolkit |
| **SimpleJWT** | 5.3.1 | JWT authentication |
| **django-cors-headers** | 4.4.0 | Cross-origin requests |
| **python-dotenv** | 1.0.1 | Environment variables |
| **Pillow** | ≥ 11.0.0 | Image processing (avatars) |
| **ReportLab** | 5.0.0 | PDF generation (progress reports) |
| **psycopg2-binary** | 2.9.10 | PostgreSQL driver |
| **dj-database-url** | 2.2.0 | Database URL parsing |
| **Gunicorn** | 22.0.0 | Production WSGI server |
| **SQLite** | Built-in | Development database |
| **PostgreSQL** | (production) | Production database |

### 2.3 External Services

| Service | Usage |
|---------|-------|
| **Google Gemini API** | AI-powered topic summary generation |
| **Gmail SMTP** | Email delivery for password reset OTPs |
| **Google Fonts (Inter)** | Typography |

---

## 3. Architecture & Project Structure

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │  Web Browser     │    │  Android APK (Capacitor)     │    │
│  │  React 19 + Vite │    │  React 19 + WebView          │    │
│  └────────┬─────────┘    └───────────┬──────────────────┘    │
│           │           HTTPS           │                      │
│           └───────────┬───────────────┘                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │    NGINX Proxy     │  (Production only)
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │   Django 5 + DRF   │
              │   /api/v1/*        │
              │   Gunicorn WSGI    │
              ├────────────────────┤
              │   Middleware:       │
              │   • CORS           │
              │   • Security       │
              │   • Session        │
              │   • CSRF           │
              │   • Auth           │
              │   • AuditLog       │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │  SQLite / Postgres │
              │  16 Tables         │
              └────────────────────┘
```

### 3.2 Backend Structure

```
educonnect-backend/
├── educonnect/                  # Django project config
│   ├── settings.py              # All configuration (DB, JWT, CORS, Email, etc.)
│   ├── urls.py                  # Master URL routing (/api/v1/*)
│   ├── wsgi.py                  # WSGI entry point
│   └── asgi.py                  # ASGI entry point
├── core/                        # Shared framework utilities
│   ├── authentication.py        # StudentSessionJWTAuthentication (single-session)
│   ├── permissions.py           # IsAdmin, IsTeacher, IsStudent, IsAdminOrTeacher, IsApproved
│   ├── response.py              # api_success(), api_error() standardized responses
│   ├── exceptions.py            # custom_exception_handler for DRF
│   ├── pagination.py            # StandardPagination (page_size=20, max=100)
│   ├── serializers.py           # Base serializers with camelCase conversion
│   └── case.py                  # snake_case ↔ camelCase conversion utilities
├── apps/                        # Feature modules (Django apps)
│   ├── accounts/                # User, UserProfile, Auth views, Dashboard views
│   ├── departments/             # Department CRUD + HoD assignment
│   ├── courses/                 # Course CRUD + student enrollment
│   ├── subjects/                # Subject CRUD
│   ├── attendance/              # AttendanceRecord, ActiveQRCode, AttendanceEditRequest
│   ├── exams/                   # Exam + Result models and views
│   ├── study_materials/         # File upload + download
│   ├── announcements/           # Scoped announcements (system/department/course)
│   ├── calendar_events/         # Academic calendar events
│   ├── feedback/                # Feedback + OfficeHour models
│   ├── office_hours/            # (URLs routed from feedback module)
│   ├── audit_logs/              # AuditLog model + middleware
│   ├── ai_summary/              # Gemini API integration
│   ├── timetables/              # Timetable with JSON schedule
│   ├── lesson_plans/            # Teacher lesson plans
│   └── library/                 # Book + BookTransaction models
├── media/                       # Uploaded files (avatars, materials)
├── db.sqlite3                   # SQLite database (dev)
├── requirements.txt             # Python dependencies
├── gunicorn.conf.py             # Production server config
├── seed.py                      # Database seeder
└── seed_timetables.py           # Timetable data seeder
```

### 3.3 Frontend Structure

```
educonnect-client/
├── index.html                   # Entry HTML with Inter font, error handlers
├── vite.config.js               # Vite config with API proxy
├── capacitor.config.ts          # Android app config (com.sbjc.educonnect)
├── package.json                 # NPM dependencies
├── android/                     # Capacitor Android project
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Master routing + provider hierarchy
│   ├── api/
│   │   ├── axiosInstance.js     # Axios config, interceptors, token refresh
│   │   └── index.js             # All API service functions (14 API modules)
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Authentication state + JWT management
│   │   ├── ThemeContext.jsx     # Light/Dark theme toggle
│   │   └── NotificationContext.jsx  # Announcement polling + unread count
│   ├── components/
│   │   ├── LoadingScreen.jsx    # Full-screen loading spinner
│   │   ├── ProtectedRoute.jsx   # Auth + role guard wrapper
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx  # Main app shell (sidebar + topbar + outlet)
│   │   │   ├── Sidebar.jsx      # Navigation sidebar (role-based menu items)
│   │   │   └── Topbar.jsx       # Top bar (search, notifications, user menu)
│   │   └── common/
│   │       └── PageHeader.jsx   # Reusable page header component
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx         # Email/password login
│   │   │   ├── RegisterPage.jsx      # 3-step registration wizard
│   │   │   └── ForgotPasswordPage.jsx # OTP-based password reset
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx     # Role-based dashboard router
│   │   │   ├── AdminDashboard.jsx    # Admin stats + charts
│   │   │   ├── TeacherDashboard.jsx  # Teacher stats + quick actions
│   │   │   └── StudentDashboard.jsx  # Student stats + progress charts
│   │   ├── admin/
│   │   │   ├── UserManagementPage.jsx      # Full user CRUD + bulk ops
│   │   │   ├── DepartmentPage.jsx          # Department/stream management
│   │   │   ├── AuditLogsPage.jsx           # System event monitoring
│   │   │   └── AttendanceReportsPage.jsx   # Reports + edit requests
│   │   ├── teacher/
│   │   │   ├── AttendanceMarkerPage.jsx    # QR + manual attendance
│   │   │   ├── ExamManagerPage.jsx         # Exam CRUD
│   │   │   ├── ResultEntryPage.jsx         # Mark entry + bulk
│   │   │   ├── SubjectListPage.jsx         # Subject management
│   │   │   ├── LessonPlannerPage.jsx       # Lesson plan CRUD
│   │   │   └── AISummaryPage.jsx           # Gemini AI summaries
│   │   ├── student/
│   │   │   ├── CourseDetailsPage.jsx       # Course listing + enrollment
│   │   │   ├── StudentAttendancePage.jsx   # Personal attendance view
│   │   │   ├── StudentExamsPage.jsx        # Exam schedule view
│   │   │   ├── StudentResultsPage.jsx      # Grade/result view
│   │   │   └── StudyMaterialsPage.jsx      # Material downloads
│   │   ├── common/
│   │   │   ├── AnnouncementPage.jsx        # Announcements CRUD + view
│   │   │   ├── CalendarPage.jsx            # FullCalendar events
│   │   │   ├── TimetablePage.jsx           # Weekly schedule grid
│   │   │   ├── LibraryPage.jsx             # Book catalog + transactions
│   │   │   ├── FeedbackPage.jsx            # Feedback submission + view
│   │   │   ├── OfficeHoursPage.jsx         # Booking system
│   │   │   ├── SettingsPage.jsx            # 4-tab settings panel
│   │   │   ├── ComingSoonPage.jsx          # Placeholder page
│   │   │   ├── NotFoundPage.jsx            # 404 error page
│   │   │   └── UnauthorizedPage.jsx        # 403 error page
│   │   └── profile/
│   │       └── ProfilePage.jsx             # Profile edit + QR code
│   ├── styles/
│   │   ├── theme.js             # MUI theme tokens (light/dark)
│   │   └── global.css           # Global CSS (scrollbars, animations)
│   ├── utils/
│   │   ├── constants.js         # App constants (roles, streams, colors)
│   │   └── helpers.js           # Utility functions (date, avatar, download)
│   └── hooks/
│       └── useAppPermissions.js # Native permission requests
```

---

## 4. Database Schema

The backend uses **16 Django models** across **20 database tables**.

### 4.1 `users` — User Accounts (extends AbstractUser)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | Auto-incremented ID |
| `email` | EmailField | UNIQUE, required | Login identifier (USERNAME_FIELD) |
| `username` | CharField | UNIQUE | Username |
| `first_name` | CharField | required | First name |
| `last_name` | CharField | required | Last name |
| `password` | CharField | hashed | Bcrypt-hashed password |
| `role` | CharField(10) | choices: admin/teacher/student | User role |
| `is_approved` | BooleanField | default: False | Admin approval status |
| `phone` | CharField(20) | blank | Phone number |
| `avatar` | ImageField | nullable, upload: avatars/ | Profile picture |
| `department_id` | FK → departments | nullable, SET_NULL | Department association |
| `current_session_id` | CharField(255) | nullable | Single-session enforcement token |
| `reset_code` | CharField(6) | nullable | Password reset OTP |
| `reset_code_expires_at` | DateTimeField | nullable | OTP expiration timestamp |
| `created_at` | DateTimeField | auto_now_add | Registration timestamp |
| `updated_at` | DateTimeField | auto_now | Last update timestamp |
| `is_active` | BooleanField | default: True | Django built-in active flag |
| `is_staff` | BooleanField | default: False | Django admin access |
| `is_superuser` | BooleanField | default: False | Django superuser flag |

### 4.2 `user_profiles` — Extended User Profile

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | Auto-incremented ID |
| `user_id` | OneToOne → users | CASCADE | Linked user account |
| `phone` | CharField(20) | blank | Contact phone |
| `date_of_birth` | DateField | nullable | Date of birth |
| `stream` | CharField(100) | blank | Academic stream (11th Sci, 12th Com, etc.) |
| `section` | CharField(20) | blank | Class section (A/B/C/D) |
| `enrollment_no` | CharField(50) | blank | Student roll/registration number |
| `employee_id` | CharField(50) | blank | Teacher employee ID |
| `guardian_name` | CharField(200) | blank | Student's guardian name |
| `guardian_phone` | CharField(20) | blank | Guardian phone |
| `qualification` | CharField(200) | blank | Teacher qualification |
| `specialization` | CharField(200) | blank | Teacher specialization |
| `academic_year` | CharField(50) | default: 2026-27 | Current academic year |

> [!NOTE]
> A `UserProfile` is auto-created via Django signals whenever a `User` is created.

### 4.3 `departments` — Academic Departments/Streams

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `name` | CharField(100) | UNIQUE | Department name |
| `code` | CharField(10) | UNIQUE | Short code (e.g., 11SCI) |
| `hod_id` | FK → users | nullable, SET_NULL | Head of Department |
| `description` | TextField | blank | Description |
| `created_at` | DateTimeField | auto_now_add | Creation timestamp |

### 4.4 `subjects` — Academic Subjects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `name` | CharField(200) | | Subject name |
| `code` | CharField(20) | UNIQUE | Subject code |
| `department_id` | FK → departments | CASCADE | Parent department |
| `teacher_id` | FK → users | nullable, SET_NULL | Assigned teacher |
| `type` | CharField(20) | choices: theory/practical/elective | Subject type |
| `weekly_hours` | PositiveSmallInt | default: 4 | Hours per week |
| `created_at` | DateTimeField | auto_now_add | |

### 4.5 `courses` — Academic Courses/Classes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `name` | CharField(200) | | Course name |
| `code` | CharField(20) | UNIQUE | Course code |
| `credits` | PositiveSmallInt | default: 3 | Credit hours |
| `semester` | PositiveSmallInt | default: 1 | Semester number |
| `description` | TextField | blank | Course description |
| `teacher_id` | FK → users | nullable, SET_NULL | Assigned teacher |
| `department_id` | FK → departments | nullable, SET_NULL | Department |
| `academic_year` | CharField(20) | default: 2026-27 | Academic year |
| `students` | M2M → users | blank | Enrolled students |
| `created_at` | DateTimeField | auto_now_add | |

### 4.6 `exams` — Examinations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Exam title |
| `course_id` | FK → courses | CASCADE | Associated course |
| `subject_id` | FK → subjects | nullable, CASCADE | Associated subject |
| `date` | DateField | | Exam date |
| `duration` | CharField(50) | blank | Duration string |
| `max_marks` | PositiveInt | default: 100 | Maximum possible marks |
| `type` | CharField(20) | choices: Theory/Practical/Viva/mid/final/quiz/assignment | Exam type |
| `academic_year` | CharField(20) | blank | Academic year |
| `created_at` | DateTimeField | auto_now_add | |

### 4.7 `results` — Exam Results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `student_id` | FK → users | CASCADE | Student |
| `exam_id` | FK → exams | CASCADE | Exam |
| `marks` | FloatField | default: 0 | Marks obtained |
| `grade` | CharField(5) | blank, auto-calculated | Letter grade |
| `remarks` | TextField | blank | Teacher remarks |
| `is_published` | BooleanField | default: False | Publication status |
| `created_at` | DateTimeField | auto_now_add | |

**Unique constraint**: `(student_id, exam_id)` — one result per student per exam.

**Auto-grading formula** (calculated on `save()`):

| Percentage | Grade |
|-----------|-------|
| ≥ 90% | A+ |
| ≥ 80% | A |
| ≥ 75% | B+ |
| ≥ 70% | B |
| ≥ 60% | C |
| ≥ 50% | D |
| < 50% | F |

### 4.8 `attendance_records` — Attendance Entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `student_id` | FK → users | CASCADE | Student |
| `course_id` | FK → courses | CASCADE | Course |
| `subject_id` | FK → subjects | nullable, CASCADE | Subject |
| `date` | DateField | | Class date |
| `status` | CharField(10) | choices: Present/Absent/Late/Excused | Attendance status |
| `method` | CharField(10) | choices: manual/qr, default: manual | Marking method |
| `marked_by_id` | FK → users | nullable, SET_NULL | Who marked it |
| `created_at` | DateTimeField | auto_now_add | |

**Unique constraint**: `(student_id, course_id, subject_id, date)`

### 4.9 `active_qr_codes` — Live QR Attendance Tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `token` | CharField(6) | UNIQUE | 6-character QR code token |
| `course_id` | FK → courses | CASCADE | Target course |
| `subject_id` | FK → subjects | CASCADE | Target subject |
| `expires_at` | DateTimeField | | Token expiry time |
| `created_at` | DateTimeField | auto_now_add | |

### 4.10 `attendance_edit_requests` — Teacher Edit Requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `attendance_record_id` | FK → attendance_records | CASCADE | Target record |
| `requested_by_id` | FK → users | CASCADE | Requesting teacher |
| `new_status` | CharField(10) | choices: Present/Absent/Late/Excused | Proposed status |
| `reason` | TextField | | Justification |
| `status` | CharField(10) | choices: Pending/Approved/Rejected | Request status |
| `created_at` | DateTimeField | auto_now_add | |
| `updated_at` | DateTimeField | auto_now | |

### 4.11 `announcements`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Announcement title |
| `body` | TextField | | Full content |
| `priority` | CharField(10) | choices: High/Medium/Low | Priority level |
| `scope` | CharField(15) | choices: system/department/course | Target audience scope |
| `target_department_id` | FK → departments | nullable | For department scope |
| `target_course_id` | FK → courses | nullable | For course scope |
| `category` | CharField(50) | blank | Optional category tag |
| `author_id` | FK → users | nullable, SET_NULL | Author |
| `created_at` | DateTimeField | auto_now_add | |

### 4.12 `study_materials`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Material title |
| `file` | FileField | upload: study_materials/ | Uploaded file |
| `type` | CharField(30) | choices: Notes/Assignments/Past Papers/References/Lab Manuals/pdf/note/ppt/video/question_paper | Material type |
| `course_id` | FK → courses | nullable | Associated course |
| `subject_id` | FK → subjects | nullable | Associated subject |
| `uploaded_by_id` | FK → users | nullable, SET_NULL | Uploader |
| `description` | TextField | blank | Description |
| `created_at` | DateTimeField | auto_now_add | |

### 4.13 `calendar_events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Event title |
| `description` | TextField | blank | Event description |
| `start_date` | DateField | | Start date |
| `end_date` | DateField | nullable | End date |
| `type` | CharField(20) | choices: exam/holiday/event/deadline/academic | Event type |
| `color` | CharField(20) | blank | Display color |
| `department_id` | FK → departments | nullable | Optional department filter |
| `created_by_id` | FK → users | nullable, SET_NULL | Creator |
| `created_at` | DateTimeField | auto_now_add | |

### 4.14 `feedback` & `office_hours`

**Feedback:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `target_type` | CharField(20) | default: general | Feedback target |
| `target_id` | IntegerField | nullable | Target entity ID |
| `department_id` | FK → departments | nullable | Department |
| `rating` | PositiveSmallInt | default: 5 | Rating (1-5) |
| `comment` | TextField | blank | Feedback text |
| `category` | CharField(50) | default: other | Category (teaching/content/facilities/other) |
| `submitted_by_id` | FK → users | nullable, SET_NULL | Submitter |
| `created_at` | DateTimeField | auto_now_add | |

**Office Hours:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `teacher_id` | FK → users | CASCADE | Teacher |
| `subject` | CharField(100) | blank | Subject |
| `day` | CharField(10) | choices: Mon-Sat | Day of week |
| `start_time` | TimeField | | Start time |
| `end_time` | TimeField | | End time |
| `room` | CharField(50) | blank | Room location |
| `max_slots` | PositiveInt | default: 5 | Maximum bookings |
| `bookings` | JSONField | default: [] | Array of booking objects |
| `created_at` | DateTimeField | auto_now_add | |

### 4.15 `audit_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `user_id` | FK → users | nullable, SET_NULL | Actor |
| `action` | CharField(100) | | Action performed (e.g., "POST /api/v1/users") |
| `target` | CharField(200) | blank | Target resource and status |
| `ip` | GenericIPAddress | nullable | Client IP address |
| `timestamp` | DateTimeField | auto_now_add | When it happened |

### 4.16 `timetables`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `department_id` | FK → departments | CASCADE | Department |
| `stream` | CharField(50) | | Academic stream |
| `section` | CharField(20) | | Class section |
| `academic_year` | CharField(50) | default: 2026-27 | Academic year |
| `schedule` | JSONField | default: [] | Array of `{ day, slots: [{ subjectId, teacherId, startTime, endTime, room }] }` |
| `created_at` | DateTimeField | auto_now_add | |

### 4.17 `lesson_plans`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Plan title |
| `description` | TextField | blank | Content/objectives |
| `course_id` | FK → courses | CASCADE | Course |
| `subject_id` | FK → subjects | CASCADE | Subject |
| `planned_date` | DateField | | Scheduled date |
| `status` | CharField(20) | choices: draft/planned/completed | Plan status |
| `teacher_id` | FK → users | CASCADE | Teacher |
| `created_at` | DateTimeField | auto_now_add | |

### 4.18 `books` & `book_transactions`

**Books:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `title` | CharField(200) | | Book title |
| `author` | CharField(200) | | Author name |
| `isbn` | CharField(50) | UNIQUE | ISBN number |
| `category` | CharField(100) | default: Reference | Book category |
| `publisher` | CharField(200) | blank | Publisher name |
| `shelf_location` | CharField(100) | blank | Shelf location code |
| `total_copies` | PositiveInt | default: 1 | Total copies |
| `available_copies` | PositiveInt | default: 1 | Currently available |
| `created_at` | DateTimeField | auto_now_add | |

**Book Transactions:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BigAutoField | PK | |
| `book_id` | FK → books | CASCADE | Book |
| `student_id` | FK → users | CASCADE | Borrower |
| `issue_date` | DateField | auto_now_add | Issue date |
| `due_date` | DateField | | Return deadline |
| `return_date` | DateField | nullable | Actual return date |
| `fine` | PositiveInt | default: 0 | Overdue fine (₹) |
| `status` | CharField(20) | choices: issued/returned/overdue | Transaction status |
| `created_at` | DateTimeField | auto_now_add | |

---

## 5. Authentication & Security

### 5.1 Authentication Flow

```
┌─────────────┐    POST /auth/login      ┌──────────────────┐
│   Client     │ ──────────────────────→  │   Django Backend  │
│   (React)    │ ←─────────────────────── │                  │
│              │  { accessToken,          │   Validates:     │
│              │    refreshToken (cookie), │   - email/pwd    │
│              │    user }                 │   - is_approved  │
└──────────────┘                          │   - sets session │
                                          └──────────────────┘
```

1. **Login**: POST `/auth/login` with `{email, password}` → returns `{accessToken, user}` + `refreshToken` as HTTP-only cookie
2. **Session Storage**: `accessToken` stored in `sessionStorage` (edu_token), user object in `sessionStorage` (edu_user)
3. **Authorization**: Every API request includes `Authorization: Bearer <accessToken>` header
4. **Token Refresh**: When a 401 is received, the Axios interceptor automatically calls POST `/auth/refresh` to get a new access token. Failed requests are queued and retried.
5. **Logout**: POST `/auth/logout` clears server session; client clears sessionStorage

### 5.2 JWT Configuration

| Parameter | Value |
|-----------|-------|
| Access Token Lifetime | 60 minutes |
| Refresh Token Lifetime | 7 days |
| Rotate Refresh Tokens | Yes |
| Blacklist After Rotation | No |
| Auth Header Type | Bearer |
| User ID Claim | user_id |

### 5.3 Single-Session Enforcement (Students)

Students can only be logged in on **one device** at a time:
- On login, a unique `session_id` is generated and stored in both the JWT token and the `User.current_session_id` field.
- The custom `StudentSessionJWTAuthentication` class checks every request: if the token's `current_session_id` doesn't match the database value, authentication fails with *"Your session has expired or you have logged in from another device."*

### 5.4 Institutional Registration Codes

| Role | Code | Purpose |
|------|------|---------|
| Admin | `SBJC-ADMIN-2026` | Required to register as admin |
| Teacher | `SBJC-TEACH-2026` | Required to register as teacher |
| Student | *(not required)* | Open registration, requires approval |

### 5.5 Password Reset Flow

1. User submits email → POST `/auth/forgot-password`
2. Backend generates a 6-digit OTP, stores it in `User.reset_code` with expiry in `reset_code_expires_at`
3. OTP is sent via email (SMTP) or logged to console
4. User submits OTP + new password → POST `/auth/reset-password`
5. Backend verifies OTP, checks expiry, updates password, clears reset fields

### 5.6 Permission Classes

| Class | Description |
|-------|-------------|
| `IsAdmin` | Authenticated + Approved + role=admin |
| `IsTeacher` | Authenticated + Approved + role=teacher |
| `IsStudent` | Authenticated + Approved + role=student |
| `IsAdminOrTeacher` | Authenticated + Approved + role in (admin, teacher) |
| `IsApproved` | Authenticated + Approved (any role) |

### 5.7 Audit Logging Middleware

The `AuditLogMiddleware` automatically logs all **POST/PUT/PATCH/DELETE** requests:
- Captures the `user`, HTTP `method + path`, `response status`, and client `IP address`
- Excludes `/audit-logs` and `/auth/login` to prevent noise
- Authenticates user via JWT header if Django auth hasn't resolved yet

---

## 6. API Reference (All Endpoints)

All endpoints are prefixed with `/api/v1/`.

### 6.1 Authentication

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/auth/register` | Public | Register new user with role + institutional code |
| POST | `/auth/login` | Public | Login → returns access token + user + refresh cookie |
| POST | `/auth/refresh` | Cookie | Refresh access token using refresh token cookie |
| POST | `/auth/logout` | Authenticated | Logout and clear session |
| GET | `/auth/me` | Authenticated | Get current user profile |
| PATCH | `/auth/change-password` | Authenticated | Change password (old + new) |
| POST | `/auth/forgot-password` | Public | Send password reset OTP to email |
| POST | `/auth/reset-password` | Public | Reset password with OTP verification |

### 6.2 Users

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/users/me` | Authenticated | Get current user (alias for /auth/me) |
| GET | `/users` | IsAdmin | List all users (filterable by role) |
| GET | `/users/<id>` | IsAdmin | Get single user |
| PUT | `/users/<id>` | IsAdmin | Update user details |
| PATCH | `/users/<id>` | Authenticated | Upload avatar (multipart) |
| DELETE | `/users/<id>` | IsAdmin | Delete user |
| PATCH | `/users/<id>/approve` | IsAdmin | Approve pending user |
| PATCH | `/users/<id>/role` | IsAdmin | Change user's role |
| POST | `/users/bulk-approve` | IsAdmin | Approve multiple users |
| POST | `/users/bulk-import` | IsAdmin | CSV bulk import users |
| POST | `/users/bulk-delete` | IsAdmin | Bulk delete students by class |

### 6.3 Dashboards

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/dashboard/admin` | IsAdmin | Admin stats (user counts, distributions) |
| GET | `/dashboard/teacher` | IsTeacher | Teacher stats (courses, students, announcements) |
| GET | `/dashboard/student` | IsStudent | Student stats (attendance, grades, courses) |

### 6.4 Departments

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/departments` | Authenticated | List all departments |
| GET | `/departments/<id>` | Authenticated | Get department details |
| POST | `/departments` | IsAdmin | Create department |
| PUT | `/departments/<id>` | IsAdmin | Update department |
| DELETE | `/departments/<id>` | IsAdmin | Delete department |
| PATCH | `/departments/<id>/hod` | IsAdmin | Assign Head of Department |

### 6.5 Courses

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/courses` | Authenticated | List courses (filter by teacherId, studentId) |
| GET | `/courses/<id>` | Authenticated | Get course details |
| POST | `/courses` | IsAdminOrTeacher | Create course |
| PUT | `/courses/<id>` | IsAdminOrTeacher | Update course |
| DELETE | `/courses/<id>` | IsAdmin | Delete course |
| POST | `/courses/<id>/enroll` | IsAdminOrTeacher | Enroll students |
| DELETE | `/courses/<id>/enroll/<studentId>` | IsAdminOrTeacher | Remove student |
| GET | `/courses/<id>/students` | Authenticated | Get enrolled students |

### 6.6 Subjects

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/subjects` | Authenticated | List subjects |
| GET | `/subjects/<id>` | Authenticated | Get subject details |
| POST | `/subjects` | IsAdminOrTeacher | Create subject |
| PUT | `/subjects/<id>` | IsAdminOrTeacher | Update subject |
| DELETE | `/subjects/<id>` | IsAdmin | Delete subject |

### 6.7 Attendance

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/attendance` | Authenticated | List attendance records (filterable) |
| POST | `/attendance` | IsAdminOrTeacher | Mark attendance (batch) |
| PUT | `/attendance/<id>` | IsAdminOrTeacher | Update attendance record |
| DELETE | `/attendance/<id>` | IsAdmin | Delete attendance record |
| POST | `/attendance/qr/generate` | IsTeacher | Generate QR code for session |
| POST | `/attendance/qr/scan` | IsStudent | Scan QR code to mark present |
| GET | `/attendance/subject/<subjectId>` | Authenticated | Get attendance by subject |
| GET | `/attendance/student/<studentId>` | Authenticated | Get student's attendance |
| GET | `/attendance/student/<studentId>/summary` | Authenticated | Get attendance summary stats |
| GET | `/attendance/reports` | IsAdmin | Get attendance reports |
| GET | `/attendance/edit-requests` | IsAdminOrTeacher | List edit requests |
| POST | `/attendance/edit-requests` | IsTeacher | Submit edit request |
| PATCH | `/attendance/edit-requests/<id>/action` | IsAdmin | Approve/reject edit request |

### 6.8 Exams

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/exams` | Authenticated | List exams |
| GET | `/exams/<id>` | Authenticated | Get exam details |
| POST | `/exams` | IsAdminOrTeacher | Create exam |
| PUT | `/exams/<id>` | IsAdminOrTeacher | Update exam |
| DELETE | `/exams/<id>` | IsAdminOrTeacher | Delete exam |

### 6.9 Results

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/results` | IsAdminOrTeacher | Submit results (array) |
| GET | `/results/exam/<examId>` | Authenticated | Get results for exam |
| GET | `/results/student/<studentId>` | Authenticated | Get student's results |
| GET | `/results/student/<studentId>/performance` | Authenticated | Get performance analytics |
| PATCH | `/results/<id>` | IsAdminOrTeacher | Update single result |
| PATCH | `/results/exam/<examId>/publish` | IsAdminOrTeacher | Publish exam results |
| GET | `/results/reports/progress/<studentId>` | Authenticated | Download PDF progress report |

### 6.10 Study Materials

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/materials` | Authenticated | List materials |
| GET | `/materials/<id>` | Authenticated | Get material details |
| POST | `/materials` | IsAdminOrTeacher | Upload material (multipart) |
| PUT | `/materials/<id>` | IsAdminOrTeacher | Update material |
| DELETE | `/materials/<id>` | IsAdminOrTeacher | Delete material |
| GET | `/materials/<id>/download` | Authenticated | Download file (blob) |
| GET | `/materials/question-papers` | Authenticated | List question papers only |

### 6.11 Announcements

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/announcements` | Authenticated | List announcements |
| GET | `/announcements/<id>` | Authenticated | Get announcement |
| POST | `/announcements` | IsAdminOrTeacher | Create announcement |
| PUT | `/announcements/<id>` | IsAdminOrTeacher | Update announcement |
| DELETE | `/announcements/<id>` | IsAdminOrTeacher | Delete announcement |

### 6.12 Calendar Events

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/calendar` | Authenticated | List events |
| POST | `/calendar` | IsAdminOrTeacher | Create event |
| PUT | `/calendar/<id>` | IsAdminOrTeacher | Update event |
| DELETE | `/calendar/<id>` | IsAdminOrTeacher | Delete event |

### 6.13 Feedback

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/feedback` | Authenticated | Submit feedback |
| GET | `/feedback` | Authenticated | List feedback |
| GET | `/feedback/summary` | IsAdmin | Get feedback summary |
| GET | `/feedback/department/<deptId>` | IsAdmin | Get department feedback |

### 6.14 Office Hours

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/office-hours` | Authenticated | List office hours |
| POST | `/office-hours` | IsTeacher | Create office hour slot |
| PUT | `/office-hours/<id>` | IsTeacher | Update slot |
| DELETE | `/office-hours/<id>` | IsTeacher | Delete slot |
| POST | `/office-hours/<id>/book` | IsStudent | Book a slot |
| PATCH | `/office-hours/<id>/cancel/<bookingIndex>` | Authenticated | Cancel booking |

### 6.15 Library

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/library/books` | Authenticated | List books |
| POST | `/library/books` | IsAdmin | Add book |
| PUT | `/library/books/<id>` | IsAdmin | Update book |
| DELETE | `/library/books/<id>` | IsAdmin | Delete book |
| POST | `/library/issue` | IsAdminOrTeacher | Issue book to student |
| POST | `/library/return/<transactionId>` | IsAdminOrTeacher | Return book |
| GET | `/library/transactions` | Authenticated | List transactions |
| GET | `/library/my-books` | IsStudent | Get student's borrowed books |

### 6.16 Timetables

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/timetables` | Authenticated | List timetables |
| GET | `/timetables/<id>` | Authenticated | Get timetable details |
| POST | `/timetables` | IsAdmin | Create timetable |
| PUT | `/timetables/<id>` | IsAdmin | Update timetable |
| DELETE | `/timetables/<id>` | IsAdmin | Delete timetable |
| GET | `/timetables/teacher/<teacherId>` | Authenticated | Get teacher's schedule |
| POST | `/timetables/validate` | IsAdmin | Validate timetable for conflicts |

### 6.17 Lesson Plans

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/lesson-plans` | IsAdminOrTeacher | List lesson plans |
| GET | `/lesson-plans/<id>` | IsAdminOrTeacher | Get plan details |
| POST | `/lesson-plans` | IsTeacher | Create plan |
| PUT | `/lesson-plans/<id>` | IsTeacher | Update plan |
| DELETE | `/lesson-plans/<id>` | IsTeacher | Delete plan |

### 6.18 AI Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/ai/lecture-summary` | IsAdminOrTeacher | Generate text summary via Gemini |
| POST | `/ai/lecture-summary/file` | IsAdminOrTeacher | Generate summary from uploaded file |

### 6.19 Audit Logs

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/audit-logs` | IsAdmin | List all audit logs |
| GET | `/audit-logs/<id>` | IsAdmin | Get single log entry |
| DELETE | `/audit-logs` | IsAdmin | Clear all audit logs |

---

## 7. Frontend Architecture

### 7.1 Provider Hierarchy

```jsx
<QueryClientProvider>          // TanStack React Query (server state cache)
  <ThemeProvider>               // Light/Dark theme (MUI CssBaseline)
    <AuthProvider>              // JWT auth state + login/logout/refresh
      <NotificationProvider>    // Announcement polling + unread count
        <RouterComponent>       // BrowserRouter (web) / HashRouter (native)
          <Suspense>            // Lazy loading fallback (LoadingScreen)
            <Routes>            // React Router v6 routes
```

### 7.2 Context Providers

| Context | State | Methods |
|---------|-------|---------|
| **AuthContext** | `user`, `accessToken`, `loading`, `isAuthenticated`, `isAdmin`, `isTeacher`, `isStudent` | `login()`, `register()`, `logout()`, `refreshToken()`, `setUser()` |
| **ThemeContext** | `mode` ('light'/'dark'), `isDark` | `toggleTheme()` |
| **NotificationContext** | `notifications[]`, `unreadCount` | `markAllRead()`, `clearNotifications()` |

### 7.3 Routing System

**Public Routes (no auth required):**
- `/login` → LoginPage
- `/register` → RegisterPage
- `/forgot-password` → ForgotPasswordPage
- `/unauthorized` → UnauthorizedPage

**Protected Routes (auth required, inside DashboardLayout):**
- `/dashboard` → DashboardPage (auto-renders Admin/Teacher/StudentDashboard by role)
- `/profile` → ProfilePage
- `/settings` → SettingsPage
- `/announcements` → AnnouncementPage
- `/courses` → CourseDetailsPage
- `/subjects` → SubjectListPage
- `/materials` → StudyMaterialsPage
- `/question-papers` → StudyMaterialsPage
- `/attendance` → *Role-based*: Student → StudentAttendancePage, Admin → AttendanceReportsPage, Teacher → AttendanceMarkerPage
- `/results` → *Role-based*: Student → StudentResultsPage, Teacher/Admin → ResultEntryPage
- `/exams` → *Role-based*: Student → StudentExamsPage, Teacher/Admin → ExamManagerPage
- `/timetable` → TimetablePage
- `/calendar` → CalendarPage
- `/library` → LibraryPage
- `/office-hours` → OfficeHoursPage
- `/feedback` → FeedbackPage

**Admin-only Routes:**
- `/users` → UserManagementPage
- `/departments` → DepartmentPage
- `/audit-logs` → AuditLogsPage

**Teacher/Admin Routes:**
- `/lesson-plans` → LessonPlannerPage
- `/ai-summary` → AISummaryPage

### 7.4 Sidebar Menu Items per Role

**Common (all roles):** Dashboard, Announcements, Calendar

**Student:** My Courses, Materials, Question Papers, My Attendance, Exams, My Results, Timetable, Library, Office Hours, Feedback

**Teacher:** My Courses, Subjects, Materials, Question Papers, Attendance, Exams, Results, Lesson Plans, Office Hours, AI Summary, Timetable

**Admin:** Users, Departments, Courses, Subjects, Exams, Results, Timetable, Library, Attendance Reports, Feedback, Audit Logs

### 7.5 API Client Architecture

**Axios Instance (`axiosInstance.js`):**
- Base URL: `VITE_API_URL` env var (default: `http://localhost:5000/api/v1`)
- Timeout: 10 seconds
- Credentials: `withCredentials: true` (for cookies)
- **Request Interceptor**: Adds Bearer token from auth header
- **Response Interceptor**: On 401, automatically attempts token refresh via POST `/auth/refresh`. Queues failed requests and retries after refresh. Dispatches `authExpired` event if refresh fails.

**14 API Service Modules** (`api/index.js`):
`authApi`, `userApi`, `departmentApi`, `courseApi`, `subjectApi`, `materialApi`, `attendanceApi`, `examApi`, `resultApi`, `timetableApi`, `announcementApi`, `lessonPlanApi`, `feedbackApi`, `libraryApi`, `calendarApi`, `officeHourApi`, `dashboardApi`, `aiApi`, `auditLogApi`

---

## 8. Design System & Theming

### 8.1 Color Palette

**Light Mode:**

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1B3F6B` | Navy — headings, sidebar, primary buttons |
| Primary Light | `#3A69A0` | Hover states |
| Primary Dark | `#143052` | Gradients |
| Secondary | `#F07830` | Orange — accents, secondary buttons |
| Secondary Light | `#F39359` | Hover states |
| Background Default | `#F5EDE0` | Page background (warm cream) |
| Background Paper | `#FFFFFF` | Cards, dialogs |
| Text Primary | `#1B3F6B` | Main text (navy) |
| Text Secondary | `#555770` | Muted text |

**Dark Mode:**

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#3A69A0` | Lighter navy for dark background |
| Secondary | `#F39359` | Lighter orange |
| Background Default | `#0F1E33` | Deep navy background |
| Background Paper | `#14253D` | Card background |
| Text Primary | `#E8E8F0` | Light text |
| Text Secondary | `#A0A0B8` | Muted text |

**Grade Colors:**

| Grade | Color |
|-------|-------|
| A+ | `#4CAF50` (green) |
| A | `#66BB6A` |
| B+ | `#8BC34A` |
| B | `#FFC107` (amber) |
| C | `#FF9800` (orange) |
| D | `#FF5722` (deep orange) |
| F | `#F44336` (red) |

**Attendance Colors:**

| Status | Color |
|--------|-------|
| Present | `#4CAF50` (green) |
| Absent | `#F44336` (red) |
| Late | `#FF9800` (orange) |
| Excused | `#2196F3` (blue) |

### 8.2 Typography

- **Font**: Inter (Google Fonts) with fallbacks: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- **Weights**: 300–900 loaded
- **h1**: fontWeight 800, letterSpacing -0.02em
- **h2**: fontWeight 700, letterSpacing -0.01em
- **h3–h6**: fontWeight 600–700
- **body1**: lineHeight 1.7
- **body2**: lineHeight 1.6
- **button**: textTransform none, fontWeight 600

### 8.3 Component Styling

| Component | Border Radius | Special Effects |
|-----------|--------------|-----------------|
| Button | 10px | Gradient backgrounds, hover translateY(-1px), box-shadow on hover |
| Card | 16px | Hover: translateY(-2px) + enhanced shadow |
| Paper | 12px | — |
| TextField | 10px | Hover: navy glow shadow, Focus: stronger shadow |
| Chip | 8px | fontWeight 500 |
| Dialog | 16px | — |
| Tooltip | 8px | 0.8rem fontSize |
| Avatar | — | 2px box-shadow |

### 8.4 Sidebar Theme

- **Light**: `linear-gradient(180deg, #FFFFFF, #F8FAFF)`
- **Dark**: `linear-gradient(180deg, #1A1A2E, #16213E)`
- **Active indicator**: 4px gradient bar (#1B3F6B → #F07830)
- **Logo gradient**: #1B3F6B → #F07830
- **Width**: 280px expanded, 72px collapsed

---

## 9. Feature Modules (Complete Breakdown)

### 9.1 Dashboard Module

**Admin Dashboard** — Stats: Total Students, Total Teachers, Admins, Pending Approvals, Total Courses. Charts: User distribution (horizontal bar). Table: Recent users with approval status.

**Teacher Dashboard** — Stats: My Courses, Total Students, Announcements. Charts: Students per course (bar). Quick Actions: Generate QR Attendance, Create Lesson Plan, Post Announcement, View Schedule.

**Student Dashboard** — Stats: Enrolled Courses, Attendance % (color-coded), Overall Grade, Subjects Passed. Charts: Attendance pie chart, Recent results area chart. Lists: My Courses, Recent Announcements.

### 9.2 User Management (Admin)

- **Tabs**: All Users, Students, Teachers, Admins, Pending Approval
- **Search**: Filter by name or email
- **Export**: Download as CSV
- **Approve**: Green checkmark button → confirmation dialog
- **Edit**: Dialog with role-specific fields (student: roll/stream/section/guardian; teacher: employee ID/qualification/specialization)
- **Change Role**: Dropdown menu to change to student/teacher/admin
- **Delete**: Confirmation dialog
- **Bulk CSV Import**: Download template → fill → upload → auto-create and approve
- **Bulk Delete**: Filter by class (11th/12th/all) → enter security code `SBJC-DELETE-CONFIRM-2026` → confirm

### 9.3 Attendance System

- **QR Code Flow**: Teacher generates 6-char token → QR code displays → Student scans → marked Present with method=qr
- **Manual Marking**: Teacher selects course + subject → full roster appears → mark each student → submit batch
- **Edit Requests**: Teacher submits request (record, new status, reason) → Admin approves/rejects → record updated on approval
- **Reports** (Admin): Session reports filterable by course/subject/date + Daily roster view + Edit request management

### 9.4 Library System

- **Book Catalog**: CRUD for books with title, author, ISBN, category, publisher, shelf location, copies tracking
- **Issue/Return**: Admin/teacher issues book to student → tracks due date → marks return → calculates overdue fines
- **Transaction Tracking**: Full history of issued, returned, and overdue books
- **Student View**: "My Books" shows currently borrowed books

### 9.5 Announcement System

- **Scoping**: `system` (all users), `department` (specific department), `course` (specific course)
- **Priority**: High, Medium, Low
- **Notification Integration**: NotificationContext polls announcements every 10 seconds, calculates unread count per user based on `last_read` timestamp in localStorage

### 9.6 AI Summary (Gemini)

- Teacher enters topic text or uploads a file
- Backend sends to Google Gemini API
- Generated summary returned with typewriter animation on frontend
- Supports text and file-based summaries

### 9.7 Timetable System

- Stored as JSON: `[{ day: "Monday", slots: [{ subjectId, teacherId, startTime, endTime, room }] }]`
- Admin creates timetable per department + stream + section + academic year
- Teachers can view their schedule filtered by teacherId
- Students view timetable matching their stream/section/department
- Validation endpoint checks for scheduling conflicts

---

## 10. Mobile Application (Capacitor)

| Property | Value |
|----------|-------|
| **App ID** | `com.sbjc.educonnect` |
| **App Name** | EduConnect |
| **Web Directory** | `dist/` (Vite build output) |
| **Android Scheme** | HTTPS |
| **Router** | HashRouter (vs BrowserRouter on web) |

### Native Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@capacitor/camera` | Profile picture capture |
| `@capacitor/filesystem` | Save downloaded files to device |
| `@capacitor/share` | Native share dialog for files |
| `@capacitor/local-notifications` | Push notification support |
| `@capacitor-community/file-opener` | Open downloaded PDFs/docs |

### Platform-Specific Behavior

- **File Downloads**: On native, files are saved to Cache directory and shared via Share plugin. On web, standard blob download.
- **Safe Area**: Sidebar and topbar respect `env(safe-area-inset-top)` for notched devices.
- **Drawer Transitions**: Disabled on native for smoother performance (`transitionDuration: 0`).

---

## 11. Deployment & Infrastructure

### 11.1 Production Environment

| Component | Technology |
|-----------|-----------|
| **Server** | Oracle Cloud VM (1 OCPU, 1 GB RAM) |
| **OS** | Ubuntu |
| **Web Server** | NGINX (reverse proxy) |
| **App Server** | Gunicorn (2 workers, sync, preload) |
| **Database** | PostgreSQL |
| **Domain** | `educonnectsbjc.ddns.net` (Dynamic DNS) |
| **SSL** | Let's Encrypt / HTTPS |

### 11.2 Gunicorn Configuration

```python
bind = "127.0.0.1:8000"
workers = 2           # Optimized for 1GB RAM
worker_class = "sync"
timeout = 120
keepalive = 5
max_requests = 500    # Restart workers to prevent memory leaks
max_requests_jitter = 50
preload_app = True    # Share memory across workers
```

### 11.3 Build & Deploy Commands

**Frontend:**
```bash
cd educonnect-client
npm run build          # Produces dist/ directory
# Copy dist/ to server
```

**Backend:**
```bash
cd educonnect-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic
gunicorn educonnect.wsgi:application -c gunicorn.conf.py
```

**Android APK:**
```bash
cd educonnect-client
npm run build
npx cap sync android
# Open android/ in Android Studio → Build APK
```

---

## 12. Environment Variables

### 12.1 Backend (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(insecure fallback)* | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed host headers |
| `USE_SQLITE` | `True` | Use SQLite (True) or PostgreSQL (False) |
| `DB_NAME` | `educonnect_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `60` | Access token TTL |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | Refresh token TTL |
| `ADMIN_CODE` | `SBJC-ADMIN-2026` | Admin registration code |
| `TEACHER_CODE` | `SBJC-TEACH-2026` | Teacher registration code |
| `BULK_DELETE_SECURITY_CODE` | `SBJC-DELETE-CONFIRM-2026` | Bulk delete confirmation code |
| `EMAIL_BACKEND` | `smtp.EmailBackend` | Email backend class |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USE_TLS` | `True` | Use TLS |
| `EMAIL_HOST_USER` | *(configured)* | SMTP username |
| `EMAIL_HOST_PASSWORD` | *(configured)* | SMTP app password |
| `GEMINI_API_KEY` | *(configured)* | Google Gemini API key |

### 12.2 Frontend (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://educonnectsbjc.ddns.net/api/v1` | Backend API base URL |
| `VITE_SOCKET_URL` | `/` | WebSocket URL (placeholder) |
| `VITE_GOOGLE_CLIENT_ID` | *(your-id)* | Google OAuth client ID |

---

## 13. Codebase Statistics

| Metric | Value |
|--------|-------|
| **Backend Python Files** | 133 files |
| **Backend Lines of Code** | 4,129 LOC |
| **Frontend Source Files** | 55 files (JSX/JS/CSS) |
| **Frontend Lines of Code** | 15,582 LOC |
| **Total Lines of Code** | **~19,711 LOC** |
| **Database Tables** | 20 tables |
| **API Endpoints** | ~90+ endpoints |
| **Django Apps** | 16 apps |
| **NPM Dependencies** | 37 packages |
| **Python Dependencies** | 9 packages |
| **Lazy-loaded Pages** | 28 components |
| **SQLite Database Size** | ~471 KB (development) |

---

> [!NOTE]
> This document was generated from direct source code analysis of the EduConnect repository. All models, endpoints, configurations, and statistics reflect the actual codebase as of June 2026.
