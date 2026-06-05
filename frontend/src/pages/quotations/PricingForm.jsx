import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import adminService from '../../services/admin.service';
import { showError, showSuccess } from '../../utils/notify';

// PricingForm: left = dynamic items, right = bill preview
export default function PricingForm() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [thicknessList, setThicknessList] = useState([]);
  const [paints, setPaints] = useState([]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quotePreview, setQuotePreview] = useState(null);

  useEffect(() => { loadLookups(); addItem(); }, []);

  async function loadLookups() {
    try {
      const [prodRes, matRes, thRes, paintRes] = await Promise.all([
        adminService.getProducts({ page: 1, limit: 200 }),
        adminService.getMaterials({ page: 1, limit: 500 }),
        adminService.getMaterialThickness(),
        adminService.getPaintTypes(),
      ]);

      setProducts(prodRes.data?.data || prodRes.data || []);
      setMaterials((matRes.data?.data || matRes.data || []).map(m=>({ id: m.id, material_name: m.material_name })));
      setThicknessList(thRes.data?.data || thRes.data || []);
      setPaints(paintRes.data?.data || paintRes.data || []);
    } catch (e) {
      showError('Không tải được dữ liệu lookup');
    }
  }

  function addItem() {
    setItems(prev => [...prev, { id: Date.now(), product_id: '', width: '', height: '', material_id: '', thickness_value: '', paint_id: '', note: '' }]);
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id));
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  function validateAll() {
    if (items.length === 0) return false;
    for (const it of items) {
      if (!it.product_id) return false;
      const w = Number(it.width);
      const h = Number(it.height);
      if (!w || !h || w <= 0 || h <= 0) return false;
      if (!it.material_id) return false;
      if (!it.thickness_value) return false;
      if (!it.paint_id) return false;
    }
    return true;
  }

  function thicknessOptionsFor(materialId) {
    return thicknessList.filter(t => String(t.material_id) === String(materialId));
  }

  async function handleCalculate() {
    if (!validateAll()) return showError('Vui lòng kiểm tra dữ liệu nhập: kích thước > 0 và điền đầy đủ trường bắt buộc.');
    const payload = { items: items.map(it => ({ product_id: it.product_id, width: Number(it.width), height: Number(it.height), material_id: it.material_id, thickness_value: it.thickness_value, paint_id: it.paint_id, note: it.note })) };
    setLoading(true);
    try {
      const res = await adminService.calculateQuotation(payload);
      setQuotePreview(res.data?.data || res.data || null);
      showSuccess('Tính báo giá thành công (xem bên phải)');
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Tính báo giá thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em]">Lập Báo giá tự động</h3>
            <p className="mt-1 text-xs text-on-surface-variant/65">Nhập thông số kích thước và vật tư; hệ thống sẽ tính toán và trả về báo giá tạm thời.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={addItem} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"> <Plus className="h-4 w-4"/> <span className="hidden sm:inline">Thêm Sản Phẩm Mới</span></button>
            <button onClick={handleCalculate} disabled={!validateAll() || loading} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-amber-600 transition-colors">{loading ? 'Đang tính...' : 'TÍNH TOÁN & LÊN BÁO GIÁ'}</button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((it, idx) => (
            <div key={it.id} className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-8 text-sm font-mono text-on-surface-variant/75">#{idx+1}</div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Sản phẩm</label>
                    <select className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.product_id} onChange={(e)=>updateItem(it.id, { product_id: e.target.value })}>
                      <option value="">Chọn sản phẩm</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.product_name || p.name || p.id}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Rộng (m)</label>
                      <input type="number" min="0.01" step="0.01" className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.width} onChange={(e)=>updateItem(it.id, { width: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Cao (m)</label>
                      <input type="number" min="0.01" step="0.01" className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.height} onChange={(e)=>updateItem(it.id, { height: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Loại Vật Tư</label>
                    <select className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.material_id} onChange={(e)=>{ updateItem(it.id, { material_id: e.target.value, thickness_value: '' }); }}>
                      <option value="">Chọn vật tư</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Độ dày</label>
                    <select className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.thickness_value} onChange={(e)=>updateItem(it.id, { thickness_value: e.target.value })}>
                      <option value="">Chọn độ dày</option>
                      {thicknessOptionsFor(it.material_id).map(t => <option key={t.id} value={t.thickness_value}>{t.thickness_value}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Sơn bề mặt</label>
                    <select className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.paint_id} onChange={(e)=>updateItem(it.id, { paint_id: e.target.value })}>
                      <option value="">Chọn sơn</option>
                      {paints.map(p => <option key={p.id} value={p.id}>{p.paint_name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Ghi chú</label>
                    <input className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none focus:border-primary" value={it.note} onChange={(e)=>updateItem(it.id, { note: e.target.value })} />
                  </div>
                </div>

                <div>
                  <button onClick={()=>removeItem(it.id)} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">Xoá</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm sticky top-6">
          <h4 className="text-sm font-black uppercase tracking-[0.22em]">Hóa đơn tạm tính</h4>
          {!quotePreview ? (
            <div className="mt-4 text-sm text-on-surface-variant/70">Chưa có báo giá. Nhấn "TÍNH TOÁN & LÊN BÁO GIÁ" để tạo.</div>
          ) : (
            <div className="mt-4 text-sm">
              <div className="mb-3">Tổng tiền: <span className="font-black">{quotePreview.total_formatted || quotePreview.total || '0'}</span></div>
              <div className="text-xs text-on-surface-variant/70">Chi tiết</div>
              <ul className="mt-2 space-y-2">
                {(quotePreview.items || []).map((q,i)=> (
                  <li key={i} className="border rounded-2xl p-3 bg-surface-container/10">
                    <div className="font-bold">{q.name || q.product_name || `Hàng ${i+1}`}</div>
                    <div className="text-xs">Vật tư: {q.material_name} • Độ dày: {q.thickness_value}</div>
                    <div className="text-sm font-black mt-2">{q.price_formatted || q.price || 0} đ</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
