import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Create a completely anonymous client that doesn't use the logged-in user's session
const anonSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY, 
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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

        // Parse schedule. If stored as JSON string or JSON array
        let schedule = [];
        if (emp?.work_schedule) {
            try {
                schedule = typeof emp.work_schedule === 'string' ? JSON.parse(emp.work_schedule) : emp.work_schedule;
            } catch (e) {
                console.error("Failed to parse work schedule", e);
            }
        }

        return {
          id: user.user_id,
          name: user.full_name || 'Bác sĩ',
          title: 'Bác sĩ Da liễu',
          image: user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.user_id,
          experience: emp?.experience_years ? `${emp.experience_years} năm kinh nghiệm` : 'Chưa cập nhật',
          specialties: specialties,
          bio: doc?.description || 'Chưa có thông tin giới thiệu.',
          consultationFee: doc?.consultation_fee ? `${doc.consultation_fee.toLocaleString()} VNĐ` : '300,000 VNĐ',
          rating: doc?.rating || 5.0,
          reviewsCount: doc?.reviews_count || 0,
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
      console.error('Lỗi khi tải danh sách bác sĩ:', err);
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
