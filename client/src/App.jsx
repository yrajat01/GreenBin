import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';
import { FullPageLoader } from './components/common/LoadingSpinner';
import { ROLES, ROLE_PATHS } from './constants/roles';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import StaffRouteView from './pages/StaffRouteView';
import Leaderboard from './pages/Leaderboard';
import Signup from './pages/Signup';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader text="Authenticating Session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetPath = ROLE_PATHS[user.role] || '/citizen';
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Citizen Protected Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN, ROLES.ADMIN]}>
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN, ROLES.ADMIN, ROLES.STAFF]}>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Staff Protected Routes */}
              <Route
                path="/staff/route"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.STAFF]}>
                    <StaffRouteView />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Analytics />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
