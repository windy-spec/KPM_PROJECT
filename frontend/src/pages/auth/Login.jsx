import React, { useEffect, useRef, useState } from 'react';
import Portal from '../../components/common/Portal';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, Mail, Lock, Eye, EyeOff, LogIn, BadgeCheck } from 'lucide-react';
import { authService } from '../../services/auth.service';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const clearFieldError = (fieldName) => {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: '',
    }));
    setErrorMessage('');
  };

  const setLoginFieldErrors = (nextErrors) => {
    setFieldErrors({
      username: nextErrors.username || '',
      password: nextErrors.password || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setFieldErrors({ username: '', password: '' });

    try {
      const response = await authService.login({
        username: formData.username,
        password: formData.password,
      });

      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setSuccessMessage('Đăng nhập thành công! Đang chuyển bạn về trang chủ...');
      setCountdown(2);
      setShowSuccessOverlay(true);

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
            navigate('/');
            return 0;
          }

          return currentCountdown - 1;
        });
      }, 1000);
    } catch (error) {
      const message = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';

      if (/tài khoản không tồn tại|không tồn tại|username/i.test(message)) {
        setLoginFieldErrors({ username: message });
      } else if (/mật khẩu|password|chưa được xác thực email|xác thực email/i.test(message)) {
        setLoginFieldErrors({ password: message });
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
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
                  <BadgeCheck className="h-10 w-10" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">Thành công</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Đăng nhập hoàn tất</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {successMessage}
                </p>
                <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Hệ thống sẽ tự động chuyển sang trang chủ sau {countdown} giây.
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Header tối giản */}
      <header className="px-6 md:px-10 py-5 flex justify-between items-center bg-white border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Factory className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black text-primary tracking-tighteruppercase">KPM</span>
        </div>
        <Link to="/" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5">
            Quay lại trang chủ
        </Link>
      </header>

      {/* Khu vực nội dung chính */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-surface">
        {/* KHUNG LỚN CHỨA 2 PHẦN - Tăng max-w lên để đủ chỗ cho 2 cột */}
        <div className="w-full max-w-[1000px] bg-white border border-outline-variant rounded-3xl shadow-lg flex overflow-hidden min-h-[600px]">
          
          {/* --- PHẦN BÊN TRÁI: FORM ĐĂNG NHẬP --- */}
          <div className="flex-1 p-8 md:p-14 flex flex-col justify-center">
            {/* Tiêu đề gọn gàng hơn */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight">Đăng nhập</h1>
              <p className="text-xs text-on-surface-variant mt-2.5 font-bold uppercase tracking-widest opacity-80">
                Hệ thống quản lý KPM Materials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Nhập Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.2em] ml-1">
                  Tên tài khoản
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="ten_tai_khoan"
                    className={`w-full pl-12 pr-4 py-3.5 bg-surface-container border rounded-xl focus:bg-white outline-none text-sm transition-all shadow-inner ${fieldErrors.username ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-outline-variant focus:border-primary'}`}
                    onChange={(e) => {
                      setFormData({...formData, username: e.target.value});
                      clearFieldError('username');
                    }}
                    required
                  />
                </div>
                {fieldErrors.username ? (
                  <p className="ml-1 text-xs font-medium text-rose-700">
                    {fieldErrors.username}
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {/* Nhập Mật khẩu */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-[0.2em] ml-1">
                    Mật khẩu
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 bg-surface-container border rounded-xl focus:bg-white outline-none text-sm transition-all shadow-inner ${fieldErrors.password ? 'border-rose-400 focus:border-rose-500 bg-rose-50' : 'border-outline-variant focus:border-primary'}`}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      clearFieldError('password');
                    }}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="ml-1 text-xs font-medium text-rose-700">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              {/* Ghi nhớ đăng nhập */}
              <div className="flex items-center gap-2.5 px-1 mt-1">
                <input type="checkbox" id="remember" className="w-4.5 h-4.5 accent-primary cursor-pointer rounded border-outline-variant" />
                <label htmlFor="remember" className="text-xs font-medium text-on-surface-variant cursor-pointer select-none">
                  Duy trì trạng thái đăng nhập
                </label>
              </div>

              {/* Nút Submit - Bo góc tròn hơn */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-black rounded-xl flex items-center justify-center gap-2.5 hover:bg-primary-container transition-all uppercase tracking-[0.15em] text-xs shadow-lg shadow-primary/20 cursor-pointer active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'} <LogIn className="w-4 h-4" />
              </button>
            </form>

            {/* Social Logins - Giữ nguyên nhưng thu gọn gap */}
            <div className="mt-10 flex flex-col gap-5">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/60"></div>
                </div>
                <span className="relative px-4 bg-white text-[9px] text-on-surface-variant font-black uppercase tracking-[0.3em]">Hoặc dùng</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button className="flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-xl hover:bg-surface hover:border-outline transition-all text-xs font-bold text-on-surface-variant cursor-pointer active:bg-white">
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
                  Google
                </button>
              </div>
            </div>

            {/* Footer Card - Quên mật khẩu/Đăng ký */}
            <div className="mt-12 flex flex-col gap-3.5 text-center border-t border-outline-variant/60 pt-8">
              <p className="text-xs text-on-surface-variant font-medium">
                Chưa có tài khoản thành viên?{' '}
                <Link to="/register" className="text-primary font-black hover:underline tracking-tight">Đăng ký ngay</Link>
              </p>
              <Link 
                to="/forgot-password" 
                className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors italic opacity-80"
              >
                Bạn lỡ quên mật khẩu?
              </Link>
            </div>
          </div>

          {/* --- PHẦN BÊN PHẢI: Ô CHỨA HÌNH ẢNH --- */}
          {/* Ẩn trên màn hình nhỏ, hiện trên md trở lên */}
          <div className="flex-1 hidden md:block relative bg-surface-container-highest">
            {/* Bo góc nội dung bên trong cho mượt */}
            <div className="absolute inset-4 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center p-10 text-center">
              
              {/* ĐÂY LÀ CHỖ SẼ THÊM HÌNH */}
              {/* Ví dụ: <img src="/path/to/your/iron-structure.jpg" className="absolute inset-0 w-full h-full object-cover" /> */}
              
              {/* Placeholder tạm thời */}
              <Factory className="w-20 h-20 text-primary opacity-20 mb-6" />
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight opacity-40">KPM Industrial</h2>
              <p className="text-xs font-medium text-on-surface-variant opacity-40 mt-2 max-w-sm">
                Nền tảng cung ứng và quản lý vật liệu cơ khí chính xác. Giải pháp toàn diện cho mọi công trình.
              </p>
              
            </div>
          </div>

        </div>
      </main>

      {/* Footer cuối trang */}
      <footer className="py-6 text-center text-[9px] text-on-surface-variant uppercase tracking-[0.3em] opacity-50 font-bold">
        © 2026 KPM INDUSTRIAL SOLUTIONS • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};

export default Login;