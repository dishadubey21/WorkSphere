import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Providers
import { UIProvider } from './context/UIContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';

// Layout
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Router Guards
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute.jsx';

// Error Pages
import { NotFound, ServerError, NetworkError, Forbidden, Unauthorized } from './pages/Errors.jsx';

// Lazy load Pages
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Employees = lazy(() => import('./pages/Employees.jsx'));
const Departments = lazy(() => import('./pages/Departments.jsx'));
const Teams = lazy(() => import('./pages/Teams.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const Kanban = lazy(() => import('./pages/Kanban.jsx'));
const Leaves = lazy(() => import('./pages/Leaves.jsx'));
const Announcements = lazy(() => import('./pages/Announcements.jsx'));
const Documents = lazy(() => import('./pages/Documents.jsx'));
const CalendarPage = lazy(() => import('./pages/Calendar.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

// Lazy load Authentication Pages
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));

// Global query client definition
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
});

// Suspense Fallback Loading Spinner
const PageLoadingSkeleton = () => (
  <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
    <div className="placeholder-shimmer rounded-circle p-2 mb-3" style={{ width: '64px', height: '64px' }}>
      <div className="spinner-border text-ws-primary" role="status" style={{ width: '32px', height: '32px', borderWidth: '3px' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
    <p className="font-heading fw-semibold text-muted fs-8">Loading WorkSphere...</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UIProvider>
          <SearchProvider>
            <Suspense fallback={<PageLoadingSkeleton />}>
              <Routes>
                {/* Guest Authentication Routes */}
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                </Route>
                
                {/* Protected Workspace Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Admin Only Routing */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/manage-users" element={<Navigate to="/employees" replace />} />
                      <Route path="/projects/create" element={<Navigate to="/projects" state={{ openCreate: true }} replace />} />
                      <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/departments" element={<Departments />} />
                      <Route path="/activity-logs" element={<ActivityLogs />} />
                    </Route>

                    {/* Manager Only Routing */}
                    <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                      <Route path="/tasks/create" element={<Navigate to="/tasks" state={{ openCreate: true }} replace />} />
                      <Route path="/tasks/edit" element={<Navigate to="/tasks" replace />} />
                      <Route path="/team" element={<Teams />} />
                    </Route>

                    {/* Team Lead / Manager / Admin Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Team Lead']} />}>
                      <Route path="/teams" element={<Teams />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/kanban" element={<Kanban />} />
                    </Route>

                    {/* Employee Only Routing */}
                    <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
                      <Route path="/my-tasks" element={<Tasks />} />
                      <Route path="/my-projects" element={<Projects />} />
                      <Route path="/apply-leave" element={<Navigate to="/leaves" state={{ openApply: true }} replace />} />
                      <Route path="/profile" element={<Settings />} />
                    </Route>

                    {/* Shared Routes */}
                    <Route path="/leaves" element={<Leaves />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                
                {/* Standalone Error Routes */}
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/error-500" element={<ServerError />} />
                <Route path="/error-network" element={<NetworkError />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SearchProvider>
        </UIProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
