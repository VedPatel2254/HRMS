import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import NewEmployeePage from './pages/employees/NewEmployeePage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import TeamAttendancePage from './pages/attendance/TeamAttendancePage';
import LeavePage from './pages/leave/LeavePage';
import TeamLeavePage from './pages/leave/TeamLeavePage';
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollManagePage from './pages/payroll/PayrollManagePage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import TasksPage from './pages/tasks/TasksPage';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import CreateJobPostingPage from './pages/recruitment/CreateJobPostingPage';
import JobDetailPage from './pages/recruitment/JobDetailPage';
import ApplicantDetailPage from './pages/recruitment/ApplicantDetailPage';
import PerformancePage from './pages/performance/PerformancePage';
import AssetsPage from './pages/assets/AssetsPage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import HelpdeskPage from './pages/helpdesk/HelpdeskPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import PermissionsPage from './pages/settings/PermissionsPage';
import ProfilePage from './pages/profile/ProfilePage';
import CalendarPage from './pages/calendar/CalendarPage';
import PerformanceManagePage from './pages/performance/PerformanceManagePage';
import {
  ShieldAlert,
} from 'lucide-react';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
    <div className="text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Access Denied
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        You don't have permission to access this page.
      </p>
      <a
        href="/dashboard"
        className="text-accent hover:text-accent-600 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <NewEmployeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <EmployeeDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route
              path="/attendance/team"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <TeamAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route path="/leave" element={<LeavePage />} />
            <Route
              path="/leave/team"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <TeamLeavePage />
                </ProtectedRoute>
              }
            />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route
              path="/payroll/manage"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <PayrollManagePage />
                </ProtectedRoute>
              }
            />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route
              path="/clients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <ClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <ClientDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <RecruitmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <CreateJobPostingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <JobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruitment/applicants/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <ApplicantDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/performance" element={<PerformancePage />} />
            <Route
              path="/performance/manage"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <PerformanceManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <AssetsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/helpdesk" element={<HelpdeskPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/roles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PermissionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
};

export default App;
