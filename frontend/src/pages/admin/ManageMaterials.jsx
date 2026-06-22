import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import adminService from "../../services/admin.service";
import Portal from "../../components/common/Portal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { showError, showSuccess } from "../../utils/notify";
import Pagination from "../../components/common/Pagination";

const formatMoney = new Intl.NumberFormat("vi-VN");

const normalizeMaterial = (item) => ({
  id: item.id,
  type_id: item.type_id || "",
  unit_id: item.unit_id || "",
  material_code: item.material_code || "",
  material_name: item.material_name || "",
  base_price: Number(item.base_price ?? 0),
  type_name: item.material_types?.type_name || "-",
  unit_name: item.material_units?.unit_name || "-",
});

function MaterialModal({
  initial,
  materialTypes,
  materialUnits,
  loading,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState({
    type_id: initial?.type_id || "",
    unit_id: initial?.unit_id || "",
    material_code: initial?.material_code || "",
    material_name: initial?.material_name || "",
    base_price: initial?.base_price ?? "",
  });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setForm({
      type_id: initial?.type_id || "",
      unit_id: initial?.unit_id || "",
      material_code: initial?.material_code || "",
      material_name: initial?.material_name || "",
      base_price: initial?.base_price ?? "",
    });
    setTouched(false);
  }, [initial]);

  const priceValue = form.base_price === "" ? "" : Number(form.base_price);
  const hasNegativePrice =
    form.base_price !== "" && !Number.isNaN(priceValue) && priceValue < 0;
  const hasInvalidPrice = form.base_price !== "" && Number.isNaN(priceValue);
  const canSubmit =
    !!form.type_id &&
    !!form.unit_id &&
    form.material_code.trim() &&
    form.material_name.trim() &&
    form.base_price !== "" &&
    !hasNegativePrice &&
    !hasInvalidPrice &&
    !loading;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSave({
      ...form,
      material_code: form.material_code.trim(),
      material_name: form.material_name.trim(),
      base_price: Number(form.base_price),
    });
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial?.id ? "Sửa vật tư" : "Thêm vật tư mới"}
              </h3>
              <p className="mt-2 text-xs text-on-surface-variant/70">
                Quản lý master data vật tư thô cho kho dữ liệu đầu vào của
                Pricing Engine.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Loại vật tư
              </label>
              <select
                value={form.type_id}
                onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Chọn loại vật tư</option>
                {materialTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.type_name}
                  </option>
                ))}
              </select>
              {touched && !form.type_id ? (
                <p className="text-xs text-rose-600">
                  Bắt buộc chọn loại vật tư.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Đơn vị tính
              </label>
              <select
                value={form.unit_id}
                onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Chọn đơn vị tính</option>
                {materialUnits.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.unit_name}
                  </option>
                ))}
              </select>
              {touched && !form.unit_id ? (
                <p className="text-xs text-rose-600">
                  Bắt buộc chọn đơn vị tính.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Mã vật tư
              </label>
              <input
                value={form.material_code}
                onChange={(e) =>
                  setForm({ ...form, material_code: e.target.value })
                }
                placeholder="VD: VT-THEP-4080"
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
              {touched && !form.material_code.trim() ? (
                <p className="text-xs text-rose-600">
                  Mã vật tư không được để trống.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Tên vật tư
              </label>
              <input
                value={form.material_name}
                onChange={(e) =>
                  setForm({ ...form, material_name: e.target.value })
                }
                placeholder="VD: Thép hộp mạ kẽm 40x80"
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
              {touched && !form.material_name.trim() ? (
                <p className="text-xs text-rose-600">
                  Tên vật tư không được để trống.
                </p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Giá gốc / Đơn vị (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.base_price}
                onChange={(e) =>
                  setForm({ ...form, base_price: e.target.value })
                }
                placeholder="VD: 125000"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${hasNegativePrice
                    ? "border-rose-500 bg-rose-50 focus:border-rose-500"
                    : "border-outline-variant/60 bg-surface-container/20 focus:border-primary"
                  }`}
              />
              {hasNegativePrice ? (
                <p className="text-xs text-rose-600">Giá gốc không được âm.</p>
              ) : touched && hasInvalidPrice ? (
                <p className="text-xs text-rose-600">
                  Vui lòng nhập giá hợp lệ.
                </p>
              ) : null}
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
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading
                ? "Đang lưu..."
                : initial?.id
                  ? "Cập nhật vật tư"
                  : "Lưu vật tư"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const ManageMaterials = () => {
  const [items, setItems] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [materialUnits, setMaterialUnits] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
      const [typesRes, unitsRes, materialsRes] = await Promise.all([
        adminService.getMaterialTypes(),
        adminService.getMaterialUnits(),
        adminService.getMaterials({ page: 1, limit: 500 }),
      ]);

      setMaterialTypes(
        Array.isArray(typesRes.data?.data) ? typesRes.data.data : [],
      );
      setMaterialUnits(
        Array.isArray(unitsRes.data?.data) ? unitsRes.data.data : [],
      );

      const materialData = materialsRes.data?.data || [];
      setItems(
        Array.isArray(materialData) ? materialData.map(normalizeMaterial) : [],
      );
    } catch (e) {
      setItems([]);
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Không tải được danh sách vật tư",
      );
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
      const matchesSearch =
        !keyword ||
        `${item.material_code} ${item.material_name}`
          .toLowerCase()
          .includes(keyword);
      const matchesType = !typeFilter || item.type_id === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = useMemo(() => {
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    setPendingDelete(item);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return setShowConfirmDelete(false);

    try {
      await adminService.deleteMaterial(pendingDelete.id);
      await loadInitialData();
      setShowConfirmDelete(false);
      setPendingDelete(null);
      showSuccess("Xoá vật tư thành công.");
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Xoá vật tư thất bại",
      );
    }
  };

  const handleSave = async (form) => {
    setFormLoading(true);
    try {
      const payload = {
        type_id: form.type_id,
        unit_id: form.unit_id,
        material_code: form.material_code,
        material_name: form.material_name,
        base_price: form.base_price,
      };

      if (editing?.id) {
        await adminService.updateMaterial(editing.id, payload);
      } else {
        await adminService.createMaterial(payload);
      }

      await loadInitialData();
      setShowForm(false);
      setEditing(null);
      showSuccess(
        editing?.id ? "Cập nhật vật tư thành công." : "Thêm vật tư thành công.",
      );
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Lưu vật tư thất bại",
      );
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
                Quản lý vật tư
              </h2>
              <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
                {items.length} vật tư
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/65">
              Quản lý master data vật tư thô: mã, tên, loại vật tư, đơn vị tính
              và giá gốc.
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block w-[220px] md:w-[260px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/45" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mã vật tư, tên..."
                className="w-full rounded-full border border-outline-variant/60 bg-surface-container/20 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setPage(1);
                loadInitialData();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-3.5 py-2 text-xs font-bold hover:bg-surface-container transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Tải lại</span>
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm vật tư</span>
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
          </div>

          <div className="text-xs font-semibold text-on-surface-variant/70">
            Hiển thị {pagedItems.length} / {filteredItems.length} vật tư từ
            backend
          </div>
        </div>

        {error ? (
          <div className="mx-4 md:mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[80px]">STT</th>
                <th className="p-4 w-[140px]">Mã vật tư</th>
                <th className="p-4">Tên vật tư</th>
                <th className="p-4">Loại vật tư</th>
                <th className="p-4">Đơn vị tính</th>
                <th className="p-4">Giá gốc</th>
                <th className="p-4 pr-6 text-center w-[120px]">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-on-surface-variant/60"
                  >
                    Đang tải vật tư từ backend...
                  </td>
                </tr>
              ) : null}

              {pagedItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface-container/20 transition-colors"
                >
                  <td className="p-4 pl-6 font-mono text-xs text-on-surface-variant/70">
                    {(page - 1) * pageSize + idx + 1 < 10
                      ? `0${(page - 1) * pageSize + idx + 1}`
                      : (page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-md bg-surface-container px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                      {item.material_code}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-on-surface">
                      {item.material_name}
                    </div>
                  </td>
                  <td className="p-4 text-on-surface-variant/80">
                    {item.type_name}
                  </td>
                  <td className="p-4 text-on-surface-variant/80">
                    {item.unit_name}
                  </td>
                  <td className="p-4 text-on-surface-variant/70 font-semibold">
                    {formatMoney.format(item.base_price)} đ
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
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
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-on-surface-variant/60"
                  >
                    Không tìm thấy vật tư phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-outline-variant/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div className="text-xs font-semibold text-on-surface-variant/70">
            Dữ liệu được lấy trực tiếp từ backend: materials, material_types,
            material_units.
          </div>
          <div className="p-4 border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/10">
            <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider">
              Trang {Math.min(page, totalPages)} / {totalPages} (Tổng cộng{" "}
              {filteredItems.length} kết quả)
            </p>
            <div className="flex items-center overflow-x-auto max-w-full">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        </div>
      </div>

      {showForm ? (
        <MaterialModal
          initial={editing}
          materialTypes={materialTypes}
          materialUnits={materialUnits}
          loading={formLoading}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmModal
        open={showConfirmDelete}
        title="Xác nhận xoá vật tư"
        message={
          pendingDelete
            ? `Bạn chắc chắn muốn xoá vật tư ${pendingDelete.material_code} - ${pendingDelete.material_name}?`
            : "Bạn chắc chắn muốn xoá vật tư này?"
        }
        confirmText="Xoá"
        cancelText="Hủy"
        onCancel={() => {
          setShowConfirmDelete(false);
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ManageMaterials;
