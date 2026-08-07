import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Edit3,
  Save,
  MessageCircle,
  Lock,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import AddressSelect from "../../components/common/AddressSelect";
const ProfileTab = ({
  user,
  setUser,
  isEditing,
  setIsEditing,
  message,
  setMessage,
  errorMessage,
  setErrorMessage,
  setLoading,
  loading,
}) => {
  const handleChange = (field) => (event) => {
    setUser((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");
    try {
      if (user.zaloNumber) {
        const cleanZalo = user.zaloNumber.replace(/[\s\-\+]/g, '');
        if (!/^0\d{9}$/.test(cleanZalo)) {
          setErrorMessage("Số Zalo không hợp lệ! Vui lòng nhập đúng 10 chữ số và bắt đầu bằng số 0.");
          setLoading(false);
          return;
        }
      }

      const payload = {
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        address: user.address,
        zaloNumber: user.zaloNumber,
      };
      await authService.updateProfile(payload);
      setMessage("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Lỗi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
      {/* CỘT TRÁI: THÔNG TIN TỔNG QUAN */}
      <div className="bg-white border border-outline-variant rounded-3xl p-8 flex flex-col items-center text-center shadow-sm h-fit">
        <div className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-6">
          <User className="w-14 h-14 text-primary" />
        </div>

        <h2 className="text-xl font-black text-on-surface uppercase tracking-tighter italic leading-tight">
          {user.lastName} {user.middleName} {user.firstName}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-on-surface-variant/70 text-xs font-bold">
          <Mail className="w-3 h-3" />
          <span>{user.email}</span>
        </div>

        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-4 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
          Khách hàng KPM
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-on-surface uppercase italic">
              Thông tin cá nhân
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <Edit3 className="w-3 h-3" /> Cập nhật
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-outline-variant transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                >
                  <Save className="w-3 h-3" />{" "}
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl animate-in fade-in flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {message}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
              {errorMessage}
            </div>
          )}

          <form
            id="profile-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Họ
              </label>
              <input
                type="text"
                value={user.lastName}
                onChange={handleChange("lastName")}
                readOnly={!isEditing}
                className={`px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? "bg-white border-primary shadow-sm" : "bg-surface-container border-transparent"}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Tên đệm
              </label>
              <input
                type="text"
                value={user.middleName}
                onChange={handleChange("middleName")}
                readOnly={!isEditing}
                className={`px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? "bg-white border-primary shadow-sm" : "bg-surface-container border-transparent"}`}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">
                Tên chính
              </label>
              <input
                type="text"
                value={user.firstName}
                onChange={handleChange("firstName")}
                readOnly={!isEditing}
                className={`px-4 py-3 border rounded-xl outline-none text-sm font-black transition-all ${isEditing ? "bg-primary/5 border-primary shadow-sm" : "bg-surface-container border-transparent font-bold"}`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Email đăng ký
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border-transparent rounded-xl text-sm font-bold opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input
                  type="tel"
                  value={user.phoneNumber}
                  disabled
                  className="w-full pl-11 pr-10 py-3 bg-surface-container-highest border-transparent rounded-xl text-sm font-bold opacity-50 cursor-not-allowed"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant/40" />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Số Zalo (Để nhận thông báo đơn hàng)
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  value={user.zaloNumber}
                  onChange={handleChange("zaloNumber")}
                  readOnly={!isEditing}
                  placeholder="Nhập số Zalo của bạn..."
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none text-sm font-bold transition-all ${isEditing ? "bg-white border-primary shadow-sm" : "bg-surface-container border-transparent"}`}
                />
              </div>
            </div>

            {/* Đổi đoạn gọi <AddressSelect> cũ thành đoạn này */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest ml-1 opacity-60">
                Địa chỉ giao hàng (Tự động điền khi thanh toán)
              </label>
              <AddressSelect
                disabled={!isEditing}
                value={user.address}
                onChange={(fullAddress) =>
                  setUser({ ...user, address: fullAddress })
                }
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
