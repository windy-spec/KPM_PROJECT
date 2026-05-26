import React, { useEffect, useMemo, useState } from 'react';
import Portal from '../common/Portal';
import { ImagePlus, Tag, X } from 'lucide-react';

const ProductForm = ({ initial = {}, categories = [], onCancel, onSave }) => {
  const [form, setForm] = useState({
    product_code: '',
    product_name: '',
    category_id: '',
    default_specs: '',
    ...initial,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial.image || '');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      ...initial,
      default_specs:
        typeof initial.default_specs === 'string'
          ? initial.default_specs
          : initial.default_specs
            ? JSON.stringify(initial.default_specs, null, 2)
            : '',
    }));
    setImagePreview(initial.image || '');
    setImageFile(null);
  }, [initial]);

  useEffect(() => {
    if (!imageFile) return undefined;

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const previewLabel = useMemo(() => {
    if (imageFile) return imageFile.name;
    if (initial.image) return 'Ảnh hiện tại';
    return 'Chưa chọn ảnh';
  }, [imageFile, initial.image]);

  const isEditing = Boolean(initial.id);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial.id ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
              </h3>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/70">
              Dữ liệu đang bám theo schema thật của backend: code, tên, danh mục và default_specs.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Ảnh sản phẩm
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/20">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Xem trước ảnh sản phẩm" className="h-full w-full object-cover" />
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
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
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
                      Ảnh sẽ được upload riêng sau khi lưu sản phẩm xong. Bạn có thể chọn JPG/PNG/WebP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Mã sản phẩm
                </label>
                <input
                  value={form.product_code || ''}
                  onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                  placeholder="VD: SP-001"
                  readOnly={isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isEditing
                      ? 'border-outline-variant/60 bg-surface-container/40 text-on-surface-variant cursor-not-allowed'
                      : 'border-outline-variant/60 bg-surface-container/20 focus:border-primary'
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
                  value={form.product_name || ''}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  placeholder="VD: Cổng sắt CNC hoa văn"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Danh mục
              </label>
              <select
                value={form.category_id || ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id || category._id} value={category.id || category._id}>
                    {category.category_code || category.code || '-'} - {category.category_name || category.name || 'Danh mục'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                Default specs
              </label>
              <textarea
                value={form.default_specs || ''}
                onChange={(e) => setForm({ ...form, default_specs: e.target.value })}
                placeholder='VD: {"height": 2200, "width": 1800, "material": "Sắt hộp"}'
                rows={6}
                className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary font-mono"
              />
              <p className="text-[11px] text-on-surface-variant/60">
                Có thể nhập JSON dạng text hoặc để trống nếu chưa có thông số mặc định.
              </p>
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
              onClick={() => onSave(form, imageFile)}
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
