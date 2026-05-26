import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import LandingPage from './views/LandingPage';
import DoctorProfilePage from './views/DoctorProfilePage';
import ResetPasswordPage from './views/ResetPasswordPage';
import { AuthModel } from './models/AuthModel';
import './index.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    AuthModel.getSession().then((session) => {
      setSession(session);
    }).catch(console.error);

    const subscription = AuthModel.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthModel.signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Convert supabase user to our local format just for UI compatibility
  const user = session?.user ? { 
      username: session.user.user_metadata?.full_name || session.user.email,
      avatar: session.user.user_metadata?.avatar_url
  } : null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage user={user} onLogout={handleLogout} />} 
        />
        
        <Route 
          path="/login" 
          element={(!session || sessionStorage.getItem('isResettingPassword') === 'true') ? <LoginPage /> : <Navigate to="/" replace />} 
        />

        <Route 
          path="/doctor/:id" 
          element={<DoctorProfilePage />} 
        />

        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
