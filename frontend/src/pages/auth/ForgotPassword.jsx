import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Factory, Mail, ShieldCheck, Lock, Send, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth.service';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Xác thực Email/OTP, 2: Đặt lại mật khẩu
  const [isOtpEnabled, setIsOtpEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State quản lý 6 ô OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]); 

  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

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
      alert("Vui lòng nhập email hệ thống!");
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword({ email: formData.email });
      setLoading(false);
      setIsOtpEnabled(true);
      alert("Mã xác thực đã được gửi! Vui lòng kiểm tra email của bạn.");
    } catch (error) {
      setLoading(false);
      alert(error.response?.data?.message || "Không thể gửi mã. Vui lòng kiểm tra email và thử lại.");
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      setStep(2);
    } else {
      alert("Vui lòng nhập đủ mã xác thực!");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không trùng khớp!");
      return;
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
      alert("Mật khẩu đã được thay đổi thành công!");
      navigate('/login');
    } catch (error) {
      setLoading(false);
      alert(error.response?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans selection:bg-primary/20">
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