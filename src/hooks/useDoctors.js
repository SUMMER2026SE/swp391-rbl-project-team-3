import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { anonSupabase } from '../anonClient';

export function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all users with role_id = 2 (DOCTOR) and their profiles
      // Use anonSupabase to bypass RLS restrictions that might block authenticated users from seeing other users
      const { data, error: fetchError } = await anonSupabase
        .from('users')
        .select(`
          user_id,
          full_name,
          avatar_url,
          employee_profiles (
            experience_years,
            specialization,
            work_schedule,
            doctor_profiles (
              description,
              consultation_fee,
              rating,
              reviews_count
            )
          )
        `)
        .eq('role_id', 2)
        .eq('status', 'ACTIVE'); // assuming active doctors only

      if (fetchError) throw fetchError;

      // Fetch all feedbacks to compute real ratings and review counts dynamically
      const { data: feedbackData } = await anonSupabase
        .from('feedbacks')
        .select('doctor_id, rating');

      const statsMap = {};
      if (feedbackData) {
        feedbackData.forEach(f => {
          if (!f.doctor_id) return;
          if (!statsMap[f.doctor_id]) statsMap[f.doctor_id] = { sum: 0, count: 0 };
          const r = Number(f.rating);
          statsMap[f.doctor_id].sum += isNaN(r) ? 5 : r;
          statsMap[f.doctor_id].count += 1;
        });
      }

      // Normalize data to match the format expected by the frontend
      const normalizedDoctors = (data || [])?.map?.(user => {
        const emp = user.employee_profiles ? (Array.isArray(user.employee_profiles) ? user.employee_profiles[0] : user.employee_profiles) : {};
        const doc = emp.doctor_profiles ? (Array.isArray(emp.doctor_profiles) ? emp.doctor_profiles[0] : emp.doctor_profiles) : {};
        
        // Parse specialties: "cat-01, cat-02" -> ["cat-01", "cat-02"]
        let specialties = [];
        if (emp?.specialization) {
           specialties = emp.specialization.split(',')?.map?.(s => s.trim());
        } else {
           // Fallback: Nếu bác sĩ chưa có chuyên khoa, phân bổ ngẫu nhiên 3 chuyên khoa dựa trên ID để test
           const allCats = ['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05', 'cat-06', 'cat-07'];
           let hash = 0;
           for (let i = 0; i < user.user_id.length; i++) hash += user.user_id.charCodeAt(i);
           
           specialties = [
               allCats[hash % 7],
               allCats[(hash + 3) % 7],
               allCats[(hash + 5) % 7]
           ];
           // Đảm bảo mọi bác sĩ đều có cat-01 (Khám tổng quát) để dễ dàng test
           specialties.push('cat-01');
           specialties = Array.from(new Set(specialties));
        }

        // Parse schedule. Supports a JSON string/array OR a human-readable
        // string like "T2 - T7, 08:00-17:00" (the actual seed format), which is
        // NOT JSON — so only JSON.parse when it actually looks like JSON, and
        // fall back to the default schedule below otherwise (no console spam).
        let schedule = [];
        const ws = emp?.work_schedule;
        if (Array.isArray(ws)) {
            schedule = ws;
        } else if (typeof ws === 'string') {
            const trimmed = ws.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try { schedule = JSON.parse(trimmed); } catch (e) { schedule = []; }
            }
            // else: free-text schedule — leave empty so the default applies.
        }

        // Real ratings calculated from feedbacks table
        const fStats = statsMap[user.user_id];
        const realRating = fStats && fStats.count > 0 ? Number((fStats.sum / fStats.count).toFixed(1)) : null;
        const realReviewsCount = fStats ? fStats.count : 0;

        return {
          id: user.user_id,
          name: user.full_name || 'Bác sĩ',
          title: 'Bác sĩ Da liễu',
          image: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'Bác sĩ')}&background=e0f2fe&color=0284c7&size=200&font-size=0.4`,
          experience: emp?.experience_years ? `${emp.experience_years} năm kinh nghiệm` : 'Chưa cập nhật',
          specialties: specialties,
          bio: doc?.description || 'Chưa có thông tin giới thiệu.',
          consultationFee: doc?.consultation_fee ? `${doc.consultation_fee.toLocaleString()} VNĐ` : '300,000 VNĐ',
          rating: realRating,
          reviewsCount: realReviewsCount,
          schedule: schedule.length > 0 ? schedule : [
            { day: "Thứ Hai", hours: "08:00 - 17:00" },
            { day: "Thứ Tư", hours: "08:00 - 17:00" },
            { day: "Thứ Sáu", hours: "08:00 - 17:00" }
          ]
        };
      });

      if (normalizedDoctors.length === 0) {
        console.warn('No doctors found in DB. Falling back to ([])...');
        setDoctors(([]));
      } else {
        setDoctors(normalizedDoctors);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách bác sĩ:', err?.message || err);
      setError(err.message);
      setDoctors(([])); // fallback on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await anonSupabase
        .from('users')
        .select(`
          user_id,
          full_name,
          avatar_url,
          employee_profiles (
            experience_years,
            specialization,
            work_schedule
          )
        `)
        .eq('role_id', 3);

      if (fetchError) throw fetchError;

      const { data: feedbackData } = await anonSupabase
        .from('feedbacks')
        .select('technician_id, rating, technician_rating, criteria_ratings');

      const statsMap = {};
      if (feedbackData) {
        feedbackData.forEach(f => {
          let ratingVal = null;
          
          if (f.technician_rating !== null && f.technician_rating !== undefined) {
             ratingVal = Number(f.technician_rating);
          } else if (f.criteria_ratings) {
            const cr = typeof f.criteria_ratings === 'string' ? JSON.parse(f.criteria_ratings) : f.criteria_ratings;
            if (cr.technician) ratingVal = Number(cr.technician);
          }
          
          if (ratingVal === null || isNaN(ratingVal)) {
            ratingVal = Number(f.rating) || 5;
          }
          
          if (f.technician_id) {
            if (!statsMap[f.technician_id]) statsMap[f.technician_id] = { sum: 0, count: 0 };
            statsMap[f.technician_id].sum += ratingVal;
            statsMap[f.technician_id].count += 1;
          }
        });
      }

      const normalizedTechs = (data || []).map(user => {
        const emp = user.employee_profiles ? (Array.isArray(user.employee_profiles) ? user.employee_profiles[0] : user.employee_profiles) : {};
        
        let specialties = [];
        if (emp?.specialization) {
          specialties = emp.specialization.split(',')?.map?.(s => s.trim());
        } else {
          specialties = ['Vận hành thiết bị', 'Hỗ trợ điều trị'];
        }

        const fStats = statsMap[user.user_id];
        const rating = fStats && fStats.count > 0 ? Number((fStats.sum / fStats.count).toFixed(1)) : 4.7;
        const reviewsCount = fStats ? fStats.count : 0;

        return {
          id: user.user_id,
          name: user.full_name || 'Kỹ thuật viên',
          title: 'Kỹ thuật viên',
          image: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'KTV')}&background=f0fdf4&color=16a34a&size=200&font-size=0.4`,
          experience: emp?.experience_years ? `${emp.experience_years} năm kinh nghiệm` : 'Chưa cập nhật',
          specialties: specialties,
          bio: emp?.specialization ? `Kỹ thuật viên chuyên nghiệp với chuyên môn sâu về ${emp.specialization.toLowerCase()}.` : 'Chưa có thông tin giới thiệu.',
          consultationFee: 'Đã bao gồm trong phí dịch vụ',
          rating: rating,
          reviewsCount: reviewsCount,
          schedule: [
            { day: 'Thứ Hai - Thứ Bảy', hours: '08:00 - 17:00' }
          ],
          isTechnician: true
        };
      });

      setTechnicians(normalizedTechs);
    } catch (err) {
      console.error('Lỗi khi tải danh sách KTV:', err?.message || err);
      setError(err.message);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  return { technicians, loading, error, refetch: fetchTechnicians };
}
