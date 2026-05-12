import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, ShieldCheck, Edit3, Save, X, Lock, MessageCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState({
    username: '', email: '', role: '',
    firstName: '', middleName: '', lastName: '',
    phoneNumber: '', address: '', zaloNumber: '',
  });

  const hydrateFromBackend = (payload) => {
    const backendUser = payload?.user || {};
    const backendProfile = payload?.profile || {};
    setUser({
      username: backendUser.username || '',
      email: backendUser.email || '',
      role: backendUser.role || '',
      firstName: backendProfile.firstName || backendUser.firstName || '',
      middleName: backendProfile.middleName || backendUser.middleName || '',
      lastName: backendProfile.lastName || backendUser.lastName || '',
      phoneNumber: backendProfile.phoneNumber || backendUser.phoneNumber || '',
      address: backendProfile.address || backendUser.address || '',
      zaloNumber: backendProfile.zaloNumber || backendUser.zaloNumber || '',
    });
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) { navigate('/login'); return; }
      try {
        const response = await authService.getMe();
        hydrateFromBackend(response.data?.data);
      } catch (error) {
        if (error?.response?.status === 401) navigate('/login');
        setErrorMessage('Không thể tải dữ liệu.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadCurrentUser();
  }, [navigate]);

  const handleChange = (field) => (event) => {
    setUser((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      const payload = {
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        address: user.address,
        zaloNumber: user.zaloNumber,
      };
      await authService.updateProfile(payload);
      setMessage('Cập nhật hồ sơ thành công!');
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Lỗi cập nhật.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {initialLoading ? (
          <div className="p-8 bg-white rounded-3xl border border-outline-variant animate-pulse font-bold text-primary">
            Đang đồng bộ dữ liệu KPM...
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight italic">Hồ sơ cá nhân</h1>
                <p className="text-sm text-on-surface-variant font-medium">Hệ thống quản lý thông tin KPM Industrial</p>
              </div>
              
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                  <Edit3 className="w-4 h-4" /> Chỉnh sửa hồ sơ
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-surface-container text-on-surface-variant text-xs font-black uppercase tracking-widest rounded-xl hover:bg-outline-variant transition-all">Hủy bỏ</button>
                  <button type="submit" form="profile-form" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
                    <Save className="w-4 h-4" /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* CỘT TRÁI: THÔNG TIN TỔNG QUAN */}
              <div className="bg-white border border-outline-variant rounded-3xl p-8 flex flex-col items-center text-center shadow-sm h-fit">
                <div className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-6">
                  <User className="w-14 h-14 text-primary" />
                </div>
                
                <h2 className="text-xl font-black text-on-surface uppercase tracking-tighter italic leading-tight">
                  {user.lastName} {user.middleName} {user.firstName}
                </h2>
                
                {/* HIỂN THỊ EMAIL Ở ĐÂY */}
                <div className="mt-2 flex items-center gap-2 text-on-surface-variant/70 text-xs font-bold">
                  <Mail className="w-3 h-3" />
                  <span>{user.email}</span>
                </div>

                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-4 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
                  Thành viên KPM
                </span>

                <div className="w-full h-px bg-outline-variant/50 my-6"></div>
                
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-xl border border-green-100 text-[11px] font-bold text-green-700">
                    <ShieldCheck className="w-4 h-4" /> Email đã xác thực
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: CHI TIẾT HỒ SƠ */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm">
                  {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl animate-in fade-in flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> {message}</div>}
                  {errorMessage && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">{errorMessage}</div>}

                  <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HỌ TÊN */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Họ</label>
                      <input type="text" value={user.lastName} onChange={handleChange('lastName')} readOnly={!isEditing} className={`px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? 'bg-white border-primary shadow-sm' : 'bg-surface-container border-transparent'}`} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Tên đệm</label>
                      <input type="text" value={user.middleName} onChange={handleChange('middleName')} readOnly={!isEditing} className={`px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? 'bg-white border-primary shadow-sm' : 'bg-surface-container border-transparent'}`} />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Tên chính</label>
                      <input type="text" value={user.firstName} onChange={handleChange('firstName')} readOnly={!isEditing} className={`px-4 py-3 border rounded-xl outline-none text-sm font-black transition-all ${isEditing ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface-container border-transparent font-bold'}`} />
                    </div>

                    {/* LIÊN HỆ */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Email đăng ký</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                        <input type="email" value={user.email} disabled className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border-transparent rounded-xl text-sm font-bold opacity-50 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                        <input type="tel" value={user.phoneNumber} disabled className="w-full pl-11 pr-10 py-3 bg-surface-container-highest border-transparent rounded-xl text-sm font-bold opacity-50 cursor-not-allowed" />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant/40" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Số Zalo (Để nhận thông báo đơn hàng)</label>
                      <div className="relative">
                        <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                        <input type="text" value={user.zaloNumber} onChange={handleChange('zaloNumber')} readOnly={!isEditing} placeholder="Nhập số Zalo của bạn..." className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? 'bg-white border-primary shadow-sm' : 'bg-surface-container border-transparent'}`} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">Địa chỉ giao hàng</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                        <input type="text" value={user.address} onChange={handleChange('address')} readOnly={!isEditing} className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none text-sm font-medium transition-all ${isEditing ? 'bg-white border-primary shadow-sm' : 'bg-surface-container border-transparent'}`} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;