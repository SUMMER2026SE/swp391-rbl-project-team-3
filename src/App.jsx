import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import LandingPage from './views/LandingPage';
import DoctorProfilePage from './views/DoctorProfilePage';
import ResetPasswordPage from './views/ResetPasswordPage';
import AdminDashboard from './views/AdminDashboard';
import DoctorDashboard from './views/DoctorDashboard';
import ReceptionistDashboard from './views/ReceptionistDashboard';
import TechnicianDashboard from './views/TechnicianDashboard';
import UserProfilePage from './views/UserProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import LiquidGlassFilter from './components/common/LiquidGlassFilter';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function AppContent() {
  const { user, logout, getDashboardPath } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const landingPageUser = user ? { 
    username: user.name,
    avatar: user.avatar 
  } : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage user={landingPageUser} onLogout={handleLogout} />} 
        />
        
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to={getDashboardPath(user.role)} replace />} 
        />

        <Route 
          path="/login-supabase" 
          element={!user ? <LoginPage /> : <Navigate to={getDashboardPath(user.role)} replace />} 
        />

        <Route 
          path="/doctor/:id" 
          element={<DoctorProfilePage />} 
        />

        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard/doctor" 
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard/receptionist" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard/technician" 
          element={
            <ProtectedRoute allowedRoles={['TECHNICIAN']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'TECHNICIAN', 'PATIENT']}>
              <UserProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/80 via-emerald-50/90 to-teal-100/80 bg-fixed">
        {/* Trigger Tailwind JIT */}
        {/* App-wide SVG refraction filters for the liquid-glass system */}
        <LiquidGlassFilter />
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
