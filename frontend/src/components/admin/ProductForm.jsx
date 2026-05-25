import React, { useEffect, useState } from 'react';
import Portal from '../common/Portal';
import { Tag } from 'lucide-react';

const ProductForm = ({ initial = {}, categories = [], onCancel, onSave }) => {
  const [form, setForm] = useState({
    product_code: '',
    product_name: '',
    category_id: '',
    default_specs: '',
    ...initial,
  });

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
  }, [initial]);

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Mã sản phẩm
                </label>
                <input
                  value={form.product_code || ''}
                  onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                  placeholder="VD: SP-001"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
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
              onClick={() => onSave(form)}
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
