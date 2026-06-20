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

export function normalizeProfileData(realData, userRole, metricsInput = null) {
  if (!realData) return null;
  
  let visitsCount = 0;
  let staffMetrics = null;
  if (typeof metricsInput === 'number') {
    visitsCount = metricsInput;
  } else if (metricsInput && typeof metricsInput === 'object') {
    visitsCount = metricsInput.visits || 0;
    staffMetrics = metricsInput;
  }
  
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
      metrics: staffMetrics || {},
    };
  } else {
    const vitals = {
      bloodType: realData.bloodType || null,
      height: realData.height || null,
      weight: realData.weight || null,
      allergies: realData.allergies || (realData.allergyNote ? realData.allergyNote.split(',')?.map?.(s => s.trim()) : null),
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

      const userRole = authUser?.role || 'PATIENT';
      
      // 2. Fetch the real profile using ProfileModel
      const realData = await ProfileModel.getProfile(user.id, userRole);

      // 3. Fetch real metrics from Supabase (e.g., patient or staff stats)
      let metricsData = {};
      if (userRole === 'PATIENT') {
        const { count, error: countError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id)
          .in('status', ['Đã khám', 'Reviewed', 'Đã thanh toán']);
        if (!countError && count !== null) {
          metricsData.visits = count;
        }
      } else if (userRole === 'DOCTOR') {
        // Ca khám thành công
        const { count: successCount, error: err1 } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', user.id)
          .in('status', ['Đã khám', 'Reviewed']);

        // Đánh giá trung bình
        const { data: feedbacks, error: err2 } = await supabase
          .from('feedbacks')
          .select('rating')
          .eq('doctor_id', user.id);
        
        let avgRating = 0;
        if (!err2 && feedbacks && feedbacks.length > 0) {
          const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
          avgRating = (sum / feedbacks.length).toFixed(1);
        }

        // Giờ làm việc thực tế (Confirmed shifts in the past or today)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const { data: shifts, error: err3 } = await supabase
          .from('doctor_shifts')
          .select('start_time, end_time')
          .eq('doctor_id', user.id)
          .eq('status', 'Đã xác nhận')
          .lte('work_date', todayStr);
        
        let workHours = 0;
        if (!err3 && shifts && shifts.length > 0) {
          const parseTimeToHours = (t) => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return h + (m || 0) / 60;
          };
          workHours = shifts.reduce((acc, s) => {
            const diff = parseTimeToHours(s.end_time) - parseTimeToHours(s.start_time);
            return acc + (diff > 0 ? diff : 0);
          }, 0);
        }

        metricsData = {
          successVisits: successCount || 0,
          avgRating: avgRating > 0 ? `${avgRating}/5` : 'Chưa có',
          workHours: workHours > 0 ? `${Math.round(workHours)} giờ` : '0 giờ',
        };
      } else if (userRole === 'TECHNICIAN') {
        // Thủ thuật hoàn tất & Giờ làm việc thực tế
        // Tính dựa trên các service_tickets đã hoàn thành (TECH_COMPLETED)
        const { data: completedTickets, error: errTech } = await supabase
          .from('service_tickets')
          .select('created_at, updated_at')
          .eq('technician_id', user.id)
          .eq('status', 'TECH_COMPLETED');

        let workHours = 0;
        let successCount = 0;

        if (!errTech && completedTickets) {
          successCount = completedTickets.length;
          
          workHours = completedTickets.reduce((acc, t) => {
            if (t.created_at && t.updated_at) {
              const start = new Date(t.created_at).getTime();
              const end = new Date(t.updated_at).getTime();
              const diffHours = (end - start) / (1000 * 60 * 60);
              return acc + (diffHours > 0 ? diffHours : 0);
            }
            return acc;
          }, 0);
        }

        // Round to 1 decimal place if needed, or Math.round
        const formattedHours = workHours > 0 
          ? `${workHours < 1 ? workHours.toFixed(1) : Math.round(workHours)} giờ` 
          : '0 giờ';

        metricsData = {
          successVisits: successCount,
          workHours: formattedHours,
        };
      }

      // 4. Transform raw database profile into UI view-model
      const transformed = normalizeProfileData(realData, userRole, metricsData);

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
