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

  async signUp(email, password, fullName, role = 'PATIENT') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
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
