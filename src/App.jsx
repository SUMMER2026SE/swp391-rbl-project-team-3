import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import LandingPage from './LandingPage';
import DoctorProfilePage from './DoctorProfilePage';
import ResetPasswordPage from './ResetPasswordPage';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
          element={!session ? <LoginPage /> : <Navigate to="/" replace />} 
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
