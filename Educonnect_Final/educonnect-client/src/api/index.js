import api from './axiosInstance';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  getUser: (id) => api.get(`/users/${id}`),
  listUsers: (params) => api.get('/users', { params }),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  uploadAvatar: (id, formData) => api.patch(`/users/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  approveUser: (id) => api.patch(`/users/${id}/approve`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  bulkImport: (formData) => api.post('/users/bulk-import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  bulkDelete: (data) => api.post('/users/bulk-delete', data),
};

export const departmentApi = {
  list: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  assignHoD: (id, hodId) => api.patch(`/departments/${id}/hod`, { hodId }),
};

export const courseApi = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enrollStudents: (id, studentIds) => api.post(`/courses/${id}/enroll`, { studentIds }),
  removeStudent: (id, studentId) => api.delete(`/courses/${id}/enroll/${studentId}`),
  getStudents: (id) => api.get(`/courses/${id}/students`),
};

export const subjectApi = {
  list: (params) => api.get('/subjects', { params }),
  get: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const materialApi = {
  list: (params) => api.get('/materials', { params }),
  get: (id) => api.get(`/materials/${id}`),
  create: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  download: (id) => api.get(`/materials/${id}/download`, { responseType: 'blob' }),
  listQuestionPapers: (params) => api.get('/materials/question-papers', { params }),
};

export const attendanceApi = {
  list: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  generateQR: (data) => api.post('/attendance/qr/generate', data),
  scanQR: (token) => api.post('/attendance/qr/scan', { token }),
  getBySubject: (subjectId, params) => api.get(`/attendance/subject/${subjectId}`, { params }),
  getStudent: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getSummary: (studentId) => api.get(`/attendance/student/${studentId}/summary`),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getReports: (params) => api.get('/attendance/reports', { params }),
  delete: (id) => api.delete(`/attendance/${id}`),
  listEditRequests: (params) => api.get('/attendance/edit-requests', { params }),
  createEditRequest: (data) => api.post('/attendance/edit-requests', data),
  actionEditRequest: (id, action) => api.patch(`/attendance/edit-requests/${id}/action`, { action }),
};

export const examApi = {
  list: (params) => api.get('/exams', { params }),
  get: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  // Timetable view: filter exams by date/course rather than a non-existent /exams/timetable endpoint
  getTimetable: (params) => api.get('/exams', { params }),
};

export const resultApi = {
  enter: (results) => api.post('/results', { results }),
  getByExam: (examId) => api.get(`/results/exam/${examId}`),
  getByStudent: (studentId) => api.get(`/results/student/${studentId}`),
  getPerformance: (studentId) => api.get(`/results/student/${studentId}/performance`),
  update: (id, data) => api.patch(`/results/${id}`, data),
  publish: (examId) => api.patch(`/results/exam/${examId}/publish`),
  getProgressReport: (studentId) => api.get(`/results/reports/progress/${studentId}`, { responseType: 'blob' }),
};

export const timetableApi = {
  list: (params) => api.get('/timetables', { params }),
  get: (id) => api.get(`/timetables/${id}`),
  create: (data) => api.post('/timetables', data),
  update: (id, data) => api.put(`/timetables/${id}`, data),
  delete: (id) => api.delete(`/timetables/${id}`),
  getTeacherSchedule: (teacherId) => api.get(`/timetables/teacher/${teacherId}`),
  validate: (data) => api.post('/timetables/validate', data),
};

export const announcementApi = {
  list: (params) => api.get('/announcements', { params }),
  get: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const lessonPlanApi = {
  list: (params) => api.get('/lesson-plans', { params }),
  get: (id) => api.get(`/lesson-plans/${id}`),
  create: (data) => api.post('/lesson-plans', data),
  update: (id, data) => api.put(`/lesson-plans/${id}`, data),
  delete: (id) => api.delete(`/lesson-plans/${id}`),
};

export const feedbackApi = {
  submit: (data) => api.post('/feedback', data),
  list: (params) => api.get('/feedback', { params }),
  getSummary: (params) => api.get('/feedback/summary', { params }),
  getDepartment: (deptId) => api.get(`/feedback/department/${deptId}`),
};

export const libraryApi = {
  listBooks: (params) => api.get('/library/books', { params }),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  issueBook: (data) => api.post('/library/issue', data),
  returnBook: (transactionId) => api.post(`/library/return/${transactionId}`),
  listTransactions: (params) => api.get('/library/transactions', { params }),
  getMyBooks: () => api.get('/library/my-books'),
};

export const calendarApi = {
  list: (params) => api.get('/calendar', { params }),
  create: (data) => api.post('/calendar', data),
  update: (id, data) => api.put(`/calendar/${id}`, data),
  delete: (id) => api.delete(`/calendar/${id}`),
};

export const officeHourApi = {
  list: (params) => api.get('/office-hours', { params }),
  create: (data) => api.post('/office-hours', data),
  update: (id, data) => api.put(`/office-hours/${id}`, data),
  delete: (id) => api.delete(`/office-hours/${id}`),
  book: (id) => api.post(`/office-hours/${id}/book`),
  cancel: (id, bookingIndex) => api.patch(`/office-hours/${id}/cancel/${bookingIndex}`),
};

export const dashboardApi = {
  student: () => api.get('/dashboard/student'),
  teacher: () => api.get('/dashboard/teacher'),
  admin: () => api.get('/dashboard/admin'),
};

export const aiApi = {
  generateSummary: (text, format) => api.post('/ai/lecture-summary', { text, format }),
  generateSummaryFromFile: (formData) => api.post('/ai/lecture-summary/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const auditLogApi = {
  list: (params) => api.get('/audit-logs', { params }),
  // Individual audit log retrieval (admin use only)
  get: (id) => api.get(`/audit-logs/${id}`),
  deleteAll: () => api.delete('/audit-logs'),
};
