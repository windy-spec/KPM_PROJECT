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

  // State dùng để ép component render lại mỗi phút nhằm cập nhật số phút Offline
  const [tick, setTick] = useState(0);
  
  const [form, setForm] = useState({
    role_name: '',
    nickname: '',
  });

  const loadUsers = async (isSilent = false) => {
    // Chỉ set loading quay quay nếu KHÔNG PHẢI là chạy ngầm (Silent)
    if (!isSilent) setLoading(true);
    try {
      // 1. Lấy danh sách user từ server
      const response = await adminService.getUsersForAdmin({
        page,
        limit: 10,
        search: searchQuery
      });
      
      let usersData = response.data?.data || [];

      // 2. Gọi API lấy logs để bù đắp và xác thực trạng thái online thực tế
      try {
        const logsResponse = await adminService.getUsersAccessLogs();
        const logs = logsResponse.data?.data || [];
        
        usersData = usersData.map(user => {
          // Tìm log của user này
          const userLog = logs.find(log => log.id === user.id);
          return {
            ...user,
            // Nếu tìm thấy log thì lấy last_login_at từ log, không thì giữ nguyên
            last_login_at: userLog ? userLog.last_login_at : user.last_login_at,
            // Đánh dấu true nếu user này có log hoạt động gần đây từ server trả về
            hasActiveLog: !!userLog 
          };
        });
      } catch (logErr) {
        console.error("Không thể lấy logs truy cập:", logErr);
      }

      setUsers(usersData);
      setTotal(response.data?.pagination?.totalItem || 0);
    } catch (error) {
      showError(error.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Quét realtime mỗi 4 giây
  useEffect(() => {
    // Lần đầu vào trang hoặc khi đổi trang/tìm kiếm thì hiện Loader quay quay như bình thường
    loadUsers(false);

    const interval = setInterval(() => {
      // Chạy ngầm sau mỗi 4 giây: cập nhật data im lặng tránh gây giật lag UI
      loadUsers(true); 
    }, 4000);

    return () => clearInterval(interval);
  }, [page, searchQuery]);

  const handleSearch = () => {
    setPage(1);
    loadUsers(false);
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
      await loadUsers(true);
    } catch (err) {
      showError(err.response?.data?.message || "Cập nhật tài khoản thất bại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Kiểm tra trạng thái dựa trên việc phản hồi log hoạt động từ server
  const isOnline = (user) => {
    // Bảo vệ nếu object user không hợp lệ hoặc chưa từng đăng nhập
    if (!user || !user.last_login_at) return false;
    
    // Nếu user không có log hoạt động trả về từ API access-logs -> Chắc chắn đã logout/offline
    if (!user.hasActiveLog) return false;
    
    // Nếu có log, check khoảng thời gian tương tác (15 phút) để đảm bảo tính thực tế
    const diff = Date.now() - new Date(user.last_login_at).getTime();
    return diff < 15 * 60 * 1000; 
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
                const userOnline = isOnline(user);

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
                          <div className="inline-flex items-center gap-1.5 font-bold text-sm text-on-surface">
                            <span>{user.username}</span>
                            {user.user_profiles?.nickname ? (
                              <span className="text-xs font-normal text-on-surface-variant/80 bg-surface-container-high px-2 py-0.5 rounded-md whitespace-nowrap">
                                ({user.user_profiles.nickname})
                              </span>
                            ) : null}
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
                          {userOnline ? (
                            'Đang hoạt động'
                          ) : (
                            (() => {
                              if (!user.last_login_at) return 'Chưa hoạt động';
                              
                              const diffMins = Math.floor((Date.now() - new Date(user.last_login_at).getTime()) / (60 * 1000));
                              
                              if (diffMins < 60) {
                                return `Offline ${diffMins} phút trước`;
                              } else if (diffMins < 1440) {
                                return `Offline ${Math.floor(diffMins / 60)} giờ trước`;
                              } else {
                                return `Offline ${Math.floor(diffMins / 1440)} ngày trước`;
                              }
                            })()
                          )}
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
                        <option value="USER">Người dùng cơ bản (USER)</option>
                        <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                    </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant/70">Biệt danh (Nickname)</label>
                  <input
                    type="text"
                    value={form.nickname || ''}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    placeholder="Nhập biệt danh cho thành viên..."
                    className="w-full h-11 px-4 text-sm bg-surface-container border border-outline-variant/60 rounded-xl focus:outline-none focus:border-primary transition-colors"
                  />
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