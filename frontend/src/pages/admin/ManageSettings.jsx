import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/admin.service";
import Portal from "../../components/common/Portal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { showError, showSuccess } from "../../utils/notify";
import { Plus, Pencil, Trash2, X, Settings, Undo2, Save, Component, Palette, Briefcase, Search } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import LaborCategorySelect from "../../components/admin/LaborCategorySelect";

const ITEMS_PER_PAGE = 6;

function ThicknessRow({ item, onEdit, onDelete }) {
  const matCode = item.materials?.material_code || "";
  const matName = item.materials?.material_name || "";

  return (
    <tr className="hover:bg-surface-container/20 transition-colors">
      <td className="p-4 pl-6">
        {matCode ? (
          <div className="flex flex-col">
            <span className="font-black text-on-surface">{matName}</span>
            <span className="font-mono text-[11px] text-primary mt-0.5">
              Mã: {matCode}
            </span>
          </div>
        ) : (
          <span className="text-on-surface-variant/50">-</span>
        )}
      </td>
      <td className="p-4">
        <span className="font-bold text-on-surface-variant/90">{item.thickness_value}</span>
      </td>
      <td className="p-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-surface-container font-mono text-[11px] font-bold text-on-surface-variant/90 border border-outline-variant/40">
          x {Number(item.price_multiplier).toFixed(2)}
        </span>
      </td>
      <td className="p-4 pr-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" /> Sửa
          </button>
          <button
            onClick={() => onDelete(item)}
            className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" /> Xoá
          </button>
        </div>
      </td>
    </tr>
  );
}

function PaintRow({ item, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-surface-container/20 transition-colors">
      <td className="p-4 pl-6 font-black text-on-surface">{item.paint_name}</td>
      <td className="p-4 font-bold text-teal-700">
        {Number(item.price_per_sqm).toLocaleString("vi-VN")} đ
      </td>
      <td className="p-4 text-on-surface-variant/80 text-xs max-w-xs truncate" title={item.description}>
        {item.description || "-"}
      </td>
      <td className="p-4 pr-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" /> Sửa
          </button>
          <button
            onClick={() => onDelete(item)}
            className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" /> Xoá
          </button>
        </div>
      </td>
    </tr>
  );
}

// ==========================================
// COMPONENT CHÍNH
// ==========================================

const ManageSettings = ({ activePanel }) => {
  const [tab, setTab] = useState("thickness");
  const navigate = useNavigate();

  // States Dữ liệu gốc
  const [labCategories, setLabCategories] = useState([]);
  const [labModels, setLabModels] = useState([]);
  const [labRatesMap, setLabRatesMap] = useState({});
  const [labEdits, setLabEdits] = useState({}); 
  const [labSaveConfirmOpen, setLabSaveConfirmOpen] = useState(false);
  const [labSaving, setLabSaving] = useState(false);
  const [newRate, setNewRate] = useState({ category_id: "", model_id: "", rate_amount: "" });

  const [thicknessList, setThicknessList] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [thFormOpen, setThFormOpen] = useState(false);
  const [thEditing, setThEditing] = useState(null);
  const [thPendingDelete, setThPendingDelete] = useState(null);
  const [thConfirmOpen, setThConfirmOpen] = useState(false);

  const [paintList, setPaintList] = useState([]);
  const [paintFormOpen, setPaintFormOpen] = useState(false);
  const [paintEditing, setPaintEditing] = useState(null);
  const [paintPendingDelete, setPaintPendingDelete] = useState(null);
  const [paintConfirmOpen, setPaintConfirmOpen] = useState(false);

  // States Tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [thPage, setThPage] = useState(1);
  const [paintPage, setPaintPage] = useState(1);

  // Lắng nghe đổi Tab từ URL
  useEffect(() => {
    if (activePanel === "settings_paint") {
      setTab("paint");
    } else if (activePanel === "settings_labor") {
      setTab("labor");
    } else {
      setTab("thickness");
    }
    // Reset mọi thứ khi đổi tab
    setThPage(1);
    setPaintPage(1);
    setSearchTerm("");
  }, [activePanel]);

  // Reset trang về 1 khi gõ tìm kiếm
  useEffect(() => {
    setThPage(1);
    setPaintPage(1);
  }, [searchTerm]);

  // ==========================================
  // LOGIC LỌC TÌM KIẾM (REAL-TIME FILTERING)
  // ==========================================
  const filteredThicknessList = useMemo(() => {
    if (!searchTerm.trim()) return thicknessList;
    const lower = searchTerm.toLowerCase();
    return thicknessList.filter((t) => 
      t.materials?.material_name?.toLowerCase().includes(lower) ||
      t.materials?.material_code?.toLowerCase().includes(lower) ||
      t.thickness_value?.toLowerCase().includes(lower)
    );
  }, [thicknessList, searchTerm]);

  const filteredPaintList = useMemo(() => {
    if (!searchTerm.trim()) return paintList;
    const lower = searchTerm.toLowerCase();
    return paintList.filter((p) => 
      p.paint_name?.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower)
    );
  }, [paintList, searchTerm]);

  const filteredLabCategories = useMemo(() => {
    if (!searchTerm.trim()) return labCategories;
    const lower = searchTerm.toLowerCase();
    return labCategories.filter((c) => 
      c.category_name?.toLowerCase().includes(lower)
    );
  }, [labCategories, searchTerm]);

  // ==========================================
  // LOGIC PHÂN TRANG (Dựa trên danh sách đã lọc)
  // ==========================================
  const paginatedThicknessList = useMemo(() => {
    const startIndex = (thPage - 1) * ITEMS_PER_PAGE;
    return filteredThicknessList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredThicknessList, thPage]);

  const totalThPages = useMemo(() => {
    return Math.ceil(filteredThicknessList.length / ITEMS_PER_PAGE);
  }, [filteredThicknessList]);

  const paginatedPaintList = useMemo(() => {
    const startIndex = (paintPage - 1) * ITEMS_PER_PAGE;
    return filteredPaintList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPaintList, paintPage]);

  const totalPaintPages = useMemo(() => {
    return Math.ceil(filteredPaintList.length / ITEMS_PER_PAGE);
  }, [filteredPaintList]);

  // Hàm đổi Tab
  const handleTabChange = (nextTab) => {
    const panelMap = {
      thickness: "settings_thickness",
      paint: "settings_paint",
      labor: "settings_labor",
    };
    navigate(`/admin/dashboard?panel=${panelMap[nextTab]}`);
  };

  // Load Data
  const loadAll = async () => {
    try {
      const [materialsRes, thRes, paintRes, labCatRes, labModelRes, labRatesRes] = await Promise.all([
        adminService.getMaterials({ page: 1, limit: 500 }),
        adminService.getMaterialThickness(),
        adminService.getPaintTypes(),
        adminService.getLaborCategories(),
        adminService.getLaborModels(),
        adminService.getLaborRates(),
      ]);

      setMaterials((materialsRes.data?.data || materialsRes.data || []).map((m) => ({ id: m.id, material_name: m.material_name })));
      setThicknessList(thRes.data?.data || thRes.data || []);
      setPaintList(paintRes.data?.data || paintRes.data || []);

      const cats = labCatRes.data?.data || labCatRes.data || [];
      const models = labModelRes.data?.data || labModelRes.data || [];
      const rates = labRatesRes.data?.data || labRatesRes.data || [];

      setLabCategories(Array.isArray(cats) ? cats : []);
      setLabModels(Array.isArray(models) ? models : []);

      const map = {};
      (rates || []).forEach((r) => {
        const cid = r.category_id;
        const mid = r.model_id;
        if (!map[cid]) map[cid] = {};
        map[cid][mid] = { id: r.id, price: Number(r.rate_amount ?? r.price ?? 0) };
      });
      setLabRatesMap(map);
      setLabEdits({});
    } catch (e) {
      showError("Không tải được dữ liệu cấu hình");
    }
  };

  useEffect(() => { loadAll(); }, []);

  // CRUD Handlers
  const handleThSave = async (form) => {
    try {
      if (thEditing?.id) { await adminService.updateMaterialThickness(thEditing.id, form); showSuccess("Cập nhật thành công"); }
      else { await adminService.createMaterialThickness(form); showSuccess("Thêm thành công"); }
      setThFormOpen(false); setThEditing(null); await loadAll();
    } catch (e) { showError(e?.response?.data?.message || e?.message || "Lưu thất bại"); }
  };

  const handlePaintSave = async (form) => {
    try {
      if (paintEditing?.id) { await adminService.updatePaintType(paintEditing.id, form); showSuccess("Cập nhật thành công"); } 
      else { await adminService.createPaintType(form); showSuccess("Thêm thành công"); }
      setPaintFormOpen(false); setPaintEditing(null); await loadAll();
    } catch (e) { showError(e?.response?.data?.message || e?.message || "Lưu thất bại"); }
  };

  const confirmThDelete = async () => {
    if (!thPendingDelete) return setThConfirmOpen(false);
    try {
      await adminService.deleteMaterialThickness(thPendingDelete.id);
      setThConfirmOpen(false); setThPendingDelete(null);
      if (paginatedThicknessList.length === 1 && thPage > 1) setThPage((prev) => prev - 1);
      await loadAll(); showSuccess("Xoá thành công");
    } catch (e) { showError(e?.response?.data?.message || e?.message || "Xoá thất bại"); }
  };

  const confirmPaintDelete = async () => {
    if (!paintPendingDelete) return setPaintConfirmOpen(false);
    try {
      await adminService.deletePaintType(paintPendingDelete.id);
      setPaintConfirmOpen(false); setPaintPendingDelete(null);
      if (paginatedPaintList.length === 1 && paintPage > 1) setPaintPage((prev) => prev - 1);
      await loadAll(); showSuccess("Xoá thành công");
    } catch (e) { showError(e?.response?.data?.message || e?.message || "Xoá thất bại"); }
  };

  const applyLabChanges = async () => {
    setLabSaveConfirmOpen(false);
    const updates = [];
    try {
      Object.keys(labEdits).forEach((cid) => {
        Object.keys(labEdits[cid]).forEach((mid) => {
          const newVal = labEdits[cid][mid];
          const existing = labRatesMap?.[cid]?.[mid]?.price;
          if (newVal !== "" && Number(newVal) !== Number(existing)) {
            updates.push({ category_id: cid, model_id: mid, rate_amount: Number(newVal) });
          }
        });
      });

      if (updates.length === 0) { showSuccess("Không có thay đổi nào."); setLabEdits({}); return; }
      setLabSaving(true);
      await Promise.all(updates.map((u) => adminService.setLaborRate(u)));
      showSuccess("Cập nhật đơn giá nhân công thành công.");
      await loadAll();
    } catch (e) { showError(e?.response?.data?.message || e?.message || "Cập nhật thất bại"); } 
    finally { setLabSaving(false); }
  };

  return (
    <div className="space-y-6">
      
      {/* VIEW: HỆ SỐ ĐỘ DÀY */}
      {tab === "thickness" && (
        <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 bg-surface-container/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">Danh sách Hệ số</h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {filteredThicknessList.length} bản ghi
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* THANH TÌM KIẾM */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input 
                  type="text"
                  placeholder="Tìm vật tư, độ dày..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-56 h-10 bg-white border border-outline-variant/60 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                onClick={() => { setThEditing(null); setThFormOpen(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary h-10 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Thêm hệ số</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  <th className="p-4 pl-6">Vật tư áp dụng</th>
                  <th className="p-4 w-[160px]">Kích thước Độ dày</th>
                  <th className="p-4 w-[140px]">Hệ số nhân</th>
                  <th className="p-4 pr-6 text-center w-[160px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25 text-sm">
                {paginatedThicknessList.map((t) => (
                  <ThicknessRow
                    key={t.id}
                    item={t}
                    onEdit={(it) => { setThEditing(it); setThFormOpen(true); }}
                    onDelete={(it) => { setThPendingDelete(it); setThConfirmOpen(true); }}
                  />
                ))}
                {filteredThicknessList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-on-surface-variant/60 font-medium">Không tìm thấy hệ số nào phù hợp</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredThicknessList.length > ITEMS_PER_PAGE && (
            <div className="border-t border-outline-variant/40 px-4 md:px-5 py-3 flex justify-end bg-surface-container/10">
              <Pagination currentPage={thPage} totalPages={totalThPages} onPageChange={setThPage} />
            </div>
          )}
        </div>
      )}

      {/* VIEW: ĐƠN GIÁ SƠN */}
      {tab === "paint" && (
        <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 bg-surface-container/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">Bảng Đơn giá Sơn</h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {filteredPaintList.length} bản ghi
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* THANH TÌM KIẾM */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input 
                  type="text"
                  placeholder="Tìm loại sơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-56 h-10 bg-white border border-outline-variant/60 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                onClick={() => { setPaintEditing(null); setPaintFormOpen(true); }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary h-10 px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Thêm đơn giá</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  <th className="p-4 pl-6">Tên/Loại sơn bảo vệ</th>
                  <th className="p-4 w-[180px]">Đơn giá (VNĐ/m²)</th>
                  <th className="p-4">Mô tả chi tiết</th>
                  <th className="p-4 pr-6 text-center w-[160px]">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25 text-sm">
                {paginatedPaintList.map((p) => (
                  <PaintRow
                    key={p.id}
                    item={p}
                    onEdit={(it) => { setPaintEditing(it); setPaintFormOpen(true); }}
                    onDelete={(it) => { setPaintPendingDelete(it); setPaintConfirmOpen(true); }}
                  />
                ))}
                {filteredPaintList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-on-surface-variant/60 font-medium">Không tìm thấy loại sơn nào phù hợp</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPaintList.length > ITEMS_PER_PAGE && (
            <div className="border-t border-outline-variant/40 px-4 md:px-5 py-3 flex justify-end bg-surface-container/10">
              <Pagination currentPage={paintPage} totalPages={totalPaintPages} onPageChange={setPaintPage} />
            </div>
          )}
        </div>
      )}

      {/* VIEW: GIÁ NHÂN CÔNG */}
      {tab === "labor" && (
        <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 bg-surface-container/10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Form Thêm nhanh */}
            <div className="flex flex-wrap items-center gap-3">
              <LaborCategorySelect
                value={newRate.category_id}
                onChange={(selectedId) => setNewRate({ ...newRate, category_id: selectedId })}
                categories={labCategories}
              />
              <select
                value={newRate.model_id}
                onChange={(e) => setNewRate({ ...newRate, model_id: e.target.value })}
                className="h-10 rounded-xl border border-outline-variant/60 bg-white px-3 text-[13px] font-semibold outline-none focus:border-primary min-w-[160px]"
              >
                <option value="">-- Mức độ --</option>
                {labModels.map((m) => (<option key={m.id} value={m.id}>{m.model_name}</option>))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" step="1" placeholder="Nhập giá (VNĐ)"
                  value={newRate.rate_amount}
                  onChange={(e) => setNewRate({ ...newRate, rate_amount: e.target.value })}
                  className="h-10 w-36 rounded-xl border border-outline-variant/60 bg-white px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={async () => {
                    if (!newRate.category_id || !newRate.model_id || newRate.rate_amount === "") return showError("Vui lòng điền đầy đủ");
                    try {
                      await adminService.setLaborRate({ category_id: newRate.category_id, model_id: newRate.model_id, rate_amount: Number(newRate.rate_amount) });
                      showSuccess("Thêm đơn giá thành công");
                      setNewRate({ category_id: "", model_id: "", rate_amount: "" });
                      await loadAll();
                    } catch (e) { showError(e?.response?.data?.message || e?.message || "Thêm thất bại"); }
                  }}
                  className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm shrink-0"
                  title="Thêm nhanh"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions & Search */}
            <div className="flex items-center gap-3">
              {/* THANH TÌM KIẾM */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input 
                  type="text"
                  placeholder="Tìm nhóm thợ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-44 h-10 bg-white border border-outline-variant/60 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                onClick={() => { setLabEdits({}); showSuccess("Đã huỷ thay đổi"); }}
                className="inline-flex items-center gap-2 h-10 rounded-xl border border-outline-variant/60 bg-white px-4 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" /> Khôi phục
              </button>
              <button
                onClick={() => setLabSaveConfirmOpen(true)}
                className="inline-flex items-center gap-2 h-10 rounded-xl bg-amber-500 px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-amber-600 transition-colors"
              >
                <Save className="w-4 h-4" /> Lưu tất cả
              </button>
            </div>
          </div>

          {/* Search bar cho Mobile (vì trên kia bị hidden trên md) */}
          <div className="px-4 md:hidden py-3 border-b border-outline-variant/50 bg-surface-container/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
              <input 
                type="text"
                placeholder="Tìm nhóm thợ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full h-10 bg-white border border-outline-variant/60 rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  <th className="p-4 pl-6 w-[200px]">Nhóm Thợ</th>
                  {labModels.map((m) => (
                    <th key={m.id} className="p-4">{m.model_name}</th>
                  ))}
                  <th className="p-4 pr-6 text-center w-[220px]">Tác vụ Hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/25 text-sm">
                {filteredLabCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-container/10 transition-colors">
                    <td className="p-4 pl-6 font-black text-on-surface">{cat.category_name}</td>
                    {labModels.map((m) => {
                      const staged = labEdits?.[cat.id]?.[m.id];
                      const existing = labRatesMap?.[cat.id]?.[m.id]?.price;
                      const value = typeof staged !== "undefined" ? staged : typeof existing !== "undefined" ? existing : "";
                      const isEdited = typeof staged !== "undefined" && staged !== existing;

                      return (
                        <td key={m.id} className="p-3">
                          <input
                            type="number" min="0" step="1"
                            className={`w-full h-10 rounded-xl border px-3 text-[13px] font-bold outline-none transition-colors ${
                              isEdited ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-transparent border-transparent hover:border-outline-variant/40 focus:bg-white focus:border-primary"
                            }`}
                            placeholder="Chưa có giá"
                            value={value}
                            onChange={(e) => {
                              const v = e.target.value === "" ? "" : Number(e.target.value);
                              setLabEdits((prev) => {
                                const copy = { ...prev };
                                if (!copy[cat.id]) copy[cat.id] = {};
                                copy[cat.id][m.id] = v;
                                return copy;
                              });
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={async () => {
                            const row = labEdits?.[cat.id] || {};
                            const calls = [];
                            Object.keys(row).forEach((mid) => {
                              const v = row[mid];
                              if (v === "") return;
                              calls.push(adminService.setLaborRate({ category_id: cat.id, model_id: mid, rate_amount: Number(v) }));
                            });
                            if (calls.length === 0) return showError("Không có thay đổi để lưu");
                            try {
                              await Promise.all(calls);
                              showSuccess("Cập nhật thành công");
                              await loadAll();
                            } catch (e) { showError("Cập nhật thất bại"); }
                          }}
                          className="rounded-lg bg-surface-container border border-outline-variant/50 p-2 text-primary hover:bg-primary hover:text-white transition-colors"
                          title="Lưu hàng này"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setLabEdits((prev) => { const copy = { ...prev }; delete copy[cat.id]; return copy; });
                            showSuccess("Đã hoàn tác");
                          }}
                          className="rounded-lg border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
                          title="Hoàn tác thay đổi chưa lưu"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const existingMap = labRatesMap?.[cat.id] || {};
                            const ids = Object.keys(existingMap).map((k) => existingMap[k].id).filter(Boolean);
                            if (ids.length === 0) return showError("Trống sẵn");
                            try {
                              await Promise.all(ids.map((id) => adminService.deleteLaborRate(id)));
                              showSuccess("Xoá thành công");
                              await loadAll();
                            } catch (e) { showError("Xoá thất bại"); }
                          }}
                          className="rounded-lg border border-outline-variant/60 p-2 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                          title="Xóa toàn bộ giá trên hàng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLabCategories.length === 0 && (
                  <tr><td colSpan={labModels.length + 2} className="p-8 text-center text-sm font-medium text-on-surface-variant/60">Không tìm thấy nhóm thợ phù hợp</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRM MODALS */}
      <ConfirmModal
        open={thConfirmOpen} title="Xác nhận Xoá" message={`Xóa hệ số của độ dày ${thPendingDelete?.thickness_value || ""}?`}
        onConfirm={confirmThDelete} onCancel={() => setThConfirmOpen(false)}
      />
      <ConfirmModal
        open={paintConfirmOpen} title="Xác nhận Xoá" message={`Xóa bảng giá sơn ${paintPendingDelete?.paint_name || ""}?`}
        onConfirm={confirmPaintDelete} onCancel={() => setPaintConfirmOpen(false)}
      />
      <ConfirmModal
        open={labSaveConfirmOpen} title="Áp dụng Đơn giá Nhân công"
        message="Hệ số mới sẽ lập tức ảnh hưởng đến các báo giá được tạo từ lúc này. Bạn chắc chắn muốn áp dụng thay đổi?"
        onConfirm={applyLabChanges} onCancel={() => setLabSaveConfirmOpen(false)}
        confirmText="Lưu ngay"
      />

      {/* PORTAL FORMS */}
      {thFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-outline-variant/50 px-6 py-5 bg-surface-container/10">
                <div className="flex items-center gap-3">
                  <Component className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                    {thEditing ? "Sửa Hệ số" : "Thêm Hệ số"}
                  </h3>
                </div>
                <button onClick={() => { setThFormOpen(false); setThEditing(null); }} className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container transition-colors"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid gap-5 px-6 py-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Vật tư định mức</label>
                  <select
                    className="w-full h-12 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary"
                    value={thEditing?.material_id || ""}
                    onChange={(e) => setThEditing(prev => ({ ...(prev || {}), material_id: e.target.value }))}
                  >
                    <option value="">-- Chọn vật tư --</option>
                    {materials.map((m) => (<option key={m.id} value={m.id}>{m.material_name}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Kích thước Độ dày</label>
                  <input
                    className="w-full h-12 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary"
                    value={thEditing?.thickness_value || ""}
                    onChange={(e) => setThEditing(prev => ({ ...(prev || {}), thickness_value: e.target.value }))}
                    placeholder="VD: 1.2ly"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Hệ số nhân Giá</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    className="w-full h-12 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary"
                    value={thEditing?.price_multiplier || ""}
                    onChange={(e) => setThEditing(prev => ({ ...(prev || {}), price_multiplier: e.target.value }))}
                    placeholder="VD: 1.15"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
                <button onClick={() => { setThFormOpen(false); setThEditing(null); }} className="rounded-xl border border-outline-variant/60 px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Hủy
                </button>
                <button 
                  onClick={() => handleThSave(thEditing)}
                  disabled={!thEditing?.material_id || !thEditing?.thickness_value || !thEditing?.price_multiplier}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {paintFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-outline-variant/50 px-6 py-5 bg-surface-container/10">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                    {paintEditing ? "Sửa Đơn Giá Sơn" : "Thêm Loại Sơn"}
                  </h3>
                </div>
                <button onClick={() => { setPaintFormOpen(false); setPaintEditing(null); }} className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container transition-colors"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid gap-5 px-6 py-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Tên loại sơn</label>
                  <input
                    className="w-full h-12 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary"
                    value={paintEditing?.paint_name || ""}
                    onChange={(e) => setPaintEditing(prev => ({ ...(prev || {}), paint_name: e.target.value }))}
                    placeholder="VD: Sơn lót xám"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Đơn giá thi công (VNĐ/m²)</label>
                  <input
                    type="number" min="0" step="1000"
                    className="w-full h-12 rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary"
                    value={paintEditing?.price_per_sqm || ""}
                    onChange={(e) => setPaintEditing(prev => ({ ...(prev || {}), price_per_sqm: e.target.value }))}
                    placeholder="VD: 55000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 p-4 text-sm font-semibold outline-none transition-colors focus:bg-white focus:border-primary resize-none"
                    value={paintEditing?.description || ""}
                    onChange={(e) => setPaintEditing(prev => ({ ...(prev || {}), description: e.target.value }))}
                    placeholder="Mô tả mục đích sử dụng..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
                <button onClick={() => { setPaintFormOpen(false); setPaintEditing(null); }} className="rounded-xl border border-outline-variant/60 px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                  Hủy
                </button>
                <button 
                  onClick={() => handlePaintSave(paintEditing)}
                  disabled={!paintEditing?.paint_name || !paintEditing?.price_per_sqm}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >Lưu dữ liệu</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default ManageSettings;