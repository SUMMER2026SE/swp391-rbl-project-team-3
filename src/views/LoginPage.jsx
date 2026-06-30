import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthController } from '../controllers/useAuthController';
import { Shield, AlertCircle, CheckCircle, User, Mail, Phone, Lock, Eye, EyeOff, Key, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import bgImage from '../assets/bg-login.png';
import GlassCheckbox from '../components/common/GlassCheckbox';
import { GLASS_BASE, GLASS_INPUT } from '../components/common/GlassCard';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  const {
    emailInput, setEmailInput,
    passwordInput, setPasswordInput,
    fullNameInput, setFullNameInput,
    phoneInput, setPhoneInput,
    agreeTerms, setAgreeTerms,
    isRegistering, setIsRegistering,
    isForgotPass, setIsForgotPass,
    otpInput, setOtpInput,
    isVerifyingOtp, setIsVerifyingOtp,
    isOtpVerified, setIsOtpVerified,
    isEmailVerified,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    confirmPasswordInput, setConfirmPasswordInput,
    loading, errorMsg, successMsg,
    handleGoogleLogin, handleSubmit,
    handleRegister, handleSendVerificationLink,
    resetMessages
  } = useAuthController();

  return (
    <div
      className="min-h-screen bg-background text-on-background selection:bg-primary/20 selection:text-primary overflow-x-hidden antialiased flex flex-col font-body-md relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >

      {/* Dynamic Floating Glass/Blur Orbs */}
      <div className="bg-orbs -z-10">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      {/* Content Wrapper */}
      <div className="flex flex-col min-h-screen w-full relative z-10 text-on-background selection:bg-primary/20 selection:text-primary font-body-md">

      <main className="flex-grow flex items-center justify-center p-margin-mobile md:p-margin-desktop relative z-10">
        <div className={`w-full max-w-md ${GLASS_BASE} p-8 md:p-10 relative z-20 mx-auto`}>

          {/* Logo Section */}
          <div className="text-center mb-8">
            <img src={logo} alt="DermaSmart Logo" className="h-20 w-auto mx-auto mb-6 object-contain drop-shadow-[0_4px_8px_rgba(0,104,95,0.2)]" />
            
            {isForgotPass ? (
              <>
                <h1 className="font-headline-md text-headline-md text-on-surface mb-2">
                  {isOtpVerified ? 'Tạo mật khẩu mới' : isVerifyingOtp ? 'Xác thực OTP' : 'Khôi phục mật khẩu'}
                </h1>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {isOtpVerified
                    ? 'Thiết lập mật khẩu mới bảo mật cho tài khoản của bạn.'
                    : isVerifyingOtp
                    ? 'Nhập mã OTP 6 số đã được gửi tới email của bạn.'
                    : 'Nhập địa chỉ email của bạn để bắt đầu khôi phục mật khẩu.'}
                </p>
              </>
            ) : isRegistering ? (
              <>
                <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Tạo tài khoản mới</h1>
                <p className="font-body-md text-sm text-on-surface-variant">Tham gia nền tảng quản lý da liễu AI cao cấp.</p>
              </>
            ) : (
              <>
                <h1 className="font-headline-md text-headline-md text-on-surface mb-2">Đăng nhập</h1>
                <p className="font-body-md text-sm text-on-surface-variant">Vui lòng nhập thông tin để truy cập hệ thống.</p>
              </>
            )}
          </div>

          {/* Alert messages */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-error-container/60 border border-error/20 text-on-error-container backdrop-blur-sm"
              >
                <AlertCircle className="text-error flex-shrink-0 mt-0.5 w-5 h-5" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-3.5 mb-5 rounded-xl bg-primary-fixed/40 border border-primary/20 text-on-primary-fixed backdrop-blur-sm"
              >
                <CheckCircle className="text-primary flex-shrink-0 mt-0.5 w-5 h-5" />
                <p className="text-sm font-medium">{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          {isForgotPass ? (
            /* FORGOT PASSWORD FORM */
            <form onSubmit={(e) => handleSubmit(e, from)} className="space-y-5">
              {!isVerifyingOtp && !isOtpVerified && (
                /* Step 1: Send OTP */
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="recovery-email">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                    <input
                      className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                      id="recovery-email"
                      name="recovery-email"
                      placeholder="name@example.com"
                      required
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isVerifyingOtp && !isOtpVerified && (
                /* Step 2: Verify OTP */
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="otp-code">
                    Mã xác thực OTP
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                    <input
                      className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md tracking-wider font-semibold text-center`}
                      id="otp-code"
                      name="otp-code"
                      placeholder="Mã OTP 6 chữ số"
                      required
                      maxLength={6}
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isOtpVerified && (
                /* Step 3: Set new password */
                <div className="space-y-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="new-password">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                      <input
                        className={`w-full pl-11 pr-10 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                        id="new-password"
                        name="new-password"
                        placeholder="Nhập mật khẩu mới"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                      <button
                        aria-label="Hiện mật khẩu"
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none bg-transparent border-none"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="confirm-new-password">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                      <input
                        className={`w-full pl-11 pr-10 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                        id="confirm-new-password"
                        name="confirm-new-password"
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      />
                      <button
                        aria-label="Hiện xác nhận mật khẩu"
                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none bg-transparent border-none"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 w-full flex justify-center items-center">
                <button
                  className="w-full py-3 px-4 rounded-full bg-primary/40 backdrop-blur-md border border-white/50 text-white font-bold shadow-[0_8px_32px_0_rgba(0,104,95,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-primary/60 hover:border-white/70 hover:shadow-[0_8px_32px_0_rgba(0,104,95,0.4),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  type="submit"
                  disabled={loading}
                >
                  <span>
                    {isOtpVerified
                      ? 'Cập nhật mật khẩu'
                      : isVerifyingOtp
                      ? 'Xác nhận OTP'
                      : 'Gửi mã OTP'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPass(false);
                    setIsVerifyingOtp(false);
                    setIsOtpVerified(false);
                    resetMessages();
                  }}
                  className="text-primary hover:text-primary-container font-semibold transition-colors text-sm bg-transparent border-none cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          ) : isRegistering ? (
            /* DRAFT & SYNC REGISTRATION — single form, email verified via magic link */
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="fullname">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="fullname"
                    name="fullname"
                    placeholder="Nhập họ và tên của bạn"
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="email">
                    Email
                  </label>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                      <span className="text-emerald-600 font-medium text-sm">Email đã được xác nhận</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                      <span className="text-rose-500 font-medium text-sm">Email chưa xác nhận</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="email"
                    name="email"
                    placeholder="Nhập địa chỉ email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                {!isEmailVerified && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendVerificationLink}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-white/50 backdrop-blur-md border border-white/60 rounded-full px-3 py-1.5 hover:bg-white/70 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Gửi link xác nhận
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="phone"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-10 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="password"
                    name="password"
                    placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <button
                    aria-label="Hiện mật khẩu"
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none bg-transparent border-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="confirm_password">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-10 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="confirm_password"
                    name="confirm_password"
                    placeholder="Nhập lại mật khẩu"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  />
                  <button
                    aria-label="Hiện xác nhận mật khẩu"
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none bg-transparent border-none"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 w-full flex justify-center items-center">
                <button
                  className={`w-full py-3 px-4 rounded-full bg-primary/40 backdrop-blur-md border border-white/50 text-white font-bold shadow-[0_8px_32px_0_rgba(0,104,95,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-primary/60 hover:border-white/70 hover:shadow-[0_8px_32px_0_rgba(0,104,95,0.4),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:transform-none ${!isEmailVerified ? 'opacity-50' : ''}`}
                  type="submit"
                  disabled={loading}
                  title={!isEmailVerified ? 'Vui lòng xác nhận email trước khi đăng ký.' : undefined}
                >
                  <span>Đăng ký</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={(e) => handleSubmit(e, from)} className="space-y-5">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface mb-1.5" htmlFor="email">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-4 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="email"
                    name="email"
                    placeholder="Nhập email hoặc số điện thoại"
                    required
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-label-sm text-label-sm text-on-surface" htmlFor="password">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPass(true);
                      resetMessages();
                    }}
                    className="text-primary hover:text-primary-container font-semibold transition-colors text-sm bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-outline w-5 h-5" />
                  <input
                    className={`w-full pl-11 pr-10 py-3 rounded-full ${GLASS_INPUT} font-body-md text-body-md`}
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <button
                    aria-label="Hiện mật khẩu"
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none bg-transparent border-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center mt-2">
                <GlassCheckbox
                  id="remember-me"
                  name="remember-me"
                />
                <label className="ml-3 font-body-md text-sm text-on-surface-variant cursor-pointer" htmlFor="remember-me">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="pt-2 w-full flex justify-center items-center">
                <button
                  className="w-full py-3 px-4 rounded-full bg-primary/40 backdrop-blur-md border border-white/50 text-white font-bold shadow-[0_8px_32px_0_rgba(0,104,95,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-primary/60 hover:border-white/70 hover:shadow-[0_8px_32px_0_rgba(0,104,95,0.4),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  type="submit"
                  disabled={loading}
                >
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <button
                  className="w-full py-3 px-4 rounded-full bg-white bg-opacity-60 backdrop-blur-md border border-outline-variant text-on-surface font-semibold text-sm flex justify-center items-center gap-3 hover:bg-white hover:bg-opacity-80 transition-colors shadow-sm cursor-pointer"
                  type="button"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Đăng nhập bằng Google</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer switches inside card */}
          {!isForgotPass && (
            <div className="mt-8 text-center border-t border-white/20 pt-5">
              <p className="font-body-md text-sm text-on-surface-variant">
                {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    resetMessages();
                  }}
                  className="text-primary hover:text-primary-container font-semibold transition-colors ml-1.5 bg-transparent border-none cursor-pointer"
                >
                  {isRegistering ? 'Đăng nhập' : 'Đăng ký tài khoản mới'}
                </button>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer from HTML */}
      <footer className="w-full py-8 flex flex-col md:flex-row justify-between items-center px-margin-desktop gap-4 bg-transparent mt-auto relative z-10 border-t border-white/10">
        <div className="font-label-sm text-xs text-on-surface-variant text-center md:text-left opacity-80">
          © 2024 DermaSmart. Hệ thống quản lý da liễu AI cao cấp.
        </div>
        <div className="flex gap-6">
          <a
            className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100"
            href="#"
          >
            Điều khoản
          </a>
          <a
            className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100"
            href="#"
          >
            Bảo mật
          </a>
          <a
            className="font-label-sm text-xs text-on-surface-variant hover:text-primary transition-colors opacity-70 hover:opacity-100"
            href="#"
          >
            Liên hệ
          </a>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default LoginPage;
