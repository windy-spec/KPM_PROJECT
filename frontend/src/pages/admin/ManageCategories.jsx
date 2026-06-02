import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import { showSuccess, showError } from '../../utils/notify';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
  Tag,
  TriangleAlert,
} from 'lucide-react';

const normalizeCategory = (item) => ({
  id: item.id || item._id || Math.random().toString(36).slice(2, 10),
  code: item.category_code || item.code || '-',
  name: item.category_name || item.name || item.title || 'Danh mục',
  description: item.description || '-',
  createdAt: item.created_at || item.createdAt || null,
});

const CategoryForm = ({ initial = {}, onCancel, onSave }) => {
  const [form, setForm] = useState({
    category_code: '',
    category_name: '',
    description: '',
    ...initial,
  });

  const isEditing = Boolean(initial.id);

  useEffect(() => {
    setForm((current) => ({ ...current, ...initial }));
  }, [initial]);

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
            <p className="mt-2 text-xs text-on-surface-variant/70">
              Dùng đúng mã và tên danh mục theo backend.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Mã danh mục
              </label>
              <input
                value={form.category_code || ''}
                onChange={(e) => setForm({ ...form, category_code: e.target.value })}
                placeholder="VD: CAT-001"
                readOnly={isEditing}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                  isEditing
                    ? 'border-outline-variant/60 bg-surface-container/40 text-on-surface-variant cursor-not-allowed'
                    : 'border-outline-variant/60 bg-surface-container/20 focus:border-primary'
                }`}
              />
              {isEditing ? (
                <p className="text-[11px] text-on-surface-variant/60">
                  Mã danh mục được giữ cố định khi sửa.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Tên danh mục
              </label>
              <input
                value={form.category_name || ''}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                placeholder="VD: Cổng sắt CNC"
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Chú thích
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Chú thích ngắn về danh mục..."
                rows={4}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors"
            >
              Lưu danh mục
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

const ManageCategories = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
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
      setItems(Array.isArray(data) ? data.map(normalizeCategory) : []);
    } catch (e) {
      console.warn('Lỗi tải danh mục', e?.message || e);
      setItems([]);
      setError(e?.response?.data?.message || e?.message || 'Không tải được danh mục từ backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const haystack = `${item.code} ${item.name} ${item.description}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

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
    const target = items.find((it) => (it.id || it._id) === id || it.id === id);
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/60 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant/50 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
                Danh mục sản phẩm
              </h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {items.length} danh mục
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/65">
              Quản lý danh mục theo dữ liệu backend: code, tên và mô tả.
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
              onClick={() => {
                setPage(1);
                load();
              }}
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

        <div className="flex flex-col gap-3 border-b border-outline-variant/40 bg-surface-container/10 px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm hover:bg-surface-container transition-colors"
            >
              <Filter className="h-4 w-4" />
              Lọc nhanh
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm hover:bg-surface-container transition-colors"
            >
              <Download className="h-4 w-4" />
              Xuất danh mục
            </button>
          </div>

          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị {pagedItems.length} / {filteredItems.length} danh mục từ backend
          </div>
        </div>

        {error ? (
          <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant/60">
                    Đang tải danh mục từ backend...
                  </td>
                </tr>
              ) : null}

              {pagedItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-surface-container/20 transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                    {((page - 1) * pageSize) + idx + 1 < 10
                      ? `0${((page - 1) * pageSize) + idx + 1}`
                      : ((page - 1) * pageSize) + idx + 1}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-on-surface">{item.name}</div>
                  </td>
                  <td className="p-4 max-w-[320px]">
                    <div className="line-clamp-2 text-on-surface-variant/80">{item.description}</div>
                  </td>
                  <td className="p-4 text-on-surface-variant/70">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
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
              ))}

              {pagedItems.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-on-surface-variant/60">
                    Không tìm thấy danh mục phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-outline-variant/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Dữ liệu được lấy trực tiếp từ backend `product_categories`.
          </div>
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
            <button type="button" className="h-9 px-3 rounded-lg border border-outline-variant/60 text-xs font-bold hover:bg-surface-container">
              / {totalPages}
            </button>
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

      {showForm && (
        <CategoryForm
          initial={editing || {}}
          onCancel={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
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
