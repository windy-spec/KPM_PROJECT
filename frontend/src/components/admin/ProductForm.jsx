import React, { useEffect, useMemo, useState } from "react";
import Portal from "../common/Portal";
import { ImagePlus, Tag, X } from "lucide-react";

const ProductForm = ({ initial = {}, categories = [], onCancel, onSave }) => {
  const [form, setForm] = useState({
    product_code: "",
    product_name: "",
    category_id: "",
    default_specs: "",
    components: "",
    ...initial,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial.image || "");
  const [secondaryFiles, setSecondaryFiles] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  const [existingSecondary, setExistingSecondary] = useState([]);
  const [parentCategoryId, setParentCategoryId] = useState("");

  useEffect(() => {
    setExistingSecondary(
      initial.images?.filter((img) => !img.is_primary) || [],
    );
  }, [initial.images]);

  useEffect(() => {
    if (initial.category_id && categories.length > 0) {
      const selectedCategory = categories.find(
        (c) => (c.id || c._id) === initial.category_id,
      );
      if (selectedCategory && selectedCategory.parent_id) {
        setParentCategoryId(selectedCategory.parent_id);
      } else if (
        selectedCategory &&
        (selectedCategory.level === 0 || !selectedCategory.parent_id)
      ) {
        setParentCategoryId(selectedCategory.id || selectedCategory._id);
      } else {
        setParentCategoryId("");
      }
    } else {
      setParentCategoryId("");
    }
  }, [initial.id, initial.category_id, categories]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      ...initial,
      default_specs:
        typeof initial.default_specs === "string"
          ? initial.default_specs
          : initial.default_specs
            ? JSON.stringify(initial.default_specs, null, 2)
            : "",
    }));
    setImagePreview(initial.image || "");
    setImageFile(null);
    setSecondaryFiles([]);
    setDeletedImageIds([]);
  }, [initial]);

  const handleRemoveSecondaryFile = (index) => {
    setSecondaryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingSecondary = (id) => {
    setDeletedImageIds((prev) => [...prev, id]);
    setExistingSecondary((prev) => prev.filter((img) => img.id !== id));
  };

  useEffect(() => {
    if (!imageFile) return undefined;

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const previewLabel = useMemo(() => {
    if (imageFile) return imageFile.name;
    if (initial.image) return "Ảnh hiện tại";
    return "Chưa chọn ảnh";
  }, [imageFile, initial.image]);

  const isEditing = Boolean(initial.id);

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm py-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] flex flex-col max-h-full">
          <div className="border-b border-outline-variant/50 px-6 py-5 shrink-0">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial.id ? "Sửa sản phẩm" : "Tạo sản phẩm"}
              </h3>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/70">
              Dữ liệu đang được cập nhật và hiển thị theo thời gian thực. Bạn có
              thể chỉnh sửa và lưu lại khi hoàn tất.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Ảnh đại diện (Ảnh chính)
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/20">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Xem trước ảnh sản phẩm"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-on-surface-variant/60">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs font-semibold">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-primary hover:bg-primary/10 transition-colors">
                    <ImagePlus className="h-4 w-4" />
                    Chọn ảnh sản phẩm
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <div className="rounded-xl border border-outline-variant/60 bg-white px-4 py-3 text-xs text-on-surface-variant/75">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{previewLabel}</span>
                      {imageFile ? (
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="inline-flex items-center gap-1 rounded-full border border-outline-variant/50 px-2 py-1 font-bold hover:bg-surface-container"
                        >
                          <X className="h-3.5 w-3.5" />
                          Xóa chọn
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant/60">
                      Ảnh sẽ được upload riêng sau khi lưu sản phẩm xong. Bạn có
                      thể chọn JPG/PNG/WebP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-outline-variant/40 pt-4">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Ảnh phụ (Các góc khác, chi tiết)
              </label>

              <div className="flex flex-wrap gap-3">
                {existingSecondary.map((img) => (
                  <div
                    key={img.id}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container/20 group"
                  >
                    <img
                      src={img.image_url}
                      alt="Ảnh phụ"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingSecondary(img.id)}
                      className="absolute top-1 right-1 rounded-full bg-slate-900/50 p-1 text-white hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {secondaryFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container/20"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Ảnh phụ mới"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryFile(idx)}
                      className="absolute top-1 right-1 rounded-full bg-slate-900/50 p-1 text-white hover:bg-rose-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSecondaryFiles((prev) => [
                          ...prev,
                          ...Array.from(e.target.files),
                        ]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Mã sản phẩm
                </label>
                <input
                  value={form.product_code || ""}
                  onChange={(e) =>
                    setForm({ ...form, product_code: e.target.value })
                  }
                  placeholder="VD: SP-001"
                  readOnly={isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isEditing
                      ? "border-outline-variant/60 bg-surface-container/40 text-on-surface-variant cursor-not-allowed"
                      : "border-outline-variant/60 bg-surface-container/20 focus:border-primary"
                  }`}
                />
                {isEditing ? (
                  <p className="text-[11px] text-on-surface-variant/60">
                    Mã sản phẩm được giữ cố định khi sửa.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Tên sản phẩm
                </label>
                <input
                  value={form.product_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, product_name: e.target.value })
                  }
                  placeholder="VD: Cổng sắt CNC hoa văn"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Danh mục cha
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => {
                    const newParentId = e.target.value;
                    setParentCategoryId(newParentId);
                    const children = categories.filter(
                      (child) => child.parent_id === newParentId,
                    );
                    setForm({
                      ...form,
                      category_id:
                        children.length > 0
                          ? children[0].id || children[0]._id
                          : "",
                    });
                  }}
                  disabled={isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isEditing
                      ? "border-outline-variant/60 bg-surface-container/40 text-on-surface-variant cursor-not-allowed"
                      : "border-outline-variant/60 bg-surface-container/20 focus:border-primary"
                  }`}
                >
                  <option value="">Chọn danh mục cha</option>
                  {categories
                    .filter((c) => c.level === 0 || !c.parent_id)
                    .map((parent) => (
                      <option
                        key={parent.id || parent._id}
                        value={parent.id || parent._id}
                      >
                        {parent.category_name || parent.name || parent.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Danh mục con
                </label>
                <select
                  value={form.category_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  disabled={
                    !parentCategoryId ||
                    categories.filter(
                      (child) => child.parent_id === parentCategoryId,
                    ).length === 0
                  }
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categories
                    .filter((child) => child.parent_id === parentCategoryId)
                    .map((child) => (
                      <option
                        key={child.id || child._id}
                        value={child.id || child._id}
                      >
                        {child.category_name || child.name || child.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Default specs
                </label>
                <textarea
                  value={form.default_specs || ""}
                  onChange={(e) =>
                    setForm({ ...form, default_specs: e.target.value })
                  }
                  placeholder='VD: {"height": 2200, "width": 1800, "material": "Sắt hộp"}'
                  rows={5}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary font-mono"
                />
                <p className="text-[11px] text-on-surface-variant/60">
                  Nhập JSON dạng text (không bắt buộc).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Components (Các bộ phận)
                </label>
                <textarea
                  value={form.components || ""}
                  onChange={(e) =>
                    setForm({ ...form, components: e.target.value })
                  }
                  placeholder='VD: [{"name": "Cánh cổng", "quantity": 2}]'
                  rows={5}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary font-mono"
                />
                <p className="text-[11px] text-on-surface-variant/60">
                  Nhập JSON mảng (Array) các bộ phận.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() =>
                onSave(form, imageFile, secondaryFiles, deletedImageIds)
              }
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors"
            >
              Lưu sản phẩm
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ProductForm;
