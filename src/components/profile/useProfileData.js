/**
 * useProfileData.js
 * ───────────────────────────────────────────────────────────────────────────
 * Custom React hook that fetches the authenticated user's real profile from Supabase
 * and transforms it into a stable, presentation-ready view-model.
 *
 * Employs strict ZERO MOCK DATA policy. Uses empty states for missing values.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { ProfileModel } from '../../models/ProfileModel';
import { ROLE_DISPLAY_NAMES } from './profileConfig';

export function normalizeProfileData(realData, userRole, visitsCount = 0) {
  if (!realData) return null;
  
  const base = {
    id: realData.id,
    role: userRole,
    roleLabel: ROLE_DISPLAY_NAMES[userRole] || userRole,
    name: realData.name || '',
    email: realData.email || '',
    phone: realData.phone || '',
    avatar: realData.avatar || null,
    initials: (realData.name || 'U').trim().charAt(0).toUpperCase(),
    status: realData.status === 'ACTIVE' || realData.status === 'Hoạt động' ? 'Hoạt động' : (realData.status || ''),
    code: realData.id ? realData.id.split('-')[0].toUpperCase() : '',
    memberSince: realData.created_at ? new Date(realData.created_at).toLocaleDateString('vi-VN') : '',
  };

  if (realData.kind === 'staff') {
    return {
      ...base,
      kind: 'staff',
      employeeId: realData.id ? realData.id.split('-')[0].toUpperCase() : '',
      department: realData.department || '',
      specialization: realData.specialization || '',
      schedule: realData.schedule || '',
    };
  } else {
    const vitals = {
      bloodType: realData.blood_type || null,
      height: realData.height || null,
      weight: realData.weight || null,
      bloodPressure: realData.blood_pressure || null,
      allergies: realData.allergies || (realData.allergyNote ? realData.allergyNote.split(',')?.map?.(s => s.trim()) : null),
      familyHistory: realData.familyHistory || null,
    };

    let medicalHistory = [];
    if (realData.medicalHistory) {
      const conditions = Array.isArray(realData.medicalHistory)
        ? realData.medicalHistory
        : realData.medicalHistory.split(',')?.map?.(s => s.trim());
      
      medicalHistory = conditions?.filter(Boolean)?.map?.((condition) => {
        const match = /nặng|vảy nến|mãn/i.test(condition);
        return {
          condition,
          severity: match ? 'Nặng' : 'Đang theo dõi',
          tone: match ? 'rose' : 'sky',
          note: 'Ghi nhận trong hồ sơ bệnh án hệ thống.'
        };
      });
    }

    return {
      ...base,
      kind: 'patient',
      gender: realData.gender || '',
      dob: realData.dob || '',
      address: realData.address || '',
      medical: {
        vitals,
        medicalHistory,
        clinicalHistory: [],
        activeTreatments: [],
      },
      metrics: {
        visits: visitsCount
      }
    };
  }
}

export function useProfileData(authUser) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    if (!authUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Get the active user's UUID and Role from Supabase Auth session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      let userRole = user.user_metadata?.role || 'PATIENT';
      if (user.email?.toLowerCase().includes('admin')) {
        userRole = 'ADMIN';
      } else if (user.email?.toLowerCase().includes('doctor') || user.email?.toLowerCase().includes('bs') || user.email?.toLowerCase().includes('bacsi')) {
        userRole = 'DOCTOR';
      } else if (user.email?.toLowerCase().includes('reception') || user.email?.toLowerCase().includes('letan')) {
        userRole = 'RECEPTIONIST';
      } else if (user.email?.toLowerCase().includes('tech') || user.email?.toLowerCase().includes('ktv')) {
        userRole = 'TECHNICIAN';
      }
      
      // 2. Fetch the real profile using ProfileModel
      const realData = await ProfileModel.getProfile(user.id, userRole);

      // 3. Fetch real metrics from Supabase (e.g., patient appointments count)
      let visitsCount = 0;
      if (userRole === 'PATIENT') {
        const { count, error: countError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id);
        if (!countError && count !== null) {
          visitsCount = count;
        }
      }

      // 4. Transform raw database profile into UI view-model
      const transformed = normalizeProfileData(realData, userRole, visitsCount);

      setProfile(transformed);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authUser?.id]);

  return { profile, isLoading, error, setProfile, refresh: fetchProfile };
}
