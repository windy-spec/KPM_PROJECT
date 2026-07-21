import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/admin.service';
import Portal from '../common/Portal';
import { showSuccess, showError } from '../../utils/notify';
import ConfirmModal from '../common/ConfirmModal';
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
import ImportBatchReviewModal from './ImportBatchReviewModal';

const defaultTrendItems = [
  { name: 'Sắt hộp mạ kẽm (Hòa Phát)', price: '22.500đ/kg', action: 'Sửa giá bán lẻ' },
  { name: 'Sắt đặc tròn φ12', price: '19.800đ/kg', action: 'Sửa giá bán lẻ' },
];

const defaultWarnings = [
  { name: 'Kính 10mm cường lực', remaining: 'Còn 5m²', note: 'Liên quan đến 4 đơn hàng đang chờ', action: 'Đặt hàng ngay' },
];

const normalizeProduct = (item) => {
  let catName = item.product_categories?.category_name || item.category?.name || item.category?.title || item.category || '-';
  if (item.product_categories?.parent_category?.category_name) {
    catName = `${item.product_categories.parent_category.category_name} / ${catName}`;
  }
  
  return {
    id: item.id || item._id || Math.random().toString(36).slice(2, 10),
    image:
      item.product_images?.find((img) => img.is_primary)?.image_url ||
      item.product_images?.[0]?.image_url ||
      '',
    images: item.product_images || [],
    code: item.product_code || item.sku || item.code || '-',
    name: item.product_name || item.name || item.title || 'Sản phẩm',
    categoryId: item.category_id || item.categoryId || '',
    category: catName,
    specs: item.default_specs || null,
    components: item.components || [],
    base_price: item.base_price || 0,
    createdAt: item.created_at || item.createdAt || null,
  };
};

const AdminProductPanel = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
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
  const [batchReview, setBatchReview] = useState(null);
  const [batchReviewLoading, setBatchReviewLoading] = useState(false);
  const [batchReviewActionLoading, setBatchReviewActionLoading] = useState(false);
  const [showBatchReviewModal, setShowBatchReviewModal] = useState(false);
  const [batchReviewError, setBatchReviewError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);

  const load = async ({ page: pageOverride = page, searchOverride = q, categoryOverride = category } = {}) => {
    setLoading(true);
    try {
      const [productRes, categoryRes] = await Promise.all([
        adminService.getProducts({ page: pageOverride, limit, search: searchOverride, category_id: categoryOverride }),
        adminService.getCategories({ page: 1, limit: 100 }),
      ]);

      const productData = productRes.data?.data || productRes.data?.products || productRes.data || [];
      const categoryData = categoryRes.data?.data || categoryRes.data || [];

      const flatCategories = [];
      if (Array.isArray(categoryData)) {
        categoryData.forEach(parent => {
          flatCategories.push({ ...parent, level: 0 });
          if (parent.sub_categories && parent.sub_categories.length > 0) {
            parent.sub_categories.forEach(sub => {
              flatCategories.push({ ...sub, level: 1, parent_id: parent.id || parent._id });
            });
          }
        });
      }

      setItems(Array.isArray(productData) ? productData.map(normalizeProduct) : []);
      setCategories(flatCategories);
      
      // Bắt chính xác totalItem từ backend trả về
      setTotal(
        productRes.data?.pagination?.totalItem || 
        productRes.data?.pagination?.total || 
        (Array.isArray(productData) ? productData.length : 0)
      );
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
  }, [page,category]);

  const handleSearch = () => {
    setPage(1);
    load({ page: 1 });
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (it) => {
    setEditing({
      ...it,
      product_code: it.code || it.product_code || '',
      product_name: it.name || it.product_name || '',
      category_id: it.categoryId || it.category_id || '',
      default_specs:
        typeof it.specs === 'string'
          ? it.specs
          : it.specs
            ? JSON.stringify(it.specs, null, 2)
            : '',
      components:
        typeof it.components === 'string'
          ? it.components
          : (it.components && it.components.length > 0)
            ? JSON.stringify(it.components, null, 2)
            : '',
      base_price: it.base_price || '',
      image: it.image || '',
      images: it.images || [],
    });
    setShowForm(true);
  };

  const parseJson = (value) => {
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
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
      link.download = filenameMatch?.[1] || 'KPM_Import_Product.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showError('Không tải được file mẫu: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const handleOpenImportModal = () => {
    setImportError('');
    setImportFile(null);
    setShowImportModal(true);
  };

  const openBatchReview = async (batchId) => {
    if (!batchId) return;

    setBatchReviewLoading(true);
    setBatchReviewError('');
    const fetchCategories = async () => {
    try {
      const res = await adminService.getCategories({ limit: 100 });
      const data = res.data?.data || res.data || [];
      const flat = [];
      if (Array.isArray(data)) {
        data.forEach(parent => {
          flat.push({ ...parent, level: 0 });
          if (parent.sub_categories && parent.sub_categories.length > 0) {
            parent.sub_categories.forEach(sub => {
              flat.push({ ...sub, level: 1, parent_id: parent.id || parent._id });
            });
          }
        });
      }
      setCategories(flat);
    } catch (err) {
      console.error(err);
    }
  };
    setShowBatchReviewModal(true);

    try {
      const response = await adminService.getImportBatch(batchId);
      setBatchReview(response.data?.data || response.data || null);
    } catch (e) {
      setBatchReview(null);
      setBatchReviewError(e?.response?.data?.message || e.message || 'Không tải được chi tiết batch');
    } finally {
      setBatchReviewLoading(false);
    }
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
      setShowImportModal(false);
      setImportFile(null);
      const batchId = response.data?.data?.batchId || response.data?.batchId;
      showSuccess('Upload file thành công. Mở màn hình review.');
      await openBatchReview(batchId);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Upload thất bại';
      setImportError(msg);
      showError(msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleRejectBatch = async () => {
    // Trigger confirmation modal
    setShowConfirmReject(true);
  };

  const confirmRejectBatch = async () => {
    const batchId = batchReview?.batch_id || batchReview?.batchId || batchReview?.id;
    if (!batchId) return;

    setShowConfirmReject(false);
    setBatchReviewActionLoading(true);
    try {
      await adminService.rejectImportBatch(batchId);
      setShowBatchReviewModal(false);
      setBatchReview(null);
      await load();
      showSuccess('Đã reject batch thành công.');
    } catch (e) {
      showError('Reject thất bại: ' + (e?.response?.data?.message || e.message || e));
    } finally {
      setBatchReviewActionLoading(false);
    }
  };

  const handleApproveBatch = async () => {
    const batchId = batchReview?.batch_id || batchReview?.batchId || batchReview?.id;
    if (!batchId) return;

    setBatchReviewActionLoading(true);
    try {
      await adminService.approveImportBatch(batchId);
      setShowBatchReviewModal(false);
      setBatchReview(null);
      await load();
      showSuccess('Đã approve batch thành công. Dữ liệu hợp lệ đã được lưu vào database.');
    } catch (e) {
      showError('Approve thất bại: ' + (e?.response?.data?.message || e.message || e));
    } finally {
      setBatchReviewActionLoading(false);
    }
  };

  const handleExportInvalidRows = async () => {
    const batchId = batchReview?.batch_id || batchReview?.batchId || batchReview?.id;
    if (!batchId) return;

    try {
      const response = await adminService.exportInvalidImportRows(batchId);
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KPM_Invalid_Rows_${String(batchId).slice(0, 8)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showError('Không tải được file lỗi: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const handleSave = async (form, primaryImage, secondaryImages, deletedImageIds) => {
    try {
      const payload = {
        category_id: form.category_id,
        product_code: form.product_code,
        product_name: form.product_name,
        default_specs: parseJson(form.default_specs),
        components: parseJson(form.components) || [],
        base_price: form.base_price ? parseFloat(form.base_price) : 0,
      };

      const saveResponse = editing && editing.id
        ? await adminService.updateProduct(editing.id, payload)
        : await adminService.createProduct(payload);

      const savedProduct = saveResponse.data?.data || saveResponse.data || null;
      const productId = savedProduct?.id || savedProduct?._id || editing?.id;

      if (productId) {
        const uploadPromises = [];
        if (primaryImage) {
          uploadPromises.push(adminService.uploadProductImage(productId, primaryImage, true));
        }
        if (secondaryImages && secondaryImages.length > 0) {
          for (const file of secondaryImages) {
            uploadPromises.push(adminService.uploadProductImage(productId, file, false));
          }
        }
        if (deletedImageIds && deletedImageIds.length > 0) {
          for (const imgId of deletedImageIds) {
            uploadPromises.push(adminService.deleteProductImage(productId, imgId));
          }
        }
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
      }

      setShowForm(false);
      await load();
      showSuccess(editing && editing.id ? 'Cập nhật sản phẩm thành công.' : 'Tạo sản phẩm thành công.');
    } catch (e) {
      showError('Lưu thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * limit, total || items.length);

  const totalLabel = useMemo(() => `${total || items.length} sản phẩm`, [total, items.length]);

  const totalPages = Math.ceil((total || items.length) / limit) || 1;

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push('...');
      }
    }
    
    // Loại bỏ các dấu '...' bị trùng nhau
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
              value={parentCategory}
              onChange={(e) => {
                const selectedParent = e.target.value;
                setParentCategory(selectedParent);
                setCategory('');
                setPage(1);
                load({ page: 1, categoryOverride: selectedParent });
              }}
              className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Tất cả danh mục cha</option>
              {categories.filter(c => c.level === 0).map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.category_name || cat.name || cat.title}
                </option>
              ))}
            </select>

            {parentCategory && (
              <select
                value={category}
                onChange={(e) => {
                  const selectedCat = e.target.value;
                  setCategory(selectedCat);
                  setPage(1);
                  load({ page: 1, categoryOverride: selectedCat || parentCategory });
                }}
                className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">Tất cả danh mục con</option>
                {categories.filter(c => c.level === 1 && c.parent_id === parentCategory).map((cat) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.category_name || cat.name || cat.title}
                  </option>
                ))}
              </select>
            )}
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
                <th className="p-4 w-[140px]">Danh mục</th>
                <th className="p-4 w-[160px]">Thành phần cấu tạo</th>
                <th className="p-4 w-[160px]">Thông số mặc định</th>
                <th className="p-4 w-[120px]">Giá bán gốc</th>
                <th className="p-4 w-[120px]">Ngày tạo</th>
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
                    <span className="inline-flex items-center rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-teal-700 whitespace-nowrap">
                      {it.category}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(it.components) && it.components.length > 0 ? (
                        it.components.map((comp, i) => (
                          <span key={i} className="inline-flex items-center rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {comp.name || comp.component_name || 'Component'}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-on-surface-variant/50 italic">-</span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 max-w-[220px]">
                    <div className="line-clamp-2 text-[11px] text-on-surface-variant/75 font-mono">
                      {typeof it.specs === 'string' ? it.specs : JSON.stringify(it.specs || {}, null, 0)}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-primary whitespace-nowrap">
                      {it.base_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.base_price) : '-'}
                    </span>
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
                        onClick={() => {
                          setPendingDelete(it);
                          setShowConfirmDelete(true);
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
                  <td colSpan={8} className="p-8 text-center text-sm text-on-surface-variant/60">
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
            
            {/* Render động các số trang */}
            {renderPageNumbers()}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 w-9 rounded-lg border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40"
              disabled={page === totalPages}
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

                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  Sau khi upload xong, hệ thống sẽ mở màn hình review batch để bạn xem riêng 2 phần valid và invalid.
                </div>
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

      {showBatchReviewModal ? (
        <ImportBatchReviewModal
          batch={batchReview}
          loading={batchReviewLoading}
          actionLoading={batchReviewActionLoading}
          onClose={() => {
            setShowBatchReviewModal(false);
            setBatchReview(null);
            setBatchReviewError('');
          }}
          onReject={handleRejectBatch}
          onApprove={handleApproveBatch}
          onExportInvalid={handleExportInvalidRows}
        />
      ) : null}

      <ConfirmModal
        open={showConfirmReject}
        title="Xác nhận reject batch"
        message="Reject sẽ hủy batch và xóa toàn bộ dữ liệu tạm. Bạn chắc chắn muốn tiếp tục?"
        confirmText="Reject"
        cancelText="Hủy"
        onConfirm={confirmRejectBatch}
        onCancel={() => setShowConfirmReject(false)}
      />

      <ConfirmModal
        open={showConfirmDelete}
        title="Xác nhận xoá"
        message={pendingDelete ? `Xác nhận xoá sản phẩm "${pendingDelete.name || pendingDelete.product_name || pendingDelete.code || 'sản phẩm'}"?` : 'Xác nhận xoá?' }
        confirmText="Xoá"
        cancelText="Hủy"
        onConfirm={async () => {
          if (!pendingDelete) return setShowConfirmDelete(false);
          try {
            await adminService.deleteProduct(pendingDelete.id);
            setShowConfirmDelete(false);
            setPendingDelete(null);
            await load();
            showSuccess('Xoá sản phẩm thành công.');
          } catch (e) {
            showError('Xoá thất bại: ' + (e?.response?.data?.message || e.message || e));
          }
        }}
        onCancel={() => { setShowConfirmDelete(false); setPendingDelete(null); }}
      />

      {batchReviewError ? (
        <Portal>
          <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
            {batchReviewError}
          </div>
        </Portal>
      ) : null}

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