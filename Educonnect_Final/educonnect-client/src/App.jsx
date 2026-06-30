import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { useAppPermissions } from './hooks/useAppPermissions';

// Lazy-loaded common/auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/common/UnauthorizedPage'));
const ComingSoonPage = lazy(() => import('./pages/common/ComingSoonPage'));
const SettingsPage = lazy(() => import('./pages/common/SettingsPage'));
const AnnouncementPage = lazy(() => import('./pages/common/AnnouncementPage'));
const CalendarPage = lazy(() => import('./pages/common/CalendarPage'));
const TimetablePage = lazy(() => import('./pages/common/TimetablePage'));
const LibraryPage = lazy(() => import('./pages/common/LibraryPage'));
const FeedbackPage = lazy(() => import('./pages/common/FeedbackPage'));
const OfficeHoursPage = lazy(() => import('./pages/common/OfficeHoursPage'));

// Lazy-loaded Admin pages
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const DepartmentPage = lazy(() => import('./pages/admin/DepartmentPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const AttendanceReportsPage = lazy(() => import('./pages/admin/AttendanceReportsPage'));

// Lazy-loaded Teacher pages
const SubjectListPage = lazy(() => import('./pages/teacher/SubjectListPage'));
const AttendanceMarkerPage = lazy(() => import('./pages/teacher/AttendanceMarkerPage'));
const ExamManagerPage = lazy(() => import('./pages/teacher/ExamManagerPage'));
const ResultEntryPage = lazy(() => import('./pages/teacher/ResultEntryPage'));
const LessonPlannerPage = lazy(() => import('./pages/teacher/LessonPlannerPage'));
const AISummaryPage = lazy(() => import('./pages/teacher/AISummaryPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/teacher/TeacherAssignmentsPage'));

// Lazy-loaded Student pages
const CourseDetailsPage = lazy(() => import('./pages/student/CourseDetailsPage'));
const StudyMaterialsPage = lazy(() => import('./pages/student/StudyMaterialsPage'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage'));
const StudentResultsPage = lazy(() => import('./pages/student/StudentResultsPage'));
const StudentExamsPage = lazy(() => import('./pages/student/StudentExamsPage'));
const StudentAssignmentsPage = lazy(() => import('./pages/student/StudentAssignmentsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

// Dynamic role-based router for Attendance page
function AttendanceRoute() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentAttendancePage />;
  }
  if (user?.role === 'admin') {
    return <AttendanceReportsPage />;
  }
  return <AttendanceMarkerPage />;
}

// Dynamic role-based router for Results page
function ResultsRoute() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentResultsPage />;
  }
  return <ResultEntryPage />;
}

// Dynamic role-based router for Exams page
function ExamsRoute() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentExamsPage />;
  }
  return <ExamManagerPage />;
}

// Dynamic role-based router for Assignments page
function AssignmentsRoute() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <StudentAssignmentsPage />;
  }
  return <TeacherAssignmentsPage />;
}

// Feature page wrapper for remaining stubs
function FeaturePage({ title, subtitle }) {
  return <ComingSoonPage title={title} subtitle={subtitle} />;
}

const RouterComponent = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

/**
 * AppBootstrap — fires once on mount (native only) to request POST_NOTIFICATIONS
 * permission on Android 13+ (API 33+). Principle of Least Privilege: this is the
 * earliest meaningful moment to ask, before the user navigates to any screen.
 * On web and older Android, requestNotificationPermission() returns true immediately.
 */
function AppBootstrap() {
  const { requestNotificationPermission, isNative } = useAppPermissions();

  useEffect(() => {
    if (isNative) {
      // Slight delay so the app finishes rendering before the OS dialog appears
      const timer = setTimeout(() => {
        requestNotificationPermission();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNative, requestNotificationPermission]);

  return null; // renders nothing — pure side-effect component
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <RouterComponent>
              {/* Request POST_NOTIFICATIONS (API 33+) once on first app load */}
              <AppBootstrap />
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected routes */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/announcements" element={<AnnouncementPage />} />

                    {/* Unified/Common routes */}
                    <Route path="/courses" element={<CourseDetailsPage />} />
                    <Route path="/subjects" element={<SubjectListPage />} />
                    <Route path="/materials" element={<StudyMaterialsPage />} />
                    <Route path="/question-papers" element={<StudyMaterialsPage />} />
                    <Route path="/attendance" element={<AttendanceRoute />} />
                    <Route path="/results" element={<ResultsRoute />} />
                    <Route path="/exams" element={<ExamsRoute />} />
                    <Route path="/assignments" element={<AssignmentsRoute />} />

                    {/* Teacher specific routes */}
                    <Route path="/lesson-plans" element={<ProtectedRoute roles={['teacher', 'admin']}><LessonPlannerPage /></ProtectedRoute>} />
                    <Route path="/ai-summary" element={<ProtectedRoute roles={['teacher', 'admin']}><AISummaryPage /></ProtectedRoute>} />

                    {/* Admin specific routes */}
                    <Route path="/users" element={<ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>} />
                    <Route path="/departments" element={<ProtectedRoute roles={['admin']}><DepartmentPage /></ProtectedRoute>} />
                    <Route path="/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogsPage /></ProtectedRoute>} />

                    <Route path="/timetable" element={<TimetablePage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/office-hours" element={<OfficeHoursPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                  </Route>

                  {/* Redirects */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </RouterComponent>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
