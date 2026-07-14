import { supabase } from '../supabaseClient';

export const ProfileModel = {
  /**
   * Fetches the complete profile for a user based on their role.
   * Maps snake_case database columns to camelCase frontend model keys.
   *
   * @param {string} userId - The Supabase Auth user ID (UUID)
   * @param {string} role - The role of the user (PATIENT, DOCTOR, TECHNICIAN, RECEPTIONIST, ADMIN)
   */
  async getProfile(userId, role) {
    if (!userId) throw new Error('User ID is required');

    // 1. Fetch common user info
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, full_name, email, phone, gender, date_of_birth, avatar_url, status, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (userError) throw userError;
    
    // AUTO-HEAL: If user row is missing, JIT create it
    if (!user) {
      console.warn('[ProfileModel] User row not found. Triggering Auto-Heal JIT creation...');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
         throw new Error('Hồ sơ của bạn chưa được khởi tạo trong hệ thống. Vui lòng đăng ký lại tài khoản mới hoặc liên hệ Quản trị viên.');
      }

      // Legacy account merge — handled entirely server-side by the atomic
      // SECURITY DEFINER RPC `merge_legacy_account`. Under RLS the client can
      // neither DETECT the old row (a patient can't SELECT another patient by
      // email) nor cascade cross-user UPDATE/DELETE, so the whole flow moved to
      // the DB: the RPC self-discovers the legacy account by the caller's
      // VERIFIED auth email, repoints every child table, and cleans up — all in
      // one transaction. Pass null: the destination is always auth.uid(), never
      // a client-supplied id (anti-spoof).
      const { data: mergeRes, error: mergeErr } = await supabase.rpc('merge_legacy_account', {
        p_old_user_id: null,
      });
      if (mergeErr) {
        console.error('Merge RPC error:', mergeErr.message);
      } else if (mergeRes && mergeRes.success === false) {
        console.warn('Merge Failed:', mergeRes.message);
      }

      // When the RPC merges, it provisions the destination `users` row — re-fetch it.
      const { data: mergedUser } = await supabase
        .from('users')
        .select('user_id, full_name, email, phone, gender, date_of_birth, avatar_url, status, created_at')
        .eq('user_id', userId)
        .maybeSingle();
      user = mergedUser;

      // No legacy account to merge (NO_LEGACY) → fall through to a normal JIT create.
      if (!user) {
        // Proceed with regular JIT create
        const { error: insertError } = await supabase.from('users').upsert({
            user_id: userId,
            role_id: 5, // 5 = PATIENT
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || 'Bệnh nhân mới',
            phone: authUser.user_metadata?.phone || '',
            status: 'ACTIVE'
        });

        if (insertError) {
            console.error("Auto-Heal Insert Failed:", insertError);
            throw new Error('Không thể tự động khởi tạo hồ sơ. RLS hoặc Schema đang chặn Insert.');
        }

        // Re-fetch after auto-heal
        const { data: healedUser, error: healedError } = await supabase
          .from('users')
          .select('user_id, full_name, email, phone, gender, date_of_birth, avatar_url, status, created_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (healedError) throw healedError;
        if (!healedUser) throw new Error('Auto-heal completed but user row is still missing.');
        user = healedUser;
      }
    }

    const baseProfile = {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      gender: user.gender || '',
      dob: user.date_of_birth || '',
      avatar: user.avatar_url || null,
      status: user.status || 'ACTIVE',
      created_at: user.created_at,
    };

    // 2. Fetch role-specific details
    if (role === 'PATIENT') {
      const { data: patient, error: patientError } = await supabase
        .from('patient_profiles')
        .select('address, allergy_note, medical_history, emergency_contact, blood_type, height, weight')
        .eq('patient_id', userId)
        .maybeSingle();

      if (patientError) throw patientError;

      return {
        ...baseProfile,
        kind: 'patient',
        address: patient?.address || '',
        allergyNote: patient?.allergy_note || '',
        medicalHistory: patient?.medical_history || '',
        emergencyContact: patient?.emergency_contact || '',
        bloodType: patient?.blood_type || '',
        height: patient?.height || null,
        weight: patient?.weight || null,
      };
    } else {
      // Staff roles (ADMIN, DOCTOR, TECHNICIAN, RECEPTIONIST)
      const { data: employee, error: employeeError } = await supabase
        .from('employee_profiles')
        .select('specialization, degree, experience_years, work_status, department, work_schedule')
        .eq('employee_id', userId)
        .maybeSingle();

      if (employeeError) throw employeeError;

      const staffProfile = {
        ...baseProfile,
        kind: 'staff',
        specialization: employee?.specialization || '',
        degree: employee?.degree || '',
        experienceYears: employee?.experience_years || 0,
        workStatus: employee?.work_status || 'ACTIVE',
        department: employee?.department || '', // maps to proposed column
        schedule: employee?.work_schedule || '',  // maps to proposed column
      };

      // Doctor-specific details
      if (role === 'DOCTOR') {
        const { data: doctor, error: doctorError } = await supabase
          .from('doctor_profiles')
          .select('description, consultation_fee')
          .eq('doctor_id', userId)
          .maybeSingle();

        if (doctorError) throw doctorError;

        return {
          ...staffProfile,
          description: doctor?.description || '',
          consultationFee: doctor?.consultation_fee || 0.00,
        };
      }

      return staffProfile;
    }
  },

  /**
   * Updates the user profile across multiple database tables using Supabase updates.
   *
   * @param {string} userId - The Supabase Auth user ID (UUID)
   * @param {string} role - The role of the user
   * @param {object} profileData - The frontend profile model containing changes
   */
  async updateProfile(userId, role, profileData) {
    if (!userId) throw new Error('User ID is required');

    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        gender: profileData.gender,
        date_of_birth: profileData.dob || null,
        avatar_url: profileData.avatar,
      })
      .eq('user_id', userId);

    if (userError) throw userError;

    // 1.5 Update Auth metadata so the session (and Header) reflects the new name/avatar immediately
    await supabase.auth.updateUser({
      data: {
        full_name: profileData.name,
        avatar_url: profileData.avatar,
      }
    });

    // 2. Update role-specific extensions using UPSERT (create if not exists)
    if (role === 'PATIENT') {
      const { error: patientError } = await supabase
        .from('patient_profiles')
        .upsert({
          patient_id: userId, // Primary key required for upsert
          address: profileData.address,
          allergy_note: profileData.allergyNote,
          medical_history: profileData.medicalHistory,
          emergency_contact: profileData.emergencyContact,
          ...(profileData.bloodType !== undefined && { blood_type: profileData.bloodType }),
          ...(profileData.height !== undefined && { height: profileData.height }),
          ...(profileData.weight !== undefined && { weight: profileData.weight }),
        });

      if (patientError) throw patientError;
    } else {
      // Staff profile updates
      const { error: employeeError } = await supabase
        .from('employee_profiles')
        .update({
          specialization: profileData.specialization,
          degree: profileData.degree,
          experience_years: profileData.experienceYears ? parseInt(profileData.experienceYears, 10) : 0,
          department: profileData.department, 
          work_schedule: profileData.schedule, 
        })
        .eq('employee_id', userId);

      if (employeeError) throw employeeError;

      // Doctor profile updates
      if (role === 'DOCTOR') {
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .update({
            description: profileData.description,
            consultation_fee: profileData.consultationFee,
          })
          .eq('doctor_id', userId);

        if (doctorError) throw doctorError;
      }
    }

    return this.getProfile(userId, role);
  },

  /**
   * Uploads an avatar image to the Supabase Storage bucket and returns the public URL.
   *
   * @param {string} userId - The Supabase Auth user ID
   * @param {File} file - The file object to upload
   */
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}-${Math.random()}.${fileExt}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('clinic-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('clinic-assets')
      .getPublicUrl(filePath);

    // Update avatar_url in the users table
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('user_id', userId);

    // Update auth metadata so header reflects immediately
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    return publicUrl;
  }
};
