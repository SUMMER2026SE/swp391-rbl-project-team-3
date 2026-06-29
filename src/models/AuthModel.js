import { supabase } from '../supabaseClient';

export const AuthModel = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },

  async signUp(email, password, fullName, role = 'PATIENT', phone = '') {
    // Return the raw { data, error } pair (instead of throwing) so the caller can
    // inspect the Email-Confirmation edge cases — a null session for a pending
    // verification, or an empty `identities` array meaning the email already
    // exists (Supabase's enumeration-protection fake user). Throwing here would
    // discard `error` and collapse those distinct states into one.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
        }
      }
    });
    return { data, error };
  },

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    const role = data?.user?.user_metadata?.role || 'PATIENT';
    return { success: true, role, ...data };
  },

  async signInWithGoogle(redirectTo) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPasswordForEmail(email, redirectTo) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || (window.location.origin + '/reset-password')
    });
    if (error) throw error;
    return data;
  },

  async verifyOtpForRecovery(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    });
    if (error) throw error;
    return data;
  },

  async verifySignupOtp(email, token) {
    // In-app 6-digit confirmation: exchanges the emailed {{ .Token }} for a real
    // session (type: 'signup'). Returns the raw { data, error } pair — like
    // signUp — so the controller can branch on session presence vs. a bad code.
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    return { data, error };
  },

  // ─── Progressive registration pipeline (Verify-email-first UX) ──────────────
  // Email → OTP → details. We deliberately avoid signUp() (which demands a
  // password upfront) and instead: signInWithOtp → verifyOtp → updateUser.

  async sendRegistrationOtp(email) {
    // Step 1: dispatch a 6-digit code. shouldCreateUser defaults to true, so a
    // brand-new (passwordless) user row is provisioned for this email.
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    return { data, error };
  },

  async completeUserRegistration(password, fullName, phone) {
    // Step 3: the verifyOtp step already established a session, so updateUser
    // attaches the password + profile metadata to the now-authenticated user.
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: fullName,
        phone: phone,
      }
    });
    return { data, error };
  },

  async updateUserPassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  async changePassword(oldPassword, newPassword) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Người dùng chưa đăng nhập.');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });

    if (authError) {
      throw new Error('Mật khẩu cũ không chính xác.');
    }

    const { data, error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
    return data;
  }
};
