import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthModel } from '../models/AuthModel';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Regex Constants
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VN_PHONE_REGEX = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
const OTP_REGEX = /^[0-9]{6}$/;

// Helper Helpers & Normalizers
const normalizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : '';
};

const normalizePhone = (phone) => {
  return phone ? phone.trim().replace(/\s+/g, '') : '';
};

const classifyIdentifier = (input) => {
  const normalized = input.trim();
  if (EMAIL_REGEX.test(normalized)) return 'EMAIL';
  if (VN_PHONE_REGEX.test(normalized)) return 'PHONE';
  return 'INVALID';
};

const assertStrongPassword = (password) => {
  if (!password || password.length < 8) {
    throw new Error('Mật khẩu phải dài từ 8 ký tự trở lên.');
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new Error('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.');
  }
};

const assertPasswordConfirmed = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    throw new Error('Mật khẩu xác nhận không trùng khớp.');
  }
};

const toVietnameseAuthError = (error) => {
  if (!error) return '';
  const message = error.message || String(error);
  if (message.includes('Invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Vui lòng xác nhận email trước khi đăng nhập.';
  }
  if (message.includes('Token has expired or is invalid')) {
    return 'Mã OTP không hợp lệ hoặc đã hết hạn.';
  }
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'Email hoặc số điện thoại này đã được đăng ký.';
  }
  return message;
};

const withTimeout = (promise, timeoutMs = 15000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Yêu cầu hết thời gian phản hồi. Vui lòng thử lại.'));
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
};

export function useAuthController(onSuccessCallback = null) {
  const { login, session } = useAuth();

  // Email is "verified" once a Supabase session exists — i.e. the user clicked
  // the magic link (this tab, or another tab that synced via localStorage).
  const isEmailVerified = !!session;

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(location.state?.isRegistering || false);

  useEffect(() => {
    if (location.state?.isRegistering) {
      setIsRegistering(true);
      // Optional: clean up the history state so refreshing doesn't keep forcing registration
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ─── Draft & Sync: HYDRATE on mount ────────────────────────────────────────
  // When the magic link reopens the form (?mode=register) — possibly in a brand
  // new tab — restore the half-filled draft from localStorage so nothing is lost.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') !== 'register') return;
    setIsRegistering(true);
    try {
      const raw = localStorage.getItem('derma_draft_form');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.fullName) setFullNameInput(draft.fullName);
      if (draft.email) setEmailInput(draft.email);
      if (draft.phone) setPhoneInput(draft.phone);
      if (draft.password) setPasswordInput(draft.password);
    } catch {
      // Corrupt draft — ignore and start fresh.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Draft & Sync: PERSIST on change ───────────────────────────────────────
  // Mirror every keystroke of the registration form to localStorage so the data
  // survives a cross-tab magic-link round trip. Scoped to register mode so we
  // never capture the login form's email/password.
  useEffect(() => {
    if (!isRegistering) return;
    try {
      localStorage.setItem(
        'derma_draft_form',
        JSON.stringify({
          fullName: fullNameInput,
          email: emailInput,
          phone: phoneInput,
          password: passwordInput,
        })
      );
    } catch {
      // Storage full / unavailable — non-fatal.
    }
  }, [isRegistering, fullNameInput, emailInput, phoneInput, passwordInput]);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // Refs for tracking mounted state and preventing race conditions/duplicate calls
  const isMountedRef = useRef(true);
  const pendingRequestRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isForgotPass) {
      sessionStorage.setItem('isResettingPassword', 'true');
    } else {
      sessionStorage.removeItem('isResettingPassword');
    }
    return () => {
      sessionStorage.removeItem('isResettingPassword');
    };
  }, [isForgotPass]);

  // Safe State Setters to Prevent Memory Leaks
  const safeSetLoading = (val) => {
    if (isMountedRef.current) setLoading(val);
  };
  const safeSetError = (val) => {
    if (isMountedRef.current) setErrorMsg(val);
  };
  const safeSetSuccess = (val) => {
    if (isMountedRef.current) setSuccessMsg(val);
  };

  const handleGoogleLogin = async () => {
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;
    safeSetLoading(true);
    safeSetError('');
    safeSetSuccess('');

    try {
      await withTimeout(AuthModel.signInWithGoogle(), 10000);
    } catch (error) {
      safeSetError(toVietnameseAuthError(error));
    } finally {
      pendingRequestRef.current = false;
      safeSetLoading(false);
    }
  };

  const handleLogout = async (onSuccess = null) => {
    try {
      await AuthModel.signOut();
      if (onSuccess) onSuccess();
      if (onSuccessCallback) onSuccessCallback();
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  const handleSubmit = async (e, fromPath = null) => {
    if (e) e.preventDefault();
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;

    safeSetLoading(true);
    safeSetError('');
    safeSetSuccess('');

    try {
      if (isForgotPass) {
        if (!isVerifyingOtp && !isOtpVerified) {
          // STEP 1: SEND OTP LOGIC
          const normalized = normalizeEmail(emailInput);
          if (classifyIdentifier(normalized) !== 'EMAIL') {
            throw new Error('Email không đúng định dạng.');
          }
          await withTimeout(AuthModel.resetPasswordForEmail(normalized), 10000);
          if (isMountedRef.current) {
            setIsVerifyingOtp(true);
            safeSetSuccess('Mã OTP đã được gửi đến email của bạn.');
          }
        } else if (isVerifyingOtp && !isOtpVerified) {
          // STEP 2: VERIFY OTP LOGIC
          const normalizedOtp = otpInput.trim();
          if (!OTP_REGEX.test(normalizedOtp)) {
            throw new Error('Mã OTP phải gồm đúng 6 chữ số.');
          }
          await withTimeout(AuthModel.verifyOtpForRecovery(normalizeEmail(emailInput), normalizedOtp), 10000);
          if (isMountedRef.current) {
            setIsOtpVerified(true);
            safeSetSuccess('Xác thực mã OTP thành công! Vui lòng tạo mật khẩu mới.');
          }
        } else if (isOtpVerified) {
          // STEP 3: UPDATE NEW PASSWORD LOGIC
          assertStrongPassword(passwordInput);
          assertPasswordConfirmed(passwordInput, confirmPasswordInput);
          await withTimeout(AuthModel.updateUserPassword(passwordInput), 10000);
          safeSetSuccess('Đổi mật khẩu thành công! Đang quay lại trang đăng nhập...');
          
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsForgotPass(false);
              setIsVerifyingOtp(false);
              setIsOtpVerified(false);
              setEmailInput('');
              setOtpInput('');
              setPasswordInput('');
              setConfirmPasswordInput('');
              resetMessages();
              if (onSuccessCallback) {
                onSuccessCallback();
              } else {
                navigate('/login');
              }
            }
          }, 2000);
        }
      } else {
        // LOGIN FLOW
        if (!emailInput.trim() || !passwordInput) {
          throw new Error('Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu.');
        }

        const identifier = emailInput.trim();
        const idType = classifyIdentifier(identifier);
        if (idType === 'INVALID') {
          throw new Error('Email hoặc số điện thoại không hợp lệ.');
        }

        const normalizedEmail = normalizeEmail(identifier);

        // Check local mock employee database
        const savedEmployees = localStorage.getItem('admin-employees');
        const localEmployees = savedEmployees ? JSON.parse(savedEmployees) : [];
        const allEmployees = [...localEmployees, ...([])];

        const foundEmp = allEmployees.find(
          emp => emp.email?.toLowerCase().trim() === normalizedEmail
        );

        if (foundEmp) {
          const correctPassword = foundEmp.initialPassword || '123456';
          if (passwordInput !== correctPassword && passwordInput !== '123456') {
            throw new Error('Mật khẩu không chính xác.');
          }
          if (foundEmp.status === 'Tạm khóa') {
            throw new Error('Tài khoản này đã bị tạm khóa.');
          }

          const roleMapping = {
            'Bác sĩ': 'DOCTOR',
            'Lễ tân': 'RECEPTIONIST',
            'Kỹ thuật viên': 'TECHNICIAN',
            'Admin': 'ADMIN',
            'DOCTOR': 'DOCTOR',
            'RECEPTIONIST': 'RECEPTIONIST',
            'TECHNICIAN': 'TECHNICIAN',
            'ADMIN': 'ADMIN'
          };
          const engRole = roleMapping[foundEmp.role] || foundEmp.role || 'PATIENT';

          const customUser = {
            id: foundEmp.id,
            name: foundEmp.name,
            role: engRole,
            email: foundEmp.email,
            phone: foundEmp.phone,
            avatar: `https://i.pravatar.cc/150?u=${foundEmp.id}`
          };

          const path = login(engRole, customUser);
          if (onSuccessCallback) {
            onSuccessCallback();
          } else {
            if (fromPath) {
              window.location.href = fromPath;
            } else if (engRole === 'PATIENT') {
              window.location.href = '/';
            } else {
              const roleDashboard = {
                ADMIN: '/dashboard/admin',
                DOCTOR: '/dashboard/doctor',
                TECHNICIAN: '/dashboard/technician',
                RECEPTIONIST: '/dashboard/receptionist',
              };
              window.location.href = roleDashboard[engRole] || path || '/';
            }
          }
        } else {
          // Real Supabase Authentication
          const authResult = await withTimeout(AuthModel.signInWithPassword(normalizedEmail, passwordInput), 12000);
          
          if (authResult.success) {
            const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role_id, status')
            .eq('user_id', authResult.user.id)
            .maybeSingle();
            
            if (userError || !userData) {
              // Fallback if user profile isn't fully generated yet
              navigate('/profile');
              return;
            }

            if (userData.status && userData.status !== 'ACTIVE') {
              await AuthModel.signOut();
              setErrorMsg('Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.');
              return;
            }

            let finalRole = 'PATIENT';
            const currentRole = Number(userData.role_id);
            if (currentRole === 1) finalRole = 'ADMIN';
            else if (currentRole === 2) finalRole = 'DOCTOR';
            else if (currentRole === 3) finalRole = 'TECHNICIAN';
            else if (currentRole === 4) finalRole = 'RECEPTIONIST';
            else if (currentRole === 5) finalRole = 'PATIENT';

            login(finalRole);

            if (onSuccessCallback) {
              onSuccessCallback();
            } else {
              if (fromPath) {
                window.location.href = fromPath;
                return;
              }
              const dashboardMap = {
                1: '/dashboard/admin',
                2: '/dashboard/doctor',
                3: '/dashboard/technician',
                4: '/dashboard/receptionist',
                5: '/'
              };
              window.location.href = dashboardMap[currentRole] || '/';
            }
          }
        }
      }
    } catch (error) {
      safeSetError(toVietnameseAuthError(error));
    } finally {
      pendingRequestRef.current = false;
      safeSetLoading(false);
    }
  };

  // ─── Full-form-upfront registration with cross-tab confirmation UX ─────────
  // ─── Draft & Sync: dispatch the email magic link ───────────────────────────
  const handleSendVerificationLink = async (e) => {
    if (e) e.preventDefault();
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;

    safeSetLoading(true);
    safeSetError('');
    safeSetSuccess('');

    try {
      const normalizedEmail = normalizeEmail(emailInput);
      if (!normalizedEmail) {
        throw new Error('Vui lòng nhập địa chỉ email.');
      }
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        throw new Error('Định dạng email không hợp lệ.');
      }

      console.log('[HungBB-Auth] SEND MAGIC LINK:', { email: normalizedEmail });
      const { error } = await withTimeout(AuthModel.sendMagicLink(normalizedEmail), 12000);
      if (error) throw error;

      safeSetSuccess('Đã gửi link, vui lòng kiểm tra hộp thư.');
    } catch (error) {
      console.log('[HungBB-Auth] SEND MAGIC LINK FAILED:', error?.message || String(error));
      safeSetError(toVietnameseAuthError(error));
    } finally {
      pendingRequestRef.current = false;
      safeSetLoading(false);
    }
  };

  // ─── Draft & Sync: finalize once the email is verified (session exists) ─────
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;

    safeSetLoading(true);
    safeSetError('');
    safeSetSuccess('');

    try {
      // Gate the whole flow on a verified email (a live session).
      if (!isEmailVerified) {
        throw new Error('Vui lòng xác nhận email trước khi đăng ký.');
      }

      // Validate the remaining fields with precise Vietnamese errors.
      const fullName = fullNameInput.trim();
      const phone = normalizePhone(phoneInput);

      if (!fullName) {
        throw new Error('Vui lòng nhập họ và tên.');
      }
      if (!phone) {
        throw new Error('Vui lòng nhập số điện thoại.');
      }
      if (!VN_PHONE_REGEX.test(phone)) {
        throw new Error('Số điện thoại không đúng định dạng Việt Nam.');
      }
      if (!passwordInput || passwordInput.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
      }
      if (passwordInput !== confirmPasswordInput) {
        throw new Error('Mật khẩu xác nhận không khớp.');
      }

      console.log('[HungBB-Auth] FINALIZE REGISTRATION:', { fullName, phone });
      const { error } = await withTimeout(
        AuthModel.finalizeRegistration(passwordInput, fullName, phone),
        12000
      );
      if (error) throw error;

      // Success: discard the draft and land the user inside the app.
      localStorage.removeItem('derma_draft_form');
      console.log('[HungBB-Auth] REGISTRATION COMPLETE — redirecting.');
      safeSetSuccess('Đăng ký hoàn tất! Đang chuyển hướng...');
      setTimeout(() => {
        if (isMountedRef.current) {
          if (onSuccessCallback) onSuccessCallback();
          else window.location.href = '/';
        }
      }, 800);
      return;
    } catch (error) {
      console.log('[HungBB-Auth] FINALIZE REGISTRATION FAILED:', error?.message || String(error));
      safeSetError(toVietnameseAuthError(error));
    } finally {
      pendingRequestRef.current = false;
      safeSetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;

    safeSetLoading(true);
    safeSetError('');
    safeSetSuccess('');

    try {
      assertStrongPassword(passwordInput);
      assertPasswordConfirmed(passwordInput, confirmPasswordInput);
      
      await withTimeout(AuthModel.updateUserPassword(passwordInput), 10000);
      safeSetSuccess('Đổi mật khẩu thành công! Đang tự động chuyển hướng...');
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate('/');
        }
      }, 3000);
    } catch (error) {
      safeSetError(toVietnameseAuthError(error));
    } finally {
      pendingRequestRef.current = false;
      safeSetLoading(false);
    }
  };

  const resetMessages = () => {
    if (isMountedRef.current) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  return {
    emailInput,
    setEmailInput,
    passwordInput,
    setPasswordInput,
    fullNameInput,
    setFullNameInput,
    confirmPasswordInput,
    setConfirmPasswordInput,
    phoneInput,
    setPhoneInput,
    agreeTerms,
    setAgreeTerms,
    isRegistering,
    setIsRegistering,
    isForgotPass,
    setIsForgotPass,
    otpInput,
    setOtpInput,
    isVerifyingOtp,
    setIsVerifyingOtp,
    isOtpVerified,
    setIsOtpVerified,
    isEmailVerified,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    setLoading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    handleGoogleLogin,
    handleLogout,
    handleSubmit,
    handleRegister,
    handleSendVerificationLink,
    handleResetPassword,
    resetMessages
  };
}
