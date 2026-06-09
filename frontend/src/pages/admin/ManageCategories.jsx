import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import { showSuccess, showError } from '../../utils/notify';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Download,
  Filter,
  Plus,
  Search,
  Tag,
} from 'lucide-react';

const normalizeCategory = (item) => ({
  id: item.id || item._id || Math.random().toString(36).slice(2, 10),
  code: item.category_code || item.code || '-',
  name: item.category_name || item.name || item.title || 'Danh mục',
  description: item.description || '-',
  createdAt: item.created_at || item.createdAt || null,
  subCategories: item.sub_categories || [],
  isParent: item.parent_id === null || !item.parent_id,
});

// Giữ nguyên CategoryForm của bạn
const CategoryForm = ({ initial = {}, onCancel, onSave }) => {
  const [form, setForm] = useState({
    category_code: '',
    category_name: '',
    description: '',
    ...initial,
  });
  const isEditing = Boolean(initial.id);
  useEffect(() => { setForm((current) => ({ ...current, ...initial })); }, [initial]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial.id ? 'Sửa danh mục' : 'Tạo danh mục'}
              </h3>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/70">Dùng đúng mã và tên danh mục theo backend.</p>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Mã danh mục</label>
              <input
                value={form.category_code || ''}
                onChange={(e) => setForm({ ...form, category_code: e.target.value })}
                placeholder="VD: CAT-001"
                readOnly={isEditing}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${isEditing ? 'border-outline-variant/60 bg-surface-container/40 text-on-surface-variant cursor-not-allowed' : 'border-outline-variant/60 bg-surface-container/20 focus:border-primary'
                  }`}
              />
              {isEditing && <p className="text-[11px] text-on-surface-variant/60">Mã danh mục được giữ cố định khi sửa.</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Tên danh mục</label>
              <input value={form.category_name || ''} onChange={(e) => setForm({ ...form, category_name: e.target.value })} placeholder="VD: Cổng sắt CNC" className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Chú thích</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Chú thích ngắn về danh mục..." rows={4} className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
            <button type="button" onClick={onCancel} className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Hủy</button>
            <button type="button" onClick={() => onSave(form)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors">Lưu danh mục</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

const ManageCategories = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]); // Chứa danh sách cấu trúc cây gốc chưa làm phẳng
  const [expandedIds, setExpandedIds] = useState(new Set()); // Lưu các ID cha đang được mở dropdown
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getCategories();
      const data = res.data?.data || res.data || [];

      if (Array.isArray(data)) {
        // Chuẩn hóa cây danh mục ban đầu
        const normalized = data.map(cat => {
          const parent = normalizeCategory(cat);
          parent.subCategories = parent.subCategories.map(sub => ({
            ...normalizeCategory(sub),
            level: 1,
            parentName: parent.name
          }));
          return parent;
        });
        setItems(normalized);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.warn('Lỗi tải danh mục', e?.message || e);
      setItems([]);
      setError(e?.response?.data?.message || e?.message || 'Không tải được danh mục từ backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Hàm toggle trạng thái đóng mở của danh mục cha
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Xử lý Filter, Tìm kiếm & Dựng danh sách hàng hiển thị linh hoạt theo trạng thái Expand
  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    // Nếu người dùng đang tìm kiếm: tự động hiển thị phẳng toàn bộ kết quả phù hợp (bao gồm cả con)
    if (keyword) {
      const allFlat = [];
      items.forEach(cat => {
        allFlat.push({ ...cat, level: 0 });
        cat.subCategories.forEach(sub => allFlat.push(sub));
      });
      return allFlat.filter((item) => {
        const haystack = `${item.code} ${item.name} ${item.description}`.toLowerCase();
        return haystack.includes(keyword);
      });
    }

    // Nếu không tìm kiếm: Dựng danh sách theo cơ chế đóng/mở Tree
    const result = [];
    items.forEach((cat) => {
      result.push({ ...cat, level: 0 });
      // Nếu danh mục cha này đang nằm trong danh sách "Được Mở", push các con của nó ngay phía dưới
      if (expandedIds.has(cat.id) && cat.subCategories && cat.subCategories.length > 0) {
        cat.subCategories.forEach((sub) => {
          result.push(sub);
        });
      }
    });
    return result;
  }, [items, search, expandedIds]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return visibleItems.slice(startIndex, startIndex + pageSize);
  }, [visibleItems, page, totalPages]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const handleCreate = () => { setEditing(null); setShowForm(true); };

  const handleEdit = (item) => {
    setEditing({
      ...item,
      category_code: item.code || item.category_code || '',
      category_name: item.name || item.category_name || '',
      description: item.description === '-' ? '' : item.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    // Tìm trong items gốc
    const target = items.find((it) => it.id === id) || items.flatMap(it => it.subCategories).find(sub => sub.id === id);
    if (target && target.level === 0 && target.subCategories && target.subCategories.length > 0) {
      showError('Không thể xoá danh mục cha đang có danh mục con bên trong!');
      return;
    }
    setPendingDelete(target || { id });
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return setShowConfirmDelete(false);
    try {
      await adminService.deleteCategory(pendingDelete.id);
      setShowConfirmDelete(false);
      setPendingDelete(null);
      await load();
      showSuccess('Xoá danh mục thành công.');
    } catch (e) {
      showError('Xoá thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        category_code: form.category_code,
        category_name: form.category_name,
        description: form.description,
      };

      if (editing?.id) {
        await adminService.updateCategory(editing.id, payload);
      } else {
        await adminService.createCategory(payload);
      }

      setShowForm(false);
      await load();
      showSuccess(editing?.id ? 'Cập nhật danh mục thành công.' : 'Tạo danh mục thành công.');
    } catch (e) {
      showError('Lưu thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  // Đếm tổng số lượng danh mục thực tế (bao gồm cả con trong database)
  const totalRealItemsCount = useMemo(() => {
    return items.reduce((acc, cur) => acc + 1 + (cur.subCategories?.length || 0), 0);
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/60 bg-white shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-outline-variant/50 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
                Danh mục sản phẩm
              </h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {totalRealItemsCount} danh mục tổng
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/65">
              Nhấn vào tên danh mục cha có con để đóng hoặc mở rộng xem danh mục con.
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block w-[220px] md:w-[260px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/45" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã danh mục, tên..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={() => { setPage(1); load(); }}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-3.5 py-2 text-xs font-bold hover:bg-surface-container transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Tải lại</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm danh mục</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-outline-variant/40 bg-surface-container/10 px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm hover:bg-surface-container transition-colors"><Filter className="h-4 w-4" />Lọc nhanh</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm hover:bg-surface-container transition-colors"><Download className="h-4 w-4" />Xuất danh mục</button>
          </div>
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị dòng {pagedItems.length} / {visibleItems.length} (Đang xem cấu trúc phân cấp)
          </div>
        </div>

        {error && (
          <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[80px]">STT</th>
                <th className="p-4 w-[140px]">Mã danh mục</th>
                <th className="p-4">Tên danh mục</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4 w-[160px]">Ngày tạo</th>
                <th className="p-4 pr-6 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant/60">Đang tải danh mục từ backend...</td>
                </tr>
              )}

              {pagedItems.map((item, idx) => {
                const isParent = item.level === 0;
                const hasChildren = isParent && item.subCategories && item.subCategories.length > 0;
                const isExpanded = expandedIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${isParent
                      ? 'bg-surface-container/10 font-semibold hover:bg-surface-container/20'
                      : 'bg-white hover:bg-surface-container/10 italic-rows-style'
                      }`}
                  >
                    {/* STT */}
                    <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                      {((page - 1) * pageSize) + idx + 1 < 10
                        ? `0${((page - 1) * pageSize) + idx + 1}`
                        : ((page - 1) * pageSize) + idx + 1}
                    </td>

                    {/* Mã code */}
                    <td className="p-4">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${isParent ? 'bg-primary/10 text-primary' : 'bg-surface-container text-teal-700'}`}>
                        {item.code}
                      </span>
                    </td>

                    {/* Tên danh mục (Hỗ trợ Click Toggle Expand cho cha) */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Nhánh cây lùi đầu dòng cho con */}
                        {!isParent && (
                          <div className="w-4 h-4 border-l-2 border-b-2 border-outline-variant/30 rounded-bl-md ml-4 mr-1 opacity-60" />
                        )}

                        {/* Nút bấm Đóng/Mở dạng Mũi tên nếu là cha và có con */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant transition-transform"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          // Tạo khoảng trống bằng icon ẩn để tên danh mục thẳng hàng đều đặn
                          isParent && <div className="w-6 h-6" />
                        )}

                        <div
                          onClick={() => hasChildren && toggleExpand(item.id)}
                          className={`text-on-surface ${hasChildren ? 'cursor-pointer select-none hover:text-primary' : ''
                            } ${isParent ? 'font-black text-[15px]' : 'font-semibold text-on-surface-variant/90'}`}
                        >
                          {item.name}
                          {hasChildren && (
                            <span className="ml-2 text-[10px] text-primary/70 font-normal">
                              ({item.subCategories.length} danh mục con)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mô tả */}
                    <td className="p-4 max-w-[320px]">
                      <div className="line-clamp-2 text-on-surface-variant/80">{item.description}</div>
                    </td>

                    {/* Ngày tạo */}
                    <td className="p-4 text-on-surface-variant/70">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </td>

                    {/* Thao tác */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pagedItems.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant/60">Không tìm thấy danh mục phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="border-t border-outline-variant/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="text-xs font-semibold text-on-surface-variant/70">Dữ liệu được lấy trực tiếp từ backend `product_categories`.</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="h-9 w-9 rounded-lg bg-primary text-white font-black">{page}</button>
            <button type="button" className="h-9 px-3 rounded-lg border border-outline-variant/60 text-xs font-bold hover:bg-surface-container">/ {totalPages}</button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showForm && <CategoryForm initial={editing || {}} onCancel={() => setShowForm(false)} onSave={handleSave} />}
      <ConfirmModal
        open={showConfirmDelete}
        title="Xác nhận xoá"
        message={pendingDelete ? `Xác nhận xoá danh mục "${pendingDelete.name || pendingDelete.category_name || pendingDelete.code || 'danh mục'}"?` : 'Xác nhận xoá?'}
        confirmText="Xoá"
        cancelText="Hủy"
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirmDelete(false); setPendingDelete(null); }}
      />
    </div>
  );
};

export default ManageCategories;