import React, { useEffect, useMemo, useState, useRef } from "react";
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
  blueprint_html_code: item.blueprint_html_code || "",
  blueprint_image_url: item.blueprint_image_url || "",
});

function TemplateModal({ initial, categories, materials, loading, onCancel, onSave }) {
  const previewRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
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
    drawing_image_url: initial?.drawing_image_url || "",
    blueprint_html_code: initial?.blueprint_html_code || "",
    blueprint_image_url: initial?.blueprint_image_url || "",
  });
  const [touched, setTouched] = useState(false);
  const blueprintPreviewRef = useRef(null);

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
      drawing_image_url: initial?.drawing_image_url || "",
      blueprint_html_code: initial?.blueprint_html_code || "",
      blueprint_image_url: initial?.blueprint_image_url || "",
    });
    setTouched(false);
  }, [initial]);

  const canSubmit =
    form.component_name.trim() &&
    form.category_code &&
    !loading && !capturing;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;

    let updatedDrawingUrl = form.drawing_image_url;

    if (form.html_code && previewRef.current) {
      setCapturing(true);
      try {
        const canvas = await html2canvas(previewRef.current, { backgroundColor: null, useCORS: true, logging: false });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const formData = new FormData();
          formData.append("image", blob, `template_${Date.now()}.png`);
          const res = await apiClient.post("/ai/upload-drawing", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          if (res.data?.data?.imageUrl) {
            updatedDrawingUrl = res.data.data.imageUrl;
          }
        }
      } catch (error) {
        console.error("Lỗi khi auto-capture html2canvas:", error);
      } finally {
        setCapturing(false);
      }
    }

    let updatedBlueprintUrl = form.blueprint_image_url;

    if (form.blueprint_html_code && blueprintPreviewRef.current) {
      setCapturing(true);
      try {
        const canvas = await html2canvas(blueprintPreviewRef.current, { backgroundColor: null, useCORS: true, logging: false });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const formData = new FormData();
          formData.append("image", blob, `blueprint_${Date.now()}.png`);
          const res = await apiClient.post("/ai/upload-drawing", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          if (res.data?.data?.imageUrl) {
            updatedBlueprintUrl = res.data.data.imageUrl;
          }
        }
      } catch (error) {
        console.error("Lỗi khi auto-capture blueprint html2canvas:", error);
      } finally {
        setCapturing(false);
      }
    }

    onSave({
      ...form,
      component_name: form.component_name.trim(),
      drawing_image_url: updatedDrawingUrl,
      blueprint_image_url: updatedBlueprintUrl
    });
  };

  const handleCodeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setForm((prev) => ({ ...prev, html_code: evt.target.result }));
    };
    reader.readAsText(file);
  };

  const handleBlueprintCodeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setForm((prev) => ({ ...prev, blueprint_html_code: evt.target.result }));
    };
    reader.readAsText(file);
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

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-[1200px] max-h-[95vh] flex flex-col overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5 shrink-0">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial?.id ? "Sửa mẫu linh kiện" : "Thêm mẫu linh kiện mới"}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
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

              <div className="space-y-3 border-t border-outline-variant/50 pt-4 mt-4">
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
            </div>

            {/* Cột phải: HTML Source & Live Preview */}
            <div className="w-full md:w-1/2 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  Source Code (HTML/CSS)
                </label>
                <p className="text-[11px] text-on-surface-variant/70 mb-2">Chọn file .html do AI sinh ra. Hệ thống sẽ tự chụp ảnh 3D khi bạn lưu.</p>
                <input
                  type="file"
                  accept=".html,.txt"
                  onChange={handleCodeUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors"
                />
              </div>

              {form.html_code && (
                <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-xl bg-slate-50 relative overflow-auto min-h-[250px] p-4 group">
                  <div className="sticky top-0 left-0 w-max bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider z-10 shadow-sm opacity-50 group-hover:opacity-100 transition-opacity mb-4">
                    Live Preview 3D
                  </div>
                  <div className="w-full min-h-full">
                    <div
                      ref={previewRef}
                      className="bg-transparent inline-block min-w-full origin-top-left"
                      dangerouslySetInnerHTML={{ __html: form.html_code }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  Source Code Nét Đứt (Blueprint HTML/CSS)
                </label>
                <p className="text-xs text-on-surface-variant/70 leading-relaxed mb-1">Chọn file .html bản vẽ nét đứt (blueprint).
                  {/* Đoạn text bổ sung */}
                  <br />
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary mt-1 mr-1">{"{{COMPONENT_NAME}}"}</span>: Tên linh kiện
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary mr-1">{"{{LENGTH}}"}</span>: Chiều dài
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary mr-1">{"{{WIDTH}}"}</span>: Chiều rộng
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary mr-1">{"{{HEIGHT}}"}</span>: Chiều cao
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary mr-1">{"{{MATERIAL_NAME}}"}</span>: Tên vật liệu
                  <span className="inline-block bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary">{"{{THICKNESS}}"}</span>: Độ dày kĩ thuật
                </p>
                <input
                  type="file"
                  accept=".html,.txt"
                  onChange={handleBlueprintCodeUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors"
                />
              </div>

              {form.blueprint_html_code && (
                <div className="flex-1 border-2 border-dashed border-outline-variant/60 rounded-xl bg-slate-50 relative overflow-auto min-h-[250px] p-4 group">
                  <div className="sticky top-0 left-0 w-max bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider z-10 shadow-sm opacity-50 group-hover:opacity-100 transition-opacity mb-4">
                    Live Preview Blueprint
                  </div>
                  <div className="w-full min-h-full">
                    <div
                      ref={blueprintPreviewRef}
                      className="bg-transparent inline-block min-w-full origin-top-left"
                      dangerouslySetInnerHTML={{ __html: form.blueprint_html_code }}
                    />
                  </div>
                </div>
              )}
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
              {(loading || capturing) ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {capturing ? "Đang xử lý ảnh..." : (loading ? "Đang lưu..." : (initial?.id ? "Cập nhật mẫu" : "Tạo mẫu linh kiện"))}
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
