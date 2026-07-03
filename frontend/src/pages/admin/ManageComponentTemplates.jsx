import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Filter,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";
import apiClient from "../../services/apiClient";
import adminService from "../../services/admin.service";
import Portal from "../../components/common/Portal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { showError, showSuccess } from "../../utils/notify";
import Pagination from "../../components/common/Pagination";

const normalizeTemplate = (item) => ({
  id: item.id,
  component_name: item.component_name || "",
  category_code: item.category_code || "",
  default_length: item.default_length ?? "",
  default_width: item.default_width ?? "",
  default_height: item.default_height ?? "",
  default_unit: item.default_unit || "mm",
  allow_paint: item.allow_paint ?? true,
  allowed_materials: item.allowed_materials || [],
  html_code: item.html_code || "",
  drawing_image_url: item.drawing_image_url || "",
});

function TemplateModal({ initial, categories, materials, loading, onCancel, onSave }) {
  const [form, setForm] = useState({
    component_name: initial?.component_name || "",
    category_code: initial?.category_code || "",
    default_length: initial?.default_length ?? "",
    default_width: initial?.default_width ?? "",
    default_height: initial?.default_height ?? "",
    default_unit: initial?.default_unit || "mm",
    allow_paint: initial?.allow_paint ?? true,
    allowed_material_ids: initial?.allowed_materials?.map(m => m.material_id) || [],
    html_code: initial?.html_code || "",
  });
  const [touched, setTouched] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const previewRef = React.useRef(null);

  useEffect(() => {
    setForm({
      component_name: initial?.component_name || "",
      category_code: initial?.category_code || "",
      default_length: initial?.default_length ?? "",
      default_width: initial?.default_width ?? "",
      default_height: initial?.default_height ?? "",
      default_unit: initial?.default_unit || "mm",
      allow_paint: initial?.allow_paint ?? true,
      allowed_material_ids: initial?.allowed_materials?.map(m => m.material_id) || [],
      html_code: initial?.html_code || "",
    });
    setTouched(false);
  }, [initial]);

  const canSubmit = form.component_name.trim() && form.category_code && !loading;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSave({ ...form, component_name: form.component_name.trim() });
  };

  const handleMaterialToggle = (materialId) => {
    setForm((prev) => {
      const isSelected = prev.allowed_material_ids.includes(materialId);
      if (isSelected) {
        return { ...prev, allowed_material_ids: prev.allowed_material_ids.filter(id => id !== materialId) };
      } else {
        return { ...prev, allowed_material_ids: [...prev.allowed_material_ids, materialId] };
      }
    });
  };

  const handleCapture = async () => {
    if (!initial?.id) {
      showError("Bạn cần lưu mẫu linh kiện lần đầu trước khi chụp ảnh!");
      return;
    }
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: null });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'preview.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', file);

        try {
          const res = await apiClient.post('/ai/upload-drawing', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const url = res.data?.data?.imageUrl || res.data?.imageUrl || res.data;

          if (url && typeof url === 'string') {
            await adminService.updateComponentDrawing(initial.id, { drawing_image_url: url });
            showSuccess("Chụp ảnh và lưu thành công!");
            onSave({ ...form, drawing_image_url: url }, true);
          } else {
            showError("Không lấy được đường dẫn ảnh từ server.");
          }
        } catch (uploadError) {
          showError("Lỗi khi tải ảnh lên server.");
        }
      }, 'image/png');
    } catch (e) {
      showError("Lỗi khi chụp màn hình.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">

          {/* HEADER */}
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/50 px-6 py-4 shrink-0">
            <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
              {initial?.id ? "Sửa mẫu linh kiện" : "Thêm mẫu linh kiện mới"}
            </h3>
            <button type="button" onClick={onCancel} className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* BODY — 2-column layout */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-6 lg:grid-cols-2 h-full">

              {/* Cột trái: form fields */}
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid gap-4 md:grid-cols-2">

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Tên linh kiện</label>
                    <input
                      value={form.component_name}
                      onChange={(e) => setForm({ ...form, component_name: e.target.value })}
                      placeholder="VD: Cánh cửa cổng, Khung bao..."
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                    {touched && !form.component_name.trim() ? (<p className="text-xs text-rose-600">Tên không được để trống.</p>) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Danh mục áp dụng</label>
                    <select
                      value={form.category_code}
                      onChange={(e) => setForm({ ...form, category_code: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.category_code}>{item.category_name} ({item.category_code})</option>
                      ))}
                    </select>
                    {touched && !form.category_code ? (<p className="text-xs text-rose-600">Bắt buộc chọn danh mục.</p>) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Đơn vị đo mặc định</label>
                    <select
                      value={form.default_unit}
                      onChange={(e) => setForm({ ...form, default_unit: e.target.value })}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Chiều dài mặc định</label>
                    <input type="number" value={form.default_length} onChange={(e) => setForm({ ...form, default_length: e.target.value })} className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Chiều rộng mặc định</label>
                    <input type="number" value={form.default_width} onChange={(e) => setForm({ ...form, default_width: e.target.value })} className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Chiều cao mặc định</label>
                    <input type="number" value={form.default_height} onChange={(e) => setForm({ ...form, default_height: e.target.value })} className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
                  </div>

                  <div className="space-y-2 flex items-center h-full pt-4 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-on-surface">
                      <input type="checkbox" checked={form.allow_paint} onChange={(e) => setForm({ ...form, allow_paint: e.target.checked })} className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant/60" />
                      Cho phép chọn sơn phủ (Sơn tĩnh điện...)
                    </label>
                  </div>

                </div>

                <div className="space-y-3 border-t border-outline-variant/50 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70 block">
                    Vật tư được phép sử dụng ({form.allowed_material_ids.length} đã chọn)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto p-2 bg-surface-container/10 rounded-xl border border-outline-variant/40">
                    {materials.map(mat => (
                      <label key={mat.id} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface-container transition-colors">
                        <input type="checkbox" className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant/60" checked={form.allowed_material_ids.includes(mat.id)} onChange={() => handleMaterialToggle(mat.id)} />
                        <div className="text-xs">
                          <div className="font-bold text-on-surface">{mat.material_name}</div>
                          <div className="text-on-surface-variant/70">{mat.material_code}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-outline-variant/50 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70 block">
                    HTML Code (Tạo bởi AI — Dán vào đây để Preview)
                  </label>
                  <textarea
                    value={form.html_code}
                    onChange={(e) => setForm({ ...form, html_code: e.target.value })}
                    placeholder="Dán mã HTML vào đây..."
                    className="w-full h-40 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary font-mono text-xs"
                  />
                </div>
              </div>

              {/* Cột phải: Live Preview */}
              <div className="flex flex-col border border-outline-variant/50 rounded-xl bg-surface-container/10 overflow-hidden min-h-[400px]">
                <div className="px-4 py-3 border-b border-outline-variant/50 flex justify-between items-center bg-white shrink-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Live Preview (HTML)</span>
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={capturing || !initial?.id || !form.html_code.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {capturing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                    {capturing ? "Đang xử lý..." : "Lưu & Chụp Ảnh"}
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#f8f9fa] relative">
                  <div ref={previewRef} className="inline-block" dangerouslySetInnerHTML={{ __html: form.html_code }} />
                  {!form.html_code.trim() && (
                    <p className="text-on-surface-variant/50 text-sm absolute pointer-events-none">Chưa có mã HTML — hãy dán code vào cột trái</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4 shrink-0">
            <button type="button" onClick={onCancel} className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Đang lưu..." : initial?.id ? "Cập nhật mẫu" : "Tạo mẫu linh kiện"}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}

const ManageComponentTemplates = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [templatesRes, categoriesRes, materialsRes] = await Promise.all([
        adminService.getComponentTemplates({ limit: 500 }),
        adminService.getCategories({ limit: 500 }),
        adminService.getMaterials({ limit: 500 }),
      ]);

      const templateData = templatesRes.data?.data || templatesRes.data || [];
      setItems(Array.isArray(templateData) ? templateData.map(normalizeTemplate) : []);

      const catData = categoriesRes.data?.data || categoriesRes.data || [];
      setCategories(Array.isArray(catData) ? catData : []);

      const matData = materialsRes.data?.data || materialsRes.data || [];
      setMaterials(Array.isArray(matData) ? matData : []);
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || e?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!keyword) return true;
      return (
        item.component_name.toLowerCase().includes(keyword) ||
        item.category_code.toLowerCase().includes(keyword)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, totalPages]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setShowForm(true); };

  const handleDelete = async (item) => {
    setPendingDelete(item);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return setShowConfirmDelete(false);
    try {
      await adminService.deleteComponentTemplate(pendingDelete.id);
      await loadInitialData();
      setShowConfirmDelete(false);
      setPendingDelete(null);
      showSuccess("Xoá mẫu linh kiện thành công.");
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || "Xoá mẫu linh kiện thất bại");
    }
  };

  const handleSave = async (form, isCaptureOnly = false) => {
    setFormLoading(true);
    try {
      if (editing?.id) {
        await adminService.updateComponentTemplate(editing.id, form);
      } else {
        await adminService.createComponentTemplate(form);
      }

      await loadInitialData();
      if (isCaptureOnly) {
        // Chỉ cập nhật ảnh, không đóng form
        setEditing(prev => ({ ...prev, drawing_image_url: form.drawing_image_url }));
      } else {
        setShowForm(false);
        setEditing(null);
        showSuccess(editing?.id ? "Cập nhật thành công." : "Thêm mới thành công.");
      }
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || "Lưu thất bại");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/60 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant/50 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
                Quản lý Mẫu Linh Kiện
              </h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {items.length} mẫu
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/65">
              Cấu hình các mẫu linh kiện chuẩn (Khung, cánh cửa, lan can...) theo từng danh mục.
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block w-[220px] md:w-[260px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/45" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, mã danh mục..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button type="button" onClick={() => { setPage(1); loadInitialData(); }} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-3.5 py-2 text-xs font-bold hover:bg-surface-container transition-colors">
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Tải lại</span>
            </button>

            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm mẫu mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-outline-variant/40 bg-surface-container/10 px-4 py-3 lg:flex-row lg:items-center lg:justify-between md:px-5">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm hover:bg-surface-container transition-colors">
              <Filter className="h-4 w-4" />Lọc nhanh
            </button>
          </div>
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị {pagedItems.length} / {filteredItems.length} mẫu linh kiện
          </div>
        </div>

        {error ? (
          <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[80px]">STT</th>
                <th className="p-4">Tên linh kiện</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Mặc định (D x R x C)</th>
                <th className="p-4">Sơn phủ</th>
                <th className="p-4">Vật tư khả dụng</th>
                <th className="p-4">Ảnh Mô Hình</th>
                <th className="p-4 pr-6 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-on-surface-variant/60">Đang tải dữ liệu...</td>
                </tr>
              ) : null}

              {pagedItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-surface-container/20 transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-4">
                    <div className="font-black text-on-surface">{item.component_name}</div>
                    {item.html_code && (
                      <div className="text-[10px] text-indigo-500 font-mono mt-0.5">HTML ✓</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      {item.category_code}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant/80 text-xs">
                    {item.default_length || '-'} x {item.default_width || '-'} x {item.default_height || '-'} ({item.default_unit})
                  </td>
                  <td className="p-4">
                    {item.allow_paint ? (
                      <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">Có</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">Không</span>
                    )}
                  </td>
                  <td className="p-4 text-on-surface-variant/70 font-semibold text-xs">
                    {item.allowed_materials?.length || 0} vật tư
                  </td>
                  <td className="p-4">
                    {item.drawing_image_url ? (
                      <img src={item.drawing_image_url} alt="drawing" className="h-10 w-10 object-contain rounded border border-outline-variant/40" />
                    ) : (
                      <span className="text-[10px] text-on-surface-variant/40">Chưa có</span>
                    )}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                        Sửa
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pagedItems.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-on-surface-variant/60">Không tìm thấy mẫu linh kiện nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-outline-variant/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Mẫu linh kiện định nghĩa các tùy chọn khi khách hàng gửi báo giá.
          </div>
          <div className="flex items-center overflow-x-auto max-w-full">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      </div>

      {showForm ? (
        <TemplateModal
          initial={editing}
          categories={categories}
          materials={materials}
          loading={formLoading}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmModal
        open={showConfirmDelete}
        title="Xác nhận xoá mẫu linh kiện"
        message={pendingDelete ? `Bạn chắc chắn muốn xoá mẫu linh kiện "${pendingDelete.component_name}"?` : "Bạn chắc chắn muốn xoá?"}
        confirmText="Xoá"
        cancelText="Hủy"
        onCancel={() => { setShowConfirmDelete(false); setPendingDelete(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ManageComponentTemplates;
