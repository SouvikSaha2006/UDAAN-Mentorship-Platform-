import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import AccessibilityToolbar from './components/accessibility/AccessibilityToolbar';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { getRoleDashboardPath } from './utils/helpers';

// Public & Auth Pages
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import NotFoundPage from './pages/public/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Shared Dashboard Pages
import MessagesPage from './pages/shared/MessagesPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import AccessibilitySettingsPage from './pages/student/AccessibilitySettingsPage';
import AssistiveLearningHubPage from './pages/student/AssistiveLearningHubPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import FindMentorPage from './pages/student/FindMentorPage';
import MentorProfilePage from './pages/student/MentorProfilePage';
import MentorMatchingPage from './pages/student/MentorMatchingPage';
import MyMentorshipPage from './pages/student/MyMentorshipPage';
import MentorshipSessionsPage from './pages/student/MentorshipSessionsPage';
import LearningPlansPage from './pages/student/LearningPlansPage';
import AcademicDashboardPage from './pages/student/AcademicDashboardPage';
import TimetablePage from './pages/student/TimetablePage';
import AttendancePage from './pages/student/AttendancePage';
import AssignmentsPage from './pages/student/AssignmentsPage';
import ExaminationsPage from './pages/student/ExaminationsPage';
import StudyMaterialsPage from './pages/student/StudyMaterialsPage';
import SupportRequestsPage from './pages/student/SupportRequestsPage';
import CareerDevelopmentPage from './pages/student/CareerDevelopmentPage';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorStudentsPage from './pages/mentor/MentorStudentsPage';
import MentorshipRequestsPage from './pages/mentor/MentorshipRequestsPage';
import MentorSessionsPage from './pages/mentor/MentorSessionsPage';
import MentorProgressPage from './pages/mentor/MentorProgressPage';
import MentorLearningPlansPage from './pages/mentor/MentorLearningPlansPage';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyCoursesPage from './pages/faculty/FacultyCoursesPage';
import FacultyMaterialsPage from './pages/faculty/FacultyMaterialsPage';
import FacultyExamsPage from './pages/faculty/FacultyExamsPage';

// Support Coordinator Pages
import SupportCoordinatorDashboard from './pages/support/SupportCoordinatorDashboard';
import SupportRequestManagementPage from './pages/support/SupportRequestManagementPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import MentorManagementPage from './pages/admin/MentorManagementPage';
import FacultyManagementPage from './pages/admin/FacultyManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import AnalyticsReportsPage from './pages/admin/AnalyticsReportsPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';

function RequireRole({ role, children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to={`/login?role=${role}`} replace />;
  }
  if (currentUser.role !== role) {
    return <Navigate to={getRoleDashboardPath(currentUser.role)} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <AppDataProvider>
              <Routes>
                {/* Public & Auth Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                {/* Student Routes */}
                <Route
                  path="/student"
                  element={
                    <RequireRole role="student">
                      <DashboardLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="profile" element={<StudentProfilePage />} />
                  <Route path="mentors" element={<FindMentorPage />} />
                  <Route path="mentors/:id" element={<MentorProfilePage />} />
                  <Route path="matching" element={<MentorMatchingPage />} />
                  <Route path="mentorship" element={<MyMentorshipPage />} />
                  <Route path="sessions" element={<MentorshipSessionsPage />} />
                  <Route path="learning-plan" element={<LearningPlansPage />} />
                  <Route path="academics" element={<AcademicDashboardPage />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="assignments" element={<AssignmentsPage />} />
                  <Route path="examinations" element={<ExaminationsPage />} />
                  <Route path="materials" element={<StudyMaterialsPage />} />
                  <Route path="assistive-hub" element={<AssistiveLearningHubPage />} />
                  <Route path="accessibility" element={<AccessibilitySettingsPage />} />
                  <Route path="support" element={<SupportRequestsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="career" element={<CareerDevelopmentPage />} />
                </Route>

                {/* Mentor Routes */}
                <Route
                  path="/mentor"
                  element={
                    <RequireRole role="mentor">
                      <DashboardLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<MentorDashboard />} />
                  <Route path="students" element={<MentorStudentsPage />} />
                  <Route path="requests" element={<MentorshipRequestsPage />} />
                  <Route path="sessions" element={<MentorSessionsPage />} />
                  <Route path="progress" element={<MentorProgressPage />} />
                  <Route path="learning-plans" element={<MentorLearningPlansPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="assistive-hub" element={<AssistiveLearningHubPage />} />
                  <Route path="accessibility" element={<AccessibilitySettingsPage />} />
                </Route>

                {/* Faculty Routes */}
                <Route
                  path="/faculty"
                  element={
                    <RequireRole role="faculty">
                      <DashboardLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<FacultyDashboard />} />
                  <Route path="courses" element={<FacultyCoursesPage />} />
                  <Route path="materials" element={<FacultyMaterialsPage />} />
                  <Route path="examinations" element={<FacultyExamsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="accessibility" element={<AccessibilitySettingsPage />} />
                </Route>

                {/* Support Coordinator Routes */}
                <Route
                  path="/support"
                  element={
                    <RequireRole role="support">
                      <DashboardLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SupportCoordinatorDashboard />} />
                  <Route path="requests" element={<SupportRequestManagementPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="accessibility" element={<AccessibilitySettingsPage />} />
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <RequireRole role="admin">
                      <DashboardLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="students" element={<StudentManagementPage />} />
                  <Route path="mentors" element={<MentorManagementPage />} />
                  <Route path="faculty" element={<FacultyManagementPage />} />
                  <Route path="departments" element={<DepartmentManagementPage />} />
                  <Route path="reports" element={<AnalyticsReportsPage />} />
                  <Route path="settings" element={<PlatformSettingsPage />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="accessibility" element={<AccessibilitySettingsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <AccessibilityToolbar />
            </AppDataProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
