import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModel } from '../models/AuthModel';

export function useAuthController(onSuccessCallback = null) {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

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
        await AuthModel.resetPasswordForEmail(emailInput);
        setSuccessMsg('Yêu cầu khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra email của bạn.');
      } else if (isRegistering) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.trim())) {
          throw new Error('Email không đúng định dạng.');
        }
        if (passwordInput.length < 8) {
          throw new Error('Mật khẩu đăng ký phải từ 8 ký tự trở lên.');
        }
        await AuthModel.signUp(emailInput, passwordInput, fullNameInput);
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
      let message = error.message;
      if (message.includes('Invalid login credentials')) {
        message = 'Email hoặc mật khẩu không chính xác.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Vui lòng xác nhận email trước khi đăng nhập.';
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
