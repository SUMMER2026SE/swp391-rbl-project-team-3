import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// StaffModel — the data layer for the Admin "Quản lý Nhân sự" screen.
//
// Staff live in the shared `users` table, distinguished from patients by
// `role_id` (1 ADMIN · 2 DOCTOR · 3 TECHNICIAN · 4 RECEPTIONIST · 5 PATIENT).
// This mirrors AuthContext.ROLE_BY_ID — keep them in sync.
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_EN_BY_ID = { 1: 'ADMIN', 2: 'DOCTOR', 3: 'TECHNICIAN', 4: 'RECEPTIONIST' };
export const ROLE_VI_BY_ID = { 1: 'Admin', 2: 'Bác sĩ', 3: 'Kỹ thuật viên', 4: 'Lễ tân' };

// Display order for the role dropdown (Vietnamese label ↔ role_id ↔ EN code).
export const ROLE_OPTIONS = [
  { vi: 'Bác sĩ', id: 2, en: 'DOCTOR' },
  { vi: 'Lễ tân', id: 4, en: 'RECEPTIONIST' },
  { vi: 'Kỹ thuật viên', id: 3, en: 'TECHNICIAN' },
  { vi: 'Admin', id: 1, en: 'ADMIN' },
];

const ROLE_BY_VI = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.vi, o]));

function normalizeStaff(u) {
  const emp = Array.isArray(u.employee_profiles) ? u.employee_profiles[0] : u.employee_profiles;
  return {
    id: u.user_id,
    name: u.full_name || 'Chưa đặt tên',
    email: u.email || '',
    phone: u.phone || '',
    avatar: u.avatar_url || null,
    roleId: Number(u.role_id),
    role: ROLE_VI_BY_ID[Number(u.role_id)] || 'Nhân viên',
    roleEn: ROLE_EN_BY_ID[Number(u.role_id)] || 'STAFF',
    specialty: emp?.specialization || '',
    status: u.status || 'ACTIVE',
    createdAt: u.created_at,
  };
}

export const StaffModel = {
  // All non-patient accounts, newest first. `employee_profiles` is left-joined
  // for the doctor/technician specialty (nulls out gracefully if RLS hides it).
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name, email, phone, avatar_url, role_id, status, created_at, employee_profiles(specialization)')
      .neq('role_id', 5)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeStaff);
  },

  // Provisions a real, login-capable staff account.
  //
  // Client-side Supabase has no admin/service-role key, so we can't write a raw
  // `users` row (user_id is FK→auth.users). The supported path is anon signUp on
  // a throwaway client (so it never clobbers the admin's own session); the signup
  // leaves that client authenticated AS the new user, which lets us upsert their
  // `users` row with the correct role_id under standard self-RLS.
  async create({ name, email, phone, specialty, roleVi, password }) {
    const role = ROLE_BY_VI[roleVi] || ROLE_BY_VI['Lễ tân'];

    // 1. Check if email already exists in public.users using the authenticated admin client
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      throw new Error('Email này đã được đăng ký trong hệ thống.');
    }

    // 2. Call auth.signUp on a throwaway client
    const temp = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const { data: signUp, error: signUpError } = await temp.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, role: role.en } },
    });

    if (signUpError) {
      if (/already|registered/i.test(signUpError.message)) {
        throw new Error('Email này đã được đăng ký trong hệ thống.');
      }
      throw signUpError;
    }

    // 3. Obtain user_id. If signUp returns null user (due to Confirm Email setting),
    // query public.users using the authenticated admin client since the trigger
    // has already auto-created the row in public.users on signup.
    let uid = signUp?.user?.id;
    if (!uid) {
      for (let i = 0; i < 5; i++) {
        const { data: userRow } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();
        if (userRow?.user_id) {
          uid = userRow.user_id;
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!uid) {
      throw new Error('Không tạo được tài khoản (thiếu user id). Vui lòng thử lại.');
    }

    // 4. Update the user row using the authenticated admin client (supabase) to bypass RLS limits
    const { error: userError } = await supabase
      .from('users')
      .upsert(
        { user_id: uid, role_id: role.id, email, full_name: name, phone, status: 'ACTIVE' },
        { onConflict: 'user_id' }
      );
    if (userError) throw userError;

    // 5. Update employee profile using the authenticated admin client (supabase)
    if (specialty && (role.en === 'DOCTOR' || role.en === 'TECHNICIAN')) {
      const { error: empError } = await supabase
        .from('employee_profiles')
        .upsert({ employee_id: uid, specialization: specialty }, { onConflict: 'employee_id' });
      if (empError) console.warn('StaffModel.create: specialty skipped:', empError.message);
    }

    return uid;
  },

  // Updates an existing staff member's core fields (Admin-privileged write).
  async update(userId, { name, phone, roleVi }) {
    const role = ROLE_BY_VI[roleVi];
    const patch = { full_name: name, phone };
    if (role) patch.role_id = role.id;

    const { error } = await supabase.from('users').update(patch).eq('user_id', userId);
    if (error) throw error;
  },

  // Quick inline role change from the table.
  async setRole(userId, roleVi) {
    const role = ROLE_BY_VI[roleVi];
    if (!role) return;
    const { error } = await supabase.from('users').update({ role_id: role.id }).eq('user_id', userId);
    if (error) throw error;
  },
};
