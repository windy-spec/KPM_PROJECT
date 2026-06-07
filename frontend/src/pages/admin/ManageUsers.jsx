import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, Shield, UserX, UserCheck, Search, ShieldAlert, X } from 'lucide-react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import Pagination from '../../components/common/Pagination';
import { showError, showSuccess } from '../../utils/notify';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // State xử lý Modal Chỉnh sửa
  const [editingUser, setEditingUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({
    role_id: '',
    nickname: '',
    is_active: true
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsersForAdmin();
      // Thường backend trả về mảng user ở res.data.data hoặc res.data
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      showError("Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Mở modal chỉnh sửa và nạp data cũ vào form
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({
      role_id: user.role_id || '',
      nickname: user.user_profiles?.nickname || user.user_profiles?.first_name || '',
      is_active: user.is_active ?? true
    });
  };

  // Gửi lệnh cập nhật lên Server
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await adminService.adminUpdateUser(editingUser.id, form);
      showSuccess("Cập nhật tài khoản thành công!");
      setEditingUser(null);
      loadUsers(); // Tải lại danh sách mới
    } catch (err) {
      showError(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Bộ lọc tìm kiếm theo tên hoặc username tại Client
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_profiles?.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Tính toán phân trang mượt mà
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  return (
    <div className="p-6 bg-surface-container/10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-on-surface flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> Quản Lý Thành Viên Hệ Thống
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-1">Thay đổi cấp quyền quản trị, biệt danh hiển thị và trạng thái vận hành tài khoản.</p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Tìm tài khoản, tên, email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 h-9 text-xs rounded-xl border border-outline-variant/60 bg-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/40 text-on-surface-variant text-[11px] font-black uppercase tracking-wider">
                  <th className="px-6 py-3.5">Tài khoản (Username)</th>
                  <th className="px-6 py-3.5">Biệt danh / Nickname</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Vai trò (Role)</th>
                  <th className="px-6 py-3.5">Trạng thái hoạt động</th>
                  <th className="px-6 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface">
                {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">{user.username}</td>
                    <td className="px-6 py-4 italic text-on-surface/80">{user.user_profiles?.nickname || user.user_profiles?.first_name || '-'}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        user.roles?.role_name === 'ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <Shield className="w-3 h-3" /> {user.roles?.role_name || 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold"><UserCheck className="w-4 h-4" /> Đang hoạt động</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 font-bold"><UserX className="w-4 h-4" /> Đang bị khóa</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="h-8 w-8 rounded-lg border border-outline-variant/60 inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                        title="Chỉnh sửa quyền hạn"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-10 text-on-surface-variant/60 font-medium">Không tìm thấy thành viên nào phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Phân trang component dùng chung */}
          <div className="px-6 py-4 border-t border-outline-variant/40 flex justify-end">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* 🛠️ MODAL POPUP: CHỈ CHO ĐỔI BIỆT DANH, ROLE, TRẠNG THÁI */}
      {editingUser && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low">
                <h3 className="font-black text-sm text-on-surface flex items-center gap-2">Phân Quyền & Cấu Hình Thành Viên</h3>
                <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* 🔒 KHÓA CỨNG: Username */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-on-surface-variant mb-1">Tài khoản đăng nhập (Cố định)</label>
                  <input type="text" value={editingUser.username} disabled className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface-variant/70 cursor-not-allowed font-bold" />
                </div>

                {/* 🔒 KHÓA CỨNG: Email */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-on-surface-variant mb-1">Địa chỉ Email (Cố định)</label>
                  <input type="text" value={editingUser.email} disabled className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant/40 rounded-xl text-on-surface-variant/70 cursor-not-allowed" />
                </div>

                <hr className="border-outline-variant/30" />

                {/* ✏️ ĐƯỢC SỬA: Biệt danh */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-on-surface-variant mb-1">Biệt danh hệ thống / Nickname</label>
                  <input 
                    type="text" 
                    value={form.nickname} 
                    onChange={e => setForm({...form, nickname: e.target.value})}
                    placeholder="Nhập biệt danh riêng biệt cho user..."
                    className="w-full h-10 px-3 text-xs bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-bold" 
                  />
                </div>

                {/* ✏️ ĐƯỢC SỬA: Vai trò hệ thống */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-on-surface-variant mb-1">Cấp bậc vai trò (Role)</label>
                  <select 
                    value={form.role_id}
                    onChange={e => setForm({...form, role_id: e.target.value})}
                    className="w-full h-10 px-3 text-xs bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary font-black text-primary"
                  >
                    {/* Thay id tương ứng với ID bảng Role trong DB của ông */}
                    <option value="ID_CỦA_ROLE_USER_TRONG_DB">👥 USER (Thành viên thông thường)</option>
                    <option value="ID_CỦA_ROLE_ADMIN_TRONG_DB">👑 ADMIN (Quản trị viên tối cao)</option>
                  </select>
                </div>

                {/* ✏️ ĐƯỢC SỬA: Trạng thái hoạt động */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-on-surface-variant mb-2">Trạng thái vận hành tài khoản</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={form.is_active === true} 
                        onChange={() => setForm({...form, is_active: true})}
                        className="accent-emerald-600 h-4 w-4"
                      />
                      Kích hoạt (Active)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-rose-500 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={form.is_active === false} 
                        onChange={() => setForm({...form, is_active: false})}
                        className="accent-rose-500 h-4 w-4"
                      />
                      Khóa tài khoản (Banned)
                    </label>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="h-10 px-4 text-xs font-bold rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="h-10 px-5 text-xs font-black bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                  >
                    {submitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Lưu cấu hình
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}