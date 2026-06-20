# EduConnect — Full-Stack College Management System

A premium full-stack college management platform with a React 19 + MUI v5 frontend and a Django 5 + DRF backend.

---

## 📁 Project Structure

```
Educonnect_Final/
├── educonnect-client/      # React 19 + Vite frontend
└── educonnect-backend/     # Django 5 + DRF backend
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **SQLite** (built-in)

---

### Frontend

```bash
cd educonnect-client
npm install        # already done
npm run dev        # starts at http://localhost:5173
```

### Backend

```bash
# 1. Activate virtual environment (already created)
.\venv\Scripts\activate          # Windows
source venv/bin/activate          # Linux/Mac

# 2. Configure environment
cp educonnect-backend/.env.example educonnect-backend/.env

# 3. Run migrations (creates SQLite db)
cd educonnect-backend
python manage.py makemigrations
python manage.py migrate

# 4. Create superuser (admin)
python manage.py createsuperuser

# 5. Start server
python manage.py runserver        # starts at http://localhost:8000
```

---

## 📡 API Endpoints (all prefixed `/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login/` | Login → returns `{accessToken, refreshToken, user}` |
| POST | `/auth/register/` | Register with institutional code |
| POST | `/auth/refresh/` | Refresh JWT |
| GET  | `/auth/me/` | Current user profile |
| POST | `/auth/forgot-password/` | Send password reset |
| GET/PATCH/DELETE | `/users/<id>/` | User CRUD |
| PATCH | `/users/<id>/approve/` | Admin approve user |
| POST | `/users/bulk-approve/` | Bulk approve users |
| CRUD | `/departments/` | Department management |
| CRUD | `/courses/` | Course management |
| GET/POST | `/attendance/` | Attendance records + batch submit |
| CRUD | `/exams/` | Exam management |
| GET/POST | `/results/` | Results |
| POST | `/results/bulk/` | Bulk result entry |
| CRUD | `/study-materials/` | File uploads |
| CRUD | `/announcements/` | Announcements |
| CRUD | `/calendar-events/` | Calendar events |
| GET/POST | `/feedback/` | Feedback |
| GET/POST | `/office-hours/` | Office hours |
| GET | `/audit-logs/` | System audit logs (admin only) |
| POST | `/ai/summarize/` | AI text analysis |
| GET | `/analytics/user-distribution/` | User stats |
| GET | `/analytics/attendance-trend/` | Attendance trend |
| GET | `/analytics/student-grades/` | Grade analytics |

---

## 🎨 Feature Highlights

### Frontend
- 🌓 **Light/Dark theme** with HSL color system
- ✨ **Glassmorphism** card overlays
- 📊 **Recharts** analytics (Bar, Line, Radar)
- 📅 **FullCalendar** academic calendar
- 🤖 **AI Summary** page with typewriter animation
- 📁 **React Dropzone** file upload
- 🔒 **Role-based routing** (Admin / Teacher / Student)
- 💜 **Custom scrollbars** with purple glow

### Backend
- 🔐 **SimpleJWT** authentication
- 👥 **Role-based permissions** (IsAdmin, IsTeacher, IsStudent)
- 📝 **Standardized responses** (`{success, message, data}`)
- 🏫 **Institutional code** validation on register
- 📈 **Analytics endpoints** with Django ORM aggregations
- 🗂️ **File upload** support via `MEDIA_ROOT`
