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
    console.log('[ProfileModel] Fetching for User ID:', userId, 'Role:', role);

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
        .select('address, allergy_note, medical_history, emergency_contact')
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

    // 1. Update the base users table
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
        });

      if (patientError) throw patientError;
    } else {
      // Staff profile updates
      const { error: employeeError } = await supabase
        .from('employee_profiles')
        .upsert({
          employee_id: userId, // Primary key required for upsert
          specialization: profileData.specialization,
          department: profileData.department, 
          work_schedule: profileData.schedule, 
        });

      if (employeeError) throw employeeError;

      // Doctor profile updates
      if (role === 'DOCTOR') {
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .upsert({
            doctor_id: userId, // Primary key required for upsert
            description: profileData.description,
            consultation_fee: profileData.consultationFee,
          });

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

    // Update the database profile immediately
    const { error: dbError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return publicUrl;
  }
};
