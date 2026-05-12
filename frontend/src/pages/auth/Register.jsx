import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, Mail, Lock, Eye, EyeOff, UserPlus, Phone, User, ShieldCheck, CheckCircle2, ArrowRight, Send, CircleAlert, Sparkles, BadgeCheck } from 'lucide-react';
import { authService } from '../../services/auth.service';
import Portal from '../../components/common/Portal';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false); // Chuyển đổi giữa Form và Verify
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [strengthConfirm, setStrengthConfirm] = useState(0);

  // State OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const redirectTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const draftStorageKey = 'kpm-register-draft';

  const [formData, setFormData] = useState({
    lastName: '', middleName: '', firstName: '',
    email: '', phoneNumber: '', username: '',
    password: '', confirmPassword: ''
  });

  // --- LOGIC OTP ---
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- LOGIC ĐỘ MẠNH MẬT KHẨU ---
  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  useEffect(() => {
    setStrength(calculateStrength(formData.password));
  }, [formData.password]);

  useEffect(() => {
    setStrengthConfirm(calculateStrength(formData.confirmPassword));
  }, [formData.confirmPassword]);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(draftStorageKey);

    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData((currentFormData) => ({
          ...currentFormData,
          ...parsedDraft,
        }));
      } catch {
        sessionStorage.removeItem(draftStorageKey);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(draftStorageKey, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      failNetwork('Thông tin đang được giữ tạm trên trình duyệt. Khi có mạng lại, bạn có thể bấm gửi tiếp.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const getStrengthUI = (score) => {
    if (score === 0) return { label: 'Rất yếu', color: 'bg-outline-variant', width: '5%' };
    if (score === 1) return { label: 'Yếu', color: 'bg-red-500', width: '25%' };
    if (score === 2) return { label: 'Trung bình', color: 'bg-yellow-500', width: '50%' };
    if (score === 3) return { label: 'Mạnh', color: 'bg-blue-500', width: '75%' };
    return { label: 'Rất mạnh', color: 'bg-green-500', width: '100%' };
  };

  // --- VALIDATION FUNCTIONS ---
  const isValidName = (name) => /^[a-zA-ZÀ-ỿ\s\-]+$/.test(name.trim());

  const isValidPhoneVN = (phone) => /^0\d{9}$/.test(phone);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username);

  const showRegisterToast = (variant, title, description) => {
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

    return toast(({ closeToast }) => (
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
      autoClose: 3800,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      icon: false,
      className: 'register-toast',
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
        minHeight: 'unset',
      },
    });
  };

  const failRegister = (message) => {
    setErrorMessage(message);
    showRegisterToast('error', 'Thông tin chưa hợp lệ', message);
  };

  const failNetwork = (message) => {
    setErrorMessage(message);
    showRegisterToast('error', 'Không có kết nối mạng', message);
  };

  // --- INPUT FILTER FUNCTIONS ---
  const handleNameInput = (value) => {
    // Allow all letters (including Vietnamese), spaces, and hyphens while keeping multi-word names usable
    return value.replace(/[^a-zA-ZÀ-ỿ\s\-]/g, '').replace(/\s{2,}/g, ' ');
  };

  const handlePhoneInput = (value) => {
    // Only allow digits
    return value.replace(/[^\d]/g, '').slice(0, 10);
  };

  const handleUsernameInput = (value) => {
    // Only allow letters, numbers, and underscore
    return value.replace(/[^a-zA-Z0-9_]/g, '');
  };

  // --- XỬ LÝ SUBMIT ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      return failNetwork('Bạn đang mất mạng. Dữ liệu đã được giữ tạm, hãy kết nối lại rồi thử đăng ký tiếp.');
    }

    // Validate name fields - chỉ chữ
    if (!formData.lastName.trim()) {
      return failRegister('Vui lòng nhập họ!');
    }
    if (!isValidName(formData.lastName)) {
      return failRegister('Họ chỉ được phép chứa chữ!');
    }

    // Tên đệm là optional - chỉ validate nếu người dùng nhập
    if (formData.middleName.trim() && !isValidName(formData.middleName)) {
      return failRegister('Tên đệm chỉ được phép chứa chữ!');
    }

    if (!formData.firstName.trim()) {
      return failRegister('Vui lòng nhập tên!');
    }
    if (!isValidName(formData.firstName)) {
      return failRegister('Tên chỉ được phép chứa chữ!');
    }

    // Validate email
    if (!formData.email.trim()) {
      return failRegister('Vui lòng nhập email!');
    }
    if (!isValidEmail(formData.email)) {
      return failRegister('Email không hợp lệ!');
    }

    // Validate phone - số điện thoại Việt Nam
    if (!formData.phoneNumber.trim()) {
      return failRegister('Vui lòng nhập số điện thoại!');
    }
    if (!isValidPhoneVN(formData.phoneNumber)) {
      return failRegister('Số điện thoại phải là 10 chữ số và bắt đầu từ 0!');
    }

    // Validate username - không ký tự đặc biệt
    if (!formData.username.trim()) {
      return failRegister('Vui lòng nhập username!');
    }
    if (!isValidUsername(formData.username)) {
      return failRegister('Username chỉ được phép chứa chữ, số và dấu gạch dưới (_)!');
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      return failRegister('Mật khẩu xác nhận không khớp!');
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      });

      setErrorMessage('');

      setIsRegistered(true);
    } catch (error) {
      let errorMsg = error?.response?.data?.message || error?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';

      if (errorMsg.includes('username') || errorMsg.includes('Unique constraint')) {
        errorMsg = 'Username hoặc email đã được sử dụng. Vui lòng thử thông tin khác.';
      }

      failRegister(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      return failNetwork('Bạn đang mất mạng. Hãy kết nối lại để xác nhận OTP.');
    }
    setLoading(true);
    setErrorMessage('');

    try {
      await authService.verifyOtp({
        email: formData.email,
        otpCode: otp.join(''),
      });

      setSuccessMessage('Xác nhận OTP thành công! Tài khoản của bạn đã được kích hoạt.');
      setCountdown(3);
      setShowSuccessOverlay(true);

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }

      sessionStorage.removeItem(draftStorageKey);

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
      failRegister(
        error?.response?.data?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!isOnline) {
      return failNetwork('Bạn đang mất mạng. Không thể gửi lại mã OTP lúc này.');
    }
    setLoading(true);
    setErrorMessage('');

    try {
      // Gửi yêu cầu forgot-password để resend OTP (backend sẽ gửi mã mới)
      await authService.forgotPassword({ email: formData.email });
      
      // Xóa OTP cũ
      setOtp(new Array(6).fill(""));
      
      setErrorMessage('');
      showRegisterToast(
        'info',
        'Đã gửi mã mới',
        'Một mã OTP mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.',
      );
    } catch (error) {
      failRegister(
        error?.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans selection:bg-primary/20">
      {showSuccessOverlay ? (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">Thành công</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Đăng ký hoàn tất</h2>
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
      ) : null}

      {!isOnline ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          Bạn đang offline. Thông tin đăng ký đã được giữ tạm trong trình duyệt.
        </div>
      ) : null}

      <header className="px-6 md:px-10 py-5 flex justify-between items-center bg-white border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Factory className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black text-primary tracking-tighter uppercase">KPM</span>
        </div>
        <Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
          Quay lại trang chủ
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-3 sm:p-4 md:p-8 bg-surface overflow-y-auto">
        <div className="w-full max-w-[1100px] bg-white border border-outline-variant rounded-3xl shadow-lg flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-8rem)] lg:min-h-[700px]">
          
          {/* PHẦN BÊN TRÁI: ILLUTRATION & TEXT */}
          <div className="flex-1 hidden lg:flex relative bg-surface-container-highest">
            <div className="w-full h-full p-6 sm:p-8 xl:p-10 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-white/30 backdrop-blur-md border border-white/20 flex flex-col justify-center gap-6 p-6 sm:p-8 xl:p-12">
                <div className="bg-primary w-12 h-1 rounded-full"></div>
                <h2 className="text-3xl xl:text-4xl font-black text-primary uppercase tracking-tighter leading-none">
                  {isRegistered ? "Chỉ còn một \n bước nữa" : "Gia nhập \n Hệ sinh thái KPM"}
                </h2>
                <p className="text-sm font-medium text-on-surface-variant max-w-sm leading-relaxed opacity-80 italic">
                  {isRegistered 
                    ? `Chúng tôi đã gửi mã xác thực đến email ${formData.email}. Vui lòng kiểm tra để kích hoạt tài khoản.` 
                    : "Trở thành một phần của cộng đồng cung ứng vật liệu công nghiệp hàng đầu Việt Nam."}
                </p>
                <div className="flex gap-4 opacity-40">
                    <Factory className="w-8 h-8" />
                    <ShieldCheck className="w-8 h-8" />
                    <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN BÊN PHẢI: FORM HOẶC OTP */}
          <div className="flex-[1.2] p-5 sm:p-6 md:p-12 overflow-visible lg:overflow-y-auto max-h-none lg:max-h-[85vh] flex flex-col justify-start lg:justify-center lg:min-h-[700px] scrollbar-hide">
            
            {!isRegistered ? (
              /* --- FORM ĐĂNG KÝ --- */
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight italic">Tạo tài khoản</h1>
                  <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-[0.2em] opacity-60">Thông tin đăng ký thành viên KPM</p>
                </div>

                {errorMessage ? (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <form onSubmit={handleRegister} className="flex flex-col gap-4 sm:gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Họ</label>
                      <input type="text" placeholder="Ví dụ: Nguyễn" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: handleNameInput(e.target.value)})} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-70">Tên đệm</label>
                      <input type="text" placeholder="Tuỳ chọn" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: handleNameInput(e.target.value)})} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Tên</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                      <input type="text" placeholder="Ví dụ: Văn A" className="w-full pl-12 pr-4 py-3.5 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm font-bold transition-all" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: handleNameInput(e.target.value)})} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Email</label>
                      <input type="email" placeholder="user@example.com" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Số điện thoại</label>
                      <input type="tel" placeholder="0xxxxxxxxx (10 chữ số)" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: handlePhoneInput(e.target.value)})} required />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-secondary tracking-widest ml-1 italic font-bold">Username</label>
                    <input type="text" placeholder="chỉ chứa a-z, 0-9, _" className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all font-medium" value={formData.username} onChange={(e) => setFormData({...formData, username: handleUsernameInput(e.target.value)})} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Mật khẩu</label>
                      <div className="relative group">
                        <input type={showPassword ? "text" : "password"} className="w-full px-4 py-3 pr-12 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="h-1 w-full bg-outline-variant rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${getStrengthUI(strength).color}`} style={{ width: getStrengthUI(strength).width }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1">Xác nhận</label>
                      <div className="relative group">
                        <input type={showConfirmPassword ? "text" : "password"} className="w-full px-4 py-3 pr-12 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:bg-white outline-none text-sm transition-all" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="h-1 w-full bg-outline-variant rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${getStrengthUI(strengthConfirm).color}`} style={{ width: getStrengthUI(strengthConfirm).width }}></div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4.5 bg-primary text-on-primary font-black rounded-xl hover:bg-primary-container transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 mt-4 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Đang xử lý..." : "Đăng ký thành viên"} <ArrowRight className="w-4 h-4 inline-block ml-1" />
                  </button>
                </form>
              </div>
            ) : (
              /* --- KHUNG XÁC NHẬN EMAIL (OTP) --- */
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface uppercase italic">Xác thực Email</h2>
                <p className="text-[11px] sm:text-xs text-on-surface-variant mt-2 mb-8 sm:mb-10 max-w-[260px] sm:max-w-[300px] leading-relaxed">
                  Vui lòng nhập mã OTP vừa được gửi đến <span className="font-bold text-primary">{formData.email}</span>
                </p>

                {errorMessage ? (
                  <div className="mb-5 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <form onSubmit={handleVerifyOTP} className="w-full flex flex-col gap-6 sm:gap-8">
                  {/* Cụm OTP Tổng (Tái sử dụng design cũ) */}
                  <div className="flex items-center bg-surface-container border-2 border-outline-variant rounded-2xl overflow-hidden focus-within:border-primary focus-within:bg-white transition-all shadow-sm mx-auto w-full max-w-full sm:max-w-sm">
                    {otp.map((data, index) => (
                      <React.Fragment key={index}>
                        <input
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          maxLength="1"
                          className="w-full h-12 sm:h-16 text-center text-2xl sm:text-3xl font-black bg-transparent outline-none text-primary"
                          value={data}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                        />
                        {index < 5 && <div className="w-px h-8 sm:h-10 bg-outline-variant/40 shrink-0"></div>}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex flex-col gap-4">
                    <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-on-primary font-black rounded-xl hover:bg-primary-container transition-all uppercase tracking-[0.2em] text-[11px] sm:text-xs shadow-xl shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? "Đang xác thực..." : "Xác nhận & Kích hoạt"}
                    </button>
                    <button type="button" onClick={handleResendOTP} disabled={loading} className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                      <Send className="w-3 h-3" /> Gửi lại mã xác thực
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-6 sm:mt-10 pt-5 sm:pt-8 border-t border-outline-variant/60 text-center">
              <p className="text-xs text-on-surface-variant font-medium">
                Đã có tài khoản hệ thống?{' '}
                <Link to="/login" className="text-primary font-black hover:underline tracking-tight">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-[9px] text-on-surface-variant uppercase tracking-[0.4em] opacity-40 font-bold">
        © 2026 KPM INDUSTRIAL PRECISION SOLUTIONS
      </footer>
    </div>
  );
};

export default Register;