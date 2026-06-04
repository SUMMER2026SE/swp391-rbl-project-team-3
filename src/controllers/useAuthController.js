import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModel } from '../models/AuthModel';

export function useAuthController(onSuccessCallback = null) {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
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

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      await AuthModel.signInWithGoogle();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleLogout = async (onSuccess = null) => {
    try {
      await AuthModel.signOut();
      if (onSuccess) onSuccess();
      if (onSuccessCallback) onSuccessCallback();
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgotPass) {
        if (!isVerifyingOtp && !isOtpVerified) {
          // STEP 1: SEND OTP LOGIC
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(emailInput.trim())) {
            throw new Error('Email không đúng định dạng.');
          }
          await AuthModel.resetPasswordForEmail(emailInput.trim());
          setIsVerifyingOtp(true);
          setSuccessMsg('Mã OTP đã được gửi!');
        } else if (isVerifyingOtp && !isOtpVerified) {
          // STEP 2: VERIFY OTP LOGIC
          if (!otpInput || otpInput.trim().length !== 6) {
            throw new Error('Mã OTP phải gồm đúng 6 chữ số.');
          }
          await AuthModel.verifyOtpForRecovery(emailInput.trim(), otpInput.trim());
          setIsOtpVerified(true);
          setSuccessMsg('Xác thực thành công! Vui lòng tạo mật khẩu mới.');
        } else if (isOtpVerified) {
          // STEP 3: UPDATE NEW PASSWORD LOGIC
          if (passwordInput.length < 8) {
            throw new Error('Mật khẩu mới phải từ 8 ký tự trở lên.');
          }
          if (passwordInput !== confirmPasswordInput) {
            throw new Error('Mật khẩu xác nhận không trùng khớp.');
          }
          await AuthModel.updateUserPassword(passwordInput);
          setSuccessMsg('Đổi mật khẩu thành công! Đang quay lại trang đăng nhập...');
          
          setTimeout(() => {
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
          }, 2000);
        }
      } else if (isRegistering) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.trim())) {
          throw new Error('Email không đúng định dạng.');
        }
        if (passwordInput.length < 8) {
          throw new Error('Mật khẩu đăng ký phải từ 8 ký tự trở lên.');
        }
        await AuthModel.signUp(emailInput, passwordInput, fullNameInput, 'PATIENT');
        setSuccessMsg('Đăng ký thành công! Vui lòng xác nhận email trước khi đăng nhập.');
      } else {
        await AuthModel.signInWithPassword(emailInput, passwordInput);
        if (onSuccessCallback) {
          onSuccessCallback();
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error("OTP VERIFICATION FAILED:", error.message);
      let message = error.message;
      if (message.includes('Invalid login credentials')) {
        message = 'Email hoặc mật khẩu không chính xác.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Vui lòng xác nhận email trước khi đăng nhập.';
      } else if (message.includes('Token has expired or is invalid')) {
        message = 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passwordInput.length < 8) {
      setErrorMsg('Mật khẩu phải dài từ 8 ký tự trở lên.');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await AuthModel.updateUserPassword(passwordInput);
      setSuccessMsg('Đổi mật khẩu thành công! Đang tự động chuyển hướng...');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
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
    handleResetPassword,
    resetMessages
  };
}
