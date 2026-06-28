import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import StaffRouteView from './pages/StaffRouteView';
import Leaderboard from './pages/Leaderboard';
import Signup from './pages/Signup';

// Protected Route Middleware
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-primary font-bold animate-pulse">Authenticating Portal...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles to their default page
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/route" replace />;
    return <Navigate to="/citizen" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Citizen Protected Routes */}
          <Route 
            path="/citizen" 
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                <ReportIssue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Staff Protected Routes */}
          <Route 
            path="/staff/route" 
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffRouteView />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
