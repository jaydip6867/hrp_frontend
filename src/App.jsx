import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Global Components
import AppLayout from './components/layout/AppLayout';

// Public Auth Pages
import AdminLogin from './pages/AdminLogin';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeRegister from './pages/EmployeeRegister';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Schedules from './pages/Schedules';
import Tasks from './pages/Tasks';
import WorkUpdates from './pages/WorkUpdates';
import Leaves from './pages/Leaves';
import WorkCount from './pages/WorkCount';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import AuditLogs from './pages/AuditLogs';
import CompanySettings from './pages/CompanySettings';

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeProfile from './pages/EmployeeProfile';

// Protected Route Guard
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F7FB' }}>
        <div style={{ color: '#2563EB', fontWeight: 600 }}>Authenticating session...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to={requiredRole === 'Admin' ? "/admin/login" : "/employee/login"} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'Admin' ? "/admin/dashboard" : "/employee/dashboard"} replace />;
  }

  return children;
};

// Root Redirector based on Auth State
const RootRedirect = () => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/employee/login" replace />;
  return <Navigate to={user.role === 'Admin' ? "/admin/dashboard" : "/employee/dashboard"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC AUTH ROUTES */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/employee/login" element={<EmployeeLogin />} />
            <Route path="/employee/register" element={<EmployeeRegister />} />
            <Route path="/login" element={<Navigate to="/employee/login" replace />} />
            <Route path="/register" element={<Navigate to="/employee/register" replace />} />

            {/* ROOT REDIRECT */}
            <Route path="/" element={<RootRedirect />} />

            {/* ADMIN WORKSTATION (Strictly role="Admin") */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="Admin">
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="departments" element={<Departments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="work-updates" element={<WorkUpdates />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="work-count" element={<WorkCount />} />
              <Route path="reports" element={<Reports />} />
              <Route path="meetings" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="documents" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="salary" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="settings" element={<CompanySettings />} />
            </Route>

            {/* EMPLOYEE WORKSTATION (Strictly role="Employee") */}
            <Route path="/employee" element={
              <ProtectedRoute requiredRole="Employee">
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="work-updates" element={<WorkUpdates />} />
              <Route path="leaves" element={<Leaves />} />
              <Route path="work-count" element={<WorkCount />} />
              <Route path="reports" element={<Reports />} />
              <Route path="documents" element={<Documents />} />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
