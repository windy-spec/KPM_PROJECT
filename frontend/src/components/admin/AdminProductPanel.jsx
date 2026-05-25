import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/admin.service';
import Portal from '../common/Portal';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  TrendingUp,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import ProductForm from './ProductForm';

const defaultTrendItems = [
  { name: 'Sắt hộp mạ kẽm (Hòa Phát)', price: '22.500đ/kg', action: 'Sửa giá bán lẻ' },
  { name: 'Sắt đặc tròn φ12', price: '19.800đ/kg', action: 'Sửa giá bán lẻ' },
];

const defaultWarnings = [
  { name: 'Kính 10mm cường lực', remaining: 'Còn 5m²', note: 'Liên quan đến 4 đơn hàng đang chờ', action: 'Đặt hàng ngay' },
];

const statusStyles = {
  'Sẵn sàng bán': 'bg-teal-50 text-teal-700 border-teal-100',
  'Sắp hết hàng': 'bg-rose-50 text-rose-700 border-rose-100',
  'Đang sản xuất': 'bg-amber-50 text-amber-700 border-amber-100',
  'Hoàn tất': 'bg-sky-50 text-sky-700 border-sky-100',
};

const normalizeProduct = (item) => ({
  id: item.id || item._id || Math.random().toString(36).slice(2, 10),
  image:
    item.product_images?.find((img) => img.is_primary)?.image_url ||
    item.product_images?.[0]?.image_url ||
    '',
  code: item.product_code || item.sku || item.code || '-',
  name: item.product_name || item.name || item.title || 'Sản phẩm',
  categoryId: item.category_id || item.categoryId || '',
  category: item.product_categories?.category_name || item.category?.name || item.category?.title || item.category || '-',
  specs: item.default_specs || null,
  createdAt: item.created_at || item.createdAt || null,
});

const AdminProductPanel = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);

  const load = async ({ page: pageOverride = page, searchOverride = q, categoryOverride = category } = {}) => {
    setLoading(true);
    try {
      const [productRes, categoryRes] = await Promise.all([
        adminService.getProducts({ page: pageOverride, limit, search: searchOverride, category_id: categoryOverride }),
        adminService.getCategories({ page: 1, limit: 100 }),
      ]);

      const productData = productRes.data?.data || productRes.data || [];
      const categoryData = categoryRes.data?.data || categoryRes.data || [];

      setItems(Array.isArray(productData) ? productData.map(normalizeProduct) : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setTotal(productRes.data?.pagination?.total || (Array.isArray(productData) ? productData.length : 0));
    } catch (e) {
      console.warn('Không tải được sản phẩm', e?.message || e);
      setItems([]);
      setCategories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    load({ page: 1 });
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (it) => {
    setEditing(it);
    setShowForm(true);
  };

  const parseDefaultSpecs = (value) => {
    const text = String(value || '').trim();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await adminService.downloadImportTemplate();
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kpm-product-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Không tải được file mẫu: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const handleOpenImportModal = () => {
    setImportError('');
    setImportResult(null);
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleUploadImport = async () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file Excel .xlsx trước khi tải lên.');
      return;
    }

    setImportLoading(true);
    setImportError('');
    try {
      const response = await adminService.uploadImportFile(importFile);
      setImportResult(response.data || null);
      setShowImportModal(false);
      setImportFile(null);
      if (response.data?.batchId) {
        alert(`Upload thành công. batchId: ${response.data.batchId}`);
      } else {
        alert('Upload thành công.');
      }
    } catch (e) {
      setImportError(e?.response?.data?.message || e.message || 'Upload thất bại');
    } finally {
      setImportLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        category_id: form.category_id,
        product_code: form.product_code,
        product_name: form.product_name,
        default_specs: parseDefaultSpecs(form.default_specs),
      };

      if (editing && editing.id) await adminService.updateProduct(editing.id, payload);
      else await adminService.createProduct(payload);
      setShowForm(false);
      await load();
    } catch (e) {
      alert('Lưu thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * limit, total || items.length);

  const totalLabel = useMemo(() => `${total || items.length} sản phẩm`, [total, items.length]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">Danh mục sản phẩm</h2>
                <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                  {totalLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="relative hidden sm:block w-[200px] md:w-[240px] lg:w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Mã SP, tên vật liệu..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-3.5 py-2 text-xs font-bold hover:bg-surface-container transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Tìm</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-on-surface hover:bg-surface-container transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Tải file mẫu</span>
              <span className="lg:hidden">Mẫu</span>
            </button>

            <button
              type="button"
              onClick={handleOpenImportModal}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-primary hover:bg-primary/10 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Import dữ liệu</span>
              <span className="lg:hidden">Import</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm sản phẩm mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>

        <div className="px-4 md:px-5 py-3 border-b border-outline-variant/40 bg-surface-container/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id || cat.category_code} value={cat.id || cat._id || cat.category_code}>
                    {(cat.category_code || cat.code || '-') + ' - ' + (cat.category_name || cat.name || cat.title || 'Danh mục')}
                </option>
              ))}
            </select>

            <select className="min-w-[140px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="ready">Sẵn sàng bán</option>
              <option value="low">Sắp hết hàng</option>
              <option value="production">Đang sản xuất</option>
            </select>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3.5 py-2 text-sm hover:bg-surface-container transition-colors self-start lg:self-auto"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo kho
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[70px]">STT</th>
                <th className="p-4">Thông tin sản phẩm</th>
                <th className="p-4 w-[120px]">Danh mục</th>
                <th className="p-4 w-[180px]">Thông số mặc định</th>
                <th className="p-4 w-[140px]">Ngày tạo</th>
                <th className="p-4 pr-6 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {items.map((it, idx) => (
                <tr key={it.id} className="hover:bg-surface-container/20 transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                    {(page - 1) * limit + idx + 1 < 10 ? `0${(page - 1) * limit + idx + 1}` : (page - 1) * limit + idx + 1}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-md border border-outline-variant/50 bg-surface-container/40 flex items-center justify-center overflow-hidden">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-on-surface-variant/45" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-black text-on-surface leading-5 line-clamp-2">{it.name}</div>
                        <div className="text-[11px] text-on-surface-variant/60 mt-0.5">Mã: {it.code}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                      {it.category}
                    </span>
                  </td>

                  <td className="p-4 max-w-[260px]">
                    <div className="line-clamp-2 text-[11px] text-on-surface-variant/75 font-mono">
                      {typeof it.specs === 'string' ? it.specs : JSON.stringify(it.specs || {}, null, 0)}
                    </div>
                  </td>

                  <td className="p-4 text-on-surface-variant/70">
                    {it.createdAt ? new Date(it.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>

                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(it)}
                        className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Xác nhận xoá sản phẩm này?')) return;
                          await adminService.deleteProduct(it.id);
                          await load();
                        }}
                        className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-on-surface-variant/60">
                    Không tìm thấy sản phẩm phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-outline-variant/40 px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị {pageStart} - {pageEnd} trên tổng số {total || items.length} sản phẩm
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
            <button type="button" className="h-9 w-9 rounded-lg bg-primary text-white font-black">1</button>
            <button type="button" className="h-9 w-9 rounded-lg border border-outline-variant/60 hover:bg-surface-container">2</button>
            <button type="button" className="h-9 w-9 rounded-lg border border-outline-variant/60 hover:bg-surface-container">3</button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showImportModal ? (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
              <div className="border-b border-outline-variant/50 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">Import dữ liệu sản phẩm</h3>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant/70">
                  Chọn file Excel đã điền dữ liệu. Hệ thống sẽ gửi file lên backend và trả về `batchId` để xử lý giai đoạn review sau.
                </p>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) setImportFile(droppedFile);
                  }}
                  className="rounded-2xl border-2 border-dashed border-outline-variant/60 bg-surface-container/20 px-5 py-8 text-center"
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-black text-on-surface">Kéo thả file Excel vào đây</div>
                  <div className="mt-1 text-xs text-on-surface-variant/65">Hoặc bấm chọn file .xlsx từ máy tính</div>

                  <div className="mt-4 flex flex-col items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors">
                      Chọn file
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    {importFile ? (
                      <div className="rounded-xl border border-outline-variant/60 bg-white px-4 py-2 text-sm font-semibold text-on-surface">
                        File đã chọn: <span className="font-black">{importFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-on-surface-variant/55">Chưa chọn file</div>
                    )}
                  </div>
                </div>

                {importError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {importError}
                  </div>
                ) : null}

                {importResult?.batchId ? (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                    Upload đã sẵn sàng. batchId: <span className="font-black">{importResult.batchId}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUploadImport}
                  disabled={importLoading}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {importLoading ? 'Đang upload...' : 'Tải lên'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.22em]">Theo dõi biến động giá sắt/thép (đầu vào)</h3>
            </div>
            <div className="text-[10px] text-on-surface-variant/55 font-bold">Cập nhật: 10 phút trước</div>
          </div>

          <div className="space-y-4">
            {defaultTrendItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container/20 px-4 py-4">
                <div>
                  <div className="font-black text-on-surface">{item.name}</div>
                  <div className="text-[11px] text-on-surface-variant/60">Quy cách chuẩn</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm font-black text-on-surface">{item.price}</div>
                  <button type="button" className="text-[11px] font-black uppercase tracking-[0.18em] text-primary hover:underline">
                    {item.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-4">
            <TriangleAlert className="w-5 h-5" />
            <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.22em]">Cảnh báo hết vật tư</h3>
          </div>

          <div className="space-y-4">
            {defaultWarnings.map((item) => (
              <div key={item.name} className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-black text-on-surface leading-5">{item.name}</div>
                  <span className="text-rose-600 font-black text-sm">{item.remaining}</span>
                </div>
                <div className="text-[11px] text-on-surface-variant/70 mb-3">{item.note}</div>
                <button type="button" className="w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editing || {}}
          categories={categories}
          onCancel={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminProductPanel;
