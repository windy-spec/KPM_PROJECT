import React, { useEffect, useMemo, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Loader2, Pencil, Shield, 
  Search, Users, CircleDot, ShieldBan, X
} from 'lucide-react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import { showError, showSuccess } from '../../utils/notify';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Phân trang chuẩn từ Server
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Quản lý trạng thái Modal Chỉnh sửa
  const [editingUser, setEditingUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [form, setForm] = useState({
    role_name: '',
    nickname: '',
    is_active: true
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
        // Gọi qua adminService thay vì axios trực tiếp
        const response = await adminService.getUsersForAdmin({
        page,
        limit: 10,
        search: searchQuery
        });
        
        // Kiểm tra cấu trúc dữ liệu trả về từ backend
        setUsers(response.data.data); 
        setTotal(response.data.pagination.totalItem);
    } catch (error) {
        console.error("Lỗi đồng bộ danh sách Admin:", error);
        showError("Không thể tải danh sách người dùng.");
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadUsers(1, searchQuery);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({
      role_name: user.roles?.role_name || 'USER',
      nickname: user.user_profiles?.nickname || '',
      is_active: user.is_active ?? true
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      // Gửi role_name thay vì role_id để backend tự map UUID
      await adminService.adminUpdateUser(editingUser.id, {
        role_name: form.role_name,
        nickname: form.nickname,
        is_active: form.is_active
      });
      
      showSuccess("Cập nhật phân quyền và trạng thái thành công!");
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      showError(err.response?.data?.message || "Cập nhật tài khoản thất bại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Tính toán trạng thái Online (Giả định: Có tương tác trong 30 phút qua)
  const isOnline = (lastLoginAt) => {
    if (!lastLoginAt) return false;
    const diff = Date.now() - new Date(lastLoginAt).getTime();
    return diff < 30 * 60 * 1000;
  };

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit) || 1;

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push('...');
      }
    }
    const uniquePages = pages.filter((p, index, arr) => p !== '...' || arr[index - 1] !== '...');

    return uniquePages.map((p, index) => (
      p === '...' ? (
        <span key={`dots-${index}`} className="px-2 text-on-surface-variant/50">...</span>
      ) : (
        <button
          key={p}
          type="button"
          onClick={() => setPage(p)}
          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
            page === p
              ? 'bg-primary text-white font-black'
              : 'border border-outline-variant/60 hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          {p}
        </button>
      )
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">Quản lý thành viên</h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {total} Tài khoản
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="relative hidden sm:block w-[200px] md:w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tài khoản, email, SĐT..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Tìm kiếm</span>
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[70px]">STT</th>
                <th className="p-4">Thông tin tài khoản</th>
                <th className="p-4 w-[140px]">Vai trò</th>
                <th className="p-4 w-[160px]">Hoạt động</th>
                <th className="p-4 w-[160px]">Ngày gia nhập</th>
                <th className="p-4 pr-6 text-center w-[100px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {users.map((user, idx) => {
                const userOnline = isOnline(user.last_login_at);
                const isBanned = !user.is_active;

                return (
                  <tr key={user.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                      {(page - 1) * limit + idx + 1 < 10 ? `0${(page - 1) * limit + idx + 1}` : (page - 1) * limit + idx + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full border border-outline-variant/50 bg-surface-container/40 flex items-center justify-center overflow-hidden">
                          <Users className="w-5 h-5 text-on-surface-variant/45" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-on-surface flex items-center gap-2">
                            {user.username}
                            {isBanned && (
                              <span className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-700">
                                Bị khóa
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant/60 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] ${
                        user.roles?.role_name === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <Shield className="w-3 h-3" /> {user.roles?.role_name || 'USER'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <CircleDot className={`w-3.5 h-3.5 ${userOnline ? 'text-emerald-500' : 'text-on-surface-variant/40'}`} />
                        <span className={`text-[11px] font-bold ${userOnline ? 'text-emerald-600' : 'text-on-surface-variant/60'}`}>
                          {userOnline ? 'Đang Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant/50 mt-1">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                      </div>
                    </td>

                    <td className="p-4 text-[12px] text-on-surface-variant/70 font-medium">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Không rõ'}
                    </td>

                    <td className="p-4 pr-6 text-center">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="h-8 w-8 rounded-lg border border-outline-variant/60 inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                        title="Thiết lập tài khoản"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant/60">
                    Không tìm thấy thành viên hệ thống nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="border-t border-outline-variant/40 px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị {pageStart} - {pageEnd} trên tổng số {total} tài khoản
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {renderPageNumbers()}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL POPUP THAY ĐỔI VAI TRÒ VÀ TRẠNG THÁI */}
      {editingUser && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-[26px] border border-outline-variant/60 shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-black text-sm uppercase tracking-[0.1em] text-on-surface">Thiết lập tài khoản</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant mb-2">Đang chỉnh sửa</label>
                  <input type="text" value={editingUser.username} disabled className="w-full h-10 px-4 text-xs bg-surface-container/30 border border-outline-variant/40 rounded-xl text-on-surface-variant/70 cursor-not-allowed font-bold" />
                </div>

                <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant mb-2">Cấp bậc quyền hạn (Role)</label>
                    <select 
                        value={form.role_name}
                        onChange={e => setForm({ ...form, role_name: e.target.value })}
                        className="w-full h-11 px-4 text-sm bg-white border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary font-bold text-on-surface"
                    >
                        <option value="USER">👥 Người dùng cơ bản (USER)</option>
                        <option value="ADMIN">👑 Quản trị viên hệ thống (ADMIN)</option>
                    </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-on-surface-variant mb-3">Trạng thái đăng nhập</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border cursor-pointer transition-all ${form.is_active ? 'border-emerald-500 bg-emerald-50' : 'border-outline-variant/40 hover:bg-surface-container'}`}>
                      <input 
                        type="radio" 
                        name="accountStatus"
                        checked={form.is_active === true} 
                        onChange={() => setForm({ ...form, is_active: true })}
                        className="hidden"
                      />
                      <CircleDot className={`w-4 h-4 ${form.is_active ? 'text-emerald-600' : 'text-on-surface-variant/50'}`} />
                      <span className={`text-xs font-bold ${form.is_active ? 'text-emerald-700' : 'text-on-surface-variant'}`}>Cho phép</span>
                    </label>

                    <label className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border cursor-pointer transition-all ${!form.is_active ? 'border-rose-500 bg-rose-50' : 'border-outline-variant/40 hover:bg-surface-container'}`}>
                      <input 
                        type="radio" 
                        name="accountStatus"
                        checked={form.is_active === false} 
                        onChange={() => setForm({ ...form, is_active: false })}
                        className="hidden"
                      />
                      <ShieldBan className={`w-4 h-4 ${!form.is_active ? 'text-rose-600' : 'text-on-surface-variant/50'}`} />
                      <span className={`text-xs font-bold ${!form.is_active ? 'text-rose-700' : 'text-on-surface-variant'}`}>Khóa tài khoản</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-5 border-t border-outline-variant/40 mt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="h-10 px-5 text-xs font-bold rounded-xl border border-outline-variant/60 hover:bg-surface-container transition-colors">Hủy bỏ</button>
                  <button type="submit" disabled={submitLoading} className="h-10 px-6 text-xs font-black uppercase tracking-[0.1em] bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70">
                    {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
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