# 📘 EduConnect — Administrator User Guide

**SaiBalaji Junior College — College Management System**
*Version 1.0 | June 2026*

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Admin Dashboard](#2-admin-dashboard)
3. [User Management](#3-user-management)
4. [Departments & Streams](#4-departments--streams)
5. [Course Management](#5-course-management)
6. [Subject Management](#6-subject-management)
7. [Exam Management](#7-exam-management)
8. [Result Management](#8-result-management)
9. [Attendance Reports](#9-attendance-reports)
10. [Timetable Management](#10-timetable-management)
11. [Announcements](#11-announcements)
12. [Calendar Events](#12-calendar-events)
13. [Library Management](#13-library-management)
14. [Feedback Management](#14-feedback-management)
15. [Audit Logs](#15-audit-logs)
16. [Profile & Settings](#16-profile--settings)

---

## 1. Getting Started

### 1.1 Logging In

1. Open the EduConnect app or navigate to the web portal.
2. On the **Login** screen, enter your **Email Address** and **Password**.
3. Click **Sign In**.
4. You will be redirected to the **Admin Dashboard**.

> [!NOTE]
> Admin accounts require an **Institution Code** during registration. After registration, another existing admin must **approve** your account before you can log in.

### 1.2 Forgot Password

1. On the Login screen, click **"Forgot Password?"**.
2. Enter your registered **email address** and click **Send Verification Code**.
3. Check your email (or backend console) for the **6-digit OTP code**.
4. Enter the verification code, your **new password**, and **confirm the password**.
5. Click **Reset Password** — you'll be redirected to the Login page.

### 1.3 Navigation Overview

After login, you'll see the **sidebar navigation** on the left with the following menu items:

| Menu Item | Description |
|-----------|-------------|
| Dashboard | System-wide overview with statistics and charts |
| Announcements | Create and manage college-wide announcements |
| Calendar | Academic calendar with events |
| Users | Manage all users (students, teachers, admins) |
| Departments | Configure academic streams and departments |
| Courses | Create and manage courses/classes |
| Subjects | Manage academic subjects |
| Exams | Create and schedule examinations |
| Results | View and enter student results |
| Timetable | Create and manage class schedules |
| Library | Manage library book inventory |
| Attendance Reports | View all attendance data across departments |
| Feedback | View and respond to user feedback |
| Audit Logs | Monitor all system actions and events |

---

## 2. Admin Dashboard

The Admin Dashboard provides a bird's-eye view of the entire system:

### 2.1 Statistics Cards

At the top, you'll see **5 stat cards** displaying:
- **Total Students** — Number of registered students
- **Total Teachers** — Number of registered teachers
- **Admins** — Number of admin accounts
- **Pending Approvals** — Users awaiting account approval (highlighted in red when > 0)
- **Total Courses** — Number of active courses

### 2.2 User Distribution Chart

A **horizontal bar chart** showing the distribution of users across roles (Students, Teachers, Admins).

### 2.3 Recent Users

A list of the **most recently registered users** showing:
- User avatar, name, and email
- Role badge (Student / Teacher / Admin)
- Approval status (✅ Approved or ⚠️ Pending)
- A **"View All"** button links to the full User Management page
- A quick-action button appears if there are **Pending Approvals**

---

## 3. User Management

Navigate to **Users** in the sidebar. This is the most critical admin feature.

### 3.1 Tabs

The User Management page has **5 filter tabs**:
- **All Users** — Shows every user in the system
- **Students** — Only student accounts
- **Teachers** — Only teacher accounts
- **Admins** — Only admin accounts
- **Pending Approval** — Users who have registered but not yet been approved

### 3.2 Searching & Exporting

- Use the **search bar** at the top of the table to filter by name or email.
- Click the **export button** to download the user list as a **CSV file** (`college_users_export.csv`).

### 3.3 Approving Users

When a new user registers, their account is in **"Pending"** status:

1. Switch to the **"Pending Approval"** tab.
2. Click the **green checkmark (✅)** icon next to the user.
3. A confirmation dialog will appear — click **"Approve"**.
4. The user's account will be activated and they can now log in.

> [!IMPORTANT]
> Users **cannot log in** until an admin approves their account. Check the Pending Approval tab regularly.

### 3.4 Editing User Details

1. Click the **three-dot menu (⋮)** on any user row.
2. Select **"Edit User Details"**.
3. A dialog opens where you can edit:
   - **For Students**: First/Last Name, Roll/Reg No, Stream Department, Academic Stream, Class Section, Guardian Name & Phone
   - **For Teachers**: First/Last Name, Employee ID, Stream Department, Qualification, Specialization
4. Click **"Save Changes"** to update.

### 3.5 Changing User Roles

1. Click the **three-dot menu (⋮)** on any user.
2. Select one of:
   - **Change to Student**
   - **Change to Teacher**
   - **Change to Admin**
3. The role will update immediately.

### 3.6 Deleting Users

1. Click the **three-dot menu (⋮)** on any user.
2. Select **"Delete User"** (shown in red).
3. Confirm the deletion — **this action cannot be undone**.

### 3.7 Bulk CSV Import

To register multiple users at once:

1. Click the **"Bulk CSV Import"** button (top-right).
2. In the dialog, click **"Download CSV Template"** to get the required format.
3. Fill in the CSV with user details:
   ```
   username,email,password,firstName,lastName,role,enrollmentNo,employeeId,phone
   ```
4. Click **"Select CSV File"** and upload the completed CSV.
5. Click **"Start Import"** — users will be created and auto-approved.

### 3.8 Bulk Delete Students

> [!CAUTION]
> This permanently deletes student accounts including all their profiles, grades, and logs. This action **cannot be undone**.

1. Click the **"Bulk Delete Students"** button (top-right, red).
2. Select the class filter:
   - **All Students (11th & 12th)**
   - **11th Class Students Only**
   - **12th Class Students Only**
3. Enter the security code: **`SBJC-DELETE-CONFIRM-2026`**
4. Click **"Delete Students"** to execute.

---

## 4. Departments & Streams

Navigate to **Departments** in the sidebar.

### 4.1 Creating a Department/Stream

1. Click **"Add Stream"** button.
2. Fill in:
   - **Stream Name** (e.g., "11th Science")
   - **Stream Code** (e.g., "11SCI") — auto-converted to uppercase, cannot be changed after creation
   - **Description** (optional)
3. Click **"Create Stream"**.

### 4.2 Editing a Department

1. Click the **pencil (✏️) icon** on the department row.
2. Update the Name or Description (Code cannot be changed).
3. Click **"Save Changes"**.

### 4.3 Assigning Head of Department (HoD)

1. Click the **gear (⚙️) icon** on the department row.
2. A dialog opens with a dropdown list of all registered **teachers**.
3. Select a teacher to assign as HoD.
4. Click **"Assign"**.

### 4.4 Deleting a Department

1. Click the **trash (🗑️) icon** on the department row.
2. Confirm the deletion.

---

## 5. Course Management

Navigate to **Courses** in the sidebar.

- View all courses with enrolled students.
- Create new courses and assign them to departments.
- Enroll or remove students from courses.
- View course details including enrolled student lists.

---

## 6. Subject Management

Navigate to **Subjects** in the sidebar.

- View all subjects with their codes and associated departments.
- Create, edit, and delete subjects.
- Assign subjects to specific departments/streams.

---

## 7. Exam Management

Navigate to **Exams** in the sidebar.

- Create new examinations with title, date, time, and subject.
- Edit or delete existing exams.
- View all scheduled exams across courses and subjects.

---

## 8. Result Management

Navigate to **Results** in the sidebar.

- Enter marks for individual students or use **bulk entry**.
- View all results across courses and subjects.
- Results include marks, percentage, and grade calculations.

---

## 9. Attendance Reports

Navigate to **Attendance Reports** in the sidebar. This page has **3 tabs**:

### 9.1 Session Reports

- Filter attendance records by **Course/Class**, **Subject**, **Start Date**, and **End Date**.
- View attendance rate for each session (percentage and count).
- Click the **eye icon (👁️)** to view the detailed student checklist for any session.
- Click the **trash icon (🗑️)** to delete an attendance session.
- Export attendance data as CSV.

### 9.2 Daily Roster View

- Select a **Course/Class**, **Subject**, and **Date**.
- See a full roster of all enrolled students with their attendance status (Present/Absent/Late/Excused).
- View the **verification method** used (QR scan or Manual).

### 9.3 Edit Requests

When teachers submit attendance edit requests:

1. View the request details: date, class, subject, student, proposed status change, and reason.
2. Click **✅ (Approve)** or **❌ (Reject)** to act on each request.
3. Approved requests automatically update the attendance record.

---

## 10. Timetable Management

Navigate to **Timetable** in the sidebar.

- Create and manage class timetables for all streams/departments.
- Define periods with subject, teacher, time slot, and day.
- View timetables in a weekly grid format.

---

## 11. Announcements

Navigate to **Announcements** in the sidebar.

- **Create** new announcements with title, content, and priority (Normal/High/Urgent).
- Target announcements to specific roles or all users.
- **Edit** or **delete** existing announcements.
- All users can see announcements in their dashboard.

---

## 12. Calendar Events

Navigate to **Calendar** in the sidebar.

- Add academic events (exams, holidays, meetings, etc.) to the shared calendar.
- Events are visible to all users.
- Use the calendar view to manage the academic schedule.

---

## 13. Library Management

Navigate to **Library** in the sidebar.

- Add books to the library catalog with details (title, author, ISBN, category, quantity).
- Track book availability and manage inventory.
- Search and filter the library collection.

---

## 14. Feedback Management

Navigate to **Feedback** in the sidebar.

- View all feedback submitted by students and teachers.
- Read feedback details and respond to submissions.
- Track feedback status and resolution.

---

## 15. Audit Logs

Navigate to **Audit Logs** in the sidebar.

### 15.1 Viewing Logs

The audit log table shows:
- **Timestamp** — When the action occurred
- **User** — Who performed the action
- **Action** — What was done (e.g., LOGIN, CREATE_USER, DELETE)
- **Resource** — Which resource was affected
- **Status** — Success or Failed
- **IP Address** — Origin IP

### 15.2 Searching & Exporting

- Search by username, action, or resource.
- Export logs as CSV (`college_audit_logs.csv`).

### 15.3 Clearing Logs

> [!WARNING]
> Clearing audit logs is **irreversible**. Only do this when logs are no longer needed.

1. Click **"Clear Audit Logs"** (top-right, red).
2. Confirm the action in the dialog.

---

## 16. Profile & Settings

### 16.1 Profile Page

Navigate to your profile by clicking your **avatar** in the sidebar (bottom) or going to **Profile**.

- View your account info, role, and avatar.
- **Upload/change** your profile picture by clicking on the avatar.
- **Edit Profile**: Click "Edit Profile" to update your name, phone, date of birth, and address.
- **Change Password**: Switch to the "Change Password" tab to update your login credentials.

### 16.2 Settings Page

Navigate to **Settings** (accessible from the top bar).

| Tab | Features |
|-----|----------|
| **Appearance & Theme** | Switch between Light Mode and Dark Mode |
| **Account Security** | Change your login password with current + new password |
| **Notification Rules** | Toggle notifications for announcements, exam schedules, results, office hours, and email digest |
| **Session & Meta Info** | View your User ID, email, role, account status, and join date |

---

> [!TIP]
> **Best Practices for Admins:**
> - Check the **Pending Approval** tab daily to approve new registrations promptly.
> - Set up **Departments** and **Courses** before the academic session starts.
> - Use **Bulk CSV Import** for mass student registration at the beginning of the year.
> - Review **Audit Logs** periodically for security monitoring.
> - Use **Bulk Delete** at the end of the academic year to clean up graduated students.
