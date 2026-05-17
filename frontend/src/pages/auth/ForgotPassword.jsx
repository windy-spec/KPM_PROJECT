import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Factory, Mail, Lock, Send, CheckCircle2, CircleAlert, Sparkles, BadgeCheck } from 'lucide-react';
import { authService } from '../../services/auth.service';
import Portal from '../../components/common/Portal';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Xác thực Email/OTP, 2: Đặt lại mật khẩu
  const [isOtpEnabled, setIsOtpEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // State quản lý 6 ô OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]); 
  const redirectTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const showAuthToast = (variant, title, description) => {
    const configs = {
      success: {
        wrapper: 'border-emerald-200 bg-emerald-50/95',
        badge: 'bg-emerald-600 text-white',
        title: 'text-emerald-950',
        description: 'text-emerald-800',
        icon: BadgeCheck,
      },
      error: {
        wrapper: 'border-rose-200 bg-rose-50/95',
        badge: 'bg-rose-600 text-white',
        title: 'text-rose-950',
        description: 'text-rose-800',
        icon: CircleAlert,
      },
      info: {
        wrapper: 'border-sky-200 bg-sky-50/95',
        badge: 'bg-sky-600 text-white',
        title: 'text-sky-950',
        description: 'text-sky-800',
        icon: Sparkles,
      },
    };

    const config = configs[variant] || configs.info;
    const Icon = config.icon;

    toast(({ closeToast }) => (
      <div className={`flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm ${config.wrapper}`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.badge}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${config.title}`}>
            {title}
          </p>
          <p className={`mt-1 text-sm leading-relaxed ${config.description}`}>
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={closeToast}
          className="rounded-full p-1 text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    ), {
      position: 'top-right',
      autoClose: 3500,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      icon: false,
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
        minHeight: 'unset',
      },
    });
  };

  const showError = (message) => {
    setErrorMessage(message);
    showAuthToast('error', 'Yêu cầu chưa hợp lệ', message);
  };

  // --- LOGIC XỬ LÝ OTP ---
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return; 

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); 
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Nhấn Backspace để quay lại ô trước
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- LOGIC XỬ LÝ FORM ---
  const handleSendOTP = async () => {
    if (!formData.email) {
      return showError('Vui lòng nhập email hệ thống!');
    }
    setLoading(true);
    try {
      await authService.forgotPassword({ email: formData.email });
      setLoading(false);
      setIsOtpEnabled(true);
      setErrorMessage('');
    } catch (error) {
      setLoading(false);
      showError(error.response?.data?.message || 'Không thể gửi mã. Vui lòng kiểm tra email và thử lại.');
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      setStep(2);
    } else {
      showError('Vui lòng nhập đủ mã xác thực!');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return showError('Mật khẩu xác nhận không trùng khớp!');
    }
    setLoading(true);
    try {
      const fullOtp = otp.join("");
      await authService.resetPassword({
        email: formData.email,
        otpCode: fullOtp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      setLoading(false);
      setSuccessMessage('Mật khẩu đã được thay đổi thành công! Đang chuyển bạn về trang đăng nhập...');
      setCountdown(3);
      setShowSuccessOverlay(true);

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      countdownTimerRef.current = setInterval(() => {
        setCountdown((currentCountdown) => {
          if (currentCountdown <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            navigate('/login');
            return 0;
          }

          return currentCountdown - 1;
        });
      }, 1000);
    } catch (error) {
      setLoading(false);
      showError(error.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans selection:bg-primary/20">
      {showSuccessOverlay && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
              <div className="p-8 sm:p-10 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">Thành công</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Đổi mật khẩu hoàn tất</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {successMessage}
                </p>
                <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Hệ thống sẽ tự động chuyển sang đăng nhập sau {countdown} giây.
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Header */}
      <header className="px-10 py-5 flex items-center bg-white border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Factory className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black text-primary tracking-tighter uppercase">KPM</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[500px] bg-white border border-outline-variant rounded-3xl p-8 md:p-12 shadow-sm">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight italic">
              {step === 1 ? "Quên mật khẩu" : "Thiết lập lại"}
            </h1>
            <p className="text-[11px] text-on-surface-variant mt-2 font-bold uppercase tracking-[0.2em] opacity-60">
              {step === 1 ? "Xác minh danh tính qua mã OTP" : "Tạo mật khẩu mới cho tài khoản KPM"}
            </p>
          </div>

          {step === 1 ? (
            /* --- BƯỚC 1: NHẬP EMAIL & CỤM OTP TỔNG --- */
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-8">
              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              {/* Field Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Email đăng ký</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input 
                      type="email" 
                      placeholder="username@kpm.vn" 
                      disabled={isOtpEnabled}
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container border border-outline-variant rounded-2xl focus:border-primary outline-none text-sm shadow-inner transition-all disabled:opacity-50"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || isOtpEnabled}
                    className="px-6 bg-primary text-on-primary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-container transition-all flex items-center gap-2 disabled:bg-outline-variant shadow-lg shadow-primary/20"
                  >
                    {loading ? "..." : <><Send className="w-3.5 h-3.5" /> Gửi mã</>}
                  </button>
                </div>
              </div>

              {/* Ô TỔNG CHỨA 6 Ô OTP */}
              <div className={`flex flex-col gap-4 transition-all duration-500 ${!isOtpEnabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Mã xác thực OTP</label>
                  <span className="text-[10px] font-bold text-on-surface-variant italic"></span>
                </div>
                
                <div className="flex items-center bg-surface-container border-2 border-outline-variant rounded-2xl overflow-hidden focus-within:border-primary focus-within:bg-white focus-within:shadow-md transition-all">
                  {otp.map((data, index) => (
                    <React.Fragment key={index}>
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        className="w-full h-16 md:h-20 text-center text-3xl font-black bg-transparent outline-none text-primary selection:bg-primary/10"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                      />
                      {/* Đường kẻ dọc giữa các ô */}
                      {index < 5 && (
                        <div className="w-px h-10 bg-outline-variant/40 shrink-0"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={!isOtpEnabled}
                className="w-full py-4.5 bg-primary text-on-primary font-black rounded-2xl hover:bg-primary-container transition-all uppercase tracking-[0.2em] text-xs mt-2 shadow-xl shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
              >
                Xác thực & Tiếp tục
              </button>
            </form>
          ) : (
            /* --- BƯỚC 2: NHẬP MẬT KHẨU MỚI --- */
            <form onSubmit={handleResetPassword} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container border border-outline-variant rounded-2xl focus:border-primary outline-none text-sm transition-all shadow-inner"
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container border border-outline-variant rounded-2xl focus:border-primary outline-none text-sm transition-all shadow-inner"
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                className="w-full py-4.5 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 transition-all uppercase tracking-[0.2em] text-xs mt-2 shadow-xl shadow-secondary/20 flex items-center justify-center gap-2"
              >
                {loading ? "Đang cập nhật..." : <><CheckCircle2 className="w-4 h-4" /> Hoàn tất đổi mật khẩu</>}
              </button>
            </form>
          )}

          <div className="mt-12 pt-6 border-t border-outline-variant text-center">
            <Link to="/login" className="text-[10px] font-black text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.2em]">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-[9px] text-on-surface-variant uppercase tracking-[0.4em] opacity-40 font-bold">
        © 2026 KPM MATERIALS INDUSTRIAL SOLUTION
      </footer>
    </div>
  );
};

export default ForgotPassword;