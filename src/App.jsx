// Dermatology Clinic Management System - Client Application Entry
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
import ProfilePage from './views/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import LiquidGlassFilter from './components/common/LiquidGlassFilter';
import MedicalLoader from './components/common/MedicalLoader';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

function AppContent() {
  const { user, loading, logout, getDashboardPath } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#9ea5b0]">
        <MedicalLoader />
      </div>
    );
  }

  const landingPageUser = user ? { 
    username: user.name,
    avatar: user.avatar 
  } : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            user && user.role !== 'PATIENT'
              ? <Navigate to={getDashboardPath(user.role)} replace />
              : <LandingPage user={landingPageUser} onLogout={handleLogout} />
          } 
        />
        
        <Route
          path="/login"
          element={
            // Draft & Sync: stay on the registration form when the magic link
            // returns (?mode=register) even though a session now exists, so the
            // user can finish filling the form instead of being bounced away.
            (!user || new URLSearchParams(window.location.search).get('mode') === 'register')
              ? <LoginPage />
              : <Navigate to={getDashboardPath(user.role)} replace />
          }
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
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function GlobalToast() {
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    const handleShowToast = (e) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-emerald-50 text-emerald-700 px-5 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 border border-emerald-200"
        >
          <div className="bg-emerald-100 rounded-full p-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Thành công</h4>
            <p className="text-xs font-semibold opacity-90">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-transparent relative">
        {/* Trigger Tailwind JIT */}
        {/* App-wide SVG refraction filters for the liquid-glass system */}
        <LiquidGlassFilter />
        <AppContent />
        <GlobalToast />
      </div>
    </AuthProvider>
  );
}

export default App;
