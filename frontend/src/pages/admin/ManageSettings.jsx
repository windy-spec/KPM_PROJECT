import React, { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { showError, showSuccess } from '../../utils/notify';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function TabNav({ tabs, active, onChange }) {
  return (
    <div className="inline-flex items-center gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`text-xs font-black uppercase tracking-[0.12em] px-3 py-2 rounded-lg transition-colors ${
            active === t.key ? 'bg-primary text-white' : 'bg-surface-container/10 text-on-surface-variant'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ThicknessRow({ item, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-surface-container/20 transition-colors">
      <td className="p-4">{item.material_name || '-'}</td>
      <td className="p-4">{item.thickness_value}</td>
      <td className="p-4">{Number(item.price_multiplier).toFixed(2)}</td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onEdit(item)} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container transition-colors">Sửa</button>
          <button onClick={() => onDelete(item)} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">Xoá</button>
        </div>
      </td>
    </tr>
  );
}

const ThicknessForm = ({ initial = {}, materials = [], onCancel, onSave }) => {
  const [form, setForm] = useState({ material_id: '', thickness_value: '', price_multiplier: '' });
  useEffect(() => setForm({ material_id: initial.material_id || '', thickness_value: initial.thickness_value || '', price_multiplier: initial.price_multiplier ?? '' }), [initial]);

  const canSave = form.material_id && form.thickness_value && form.price_multiplier !== '' && Number(form.price_multiplier) > 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">{initial.id ? 'Sửa hệ số độ dày' : 'Thêm hệ số độ dày'}</h3>
              <p className="mt-2 text-xs text-on-surface-variant/70">Hệ số dùng để nhân theo độ dày khi tính toán giá.</p>
            </div>
            <button onClick={onCancel} className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"><X className="h-4 w-4"/></button>
          </div>

          <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Vật tư</label>
              <select className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" value={form.material_id} onChange={(e)=>setForm({...form, material_id:e.target.value})}>
                <option value="">Chọn vật tư</option>
                {materials.map(m=> <option key={m.id} value={m.id}>{m.material_name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Tên độ dày</label>
              <input className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" value={form.thickness_value} onChange={(e)=>setForm({...form, thickness_value:e.target.value})} placeholder="VD: 1.2ly" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Hệ số nhân</label>
              <input type="number" min="0.01" step="0.01" className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" value={form.price_multiplier} onChange={(e)=>setForm({...form, price_multiplier:e.target.value})} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
            <button onClick={onCancel} className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Hủy</button>
            <button onClick={()=>onSave(form)} disabled={!canSave} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60">Lưu</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

function PaintRow({ item, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-surface-container/20 transition-colors">
      <td className="p-4">{item.paint_name}</td>
      <td className="p-4">{Number(item.price_per_sqm).toLocaleString('vi-VN')}</td>
      <td className="p-4">{item.description || '-'}</td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button onClick={()=>onEdit(item)} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container transition-colors">Sửa</button>
          <button onClick={()=>onDelete(item)} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">Xoá</button>
        </div>
      </td>
    </tr>
  );
}

const PaintForm = ({ initial = {}, onCancel, onSave }) => {
  const [form, setForm] = useState({ paint_name: '', price_per_sqm: '', description: '' });
  useEffect(() => setForm({ paint_name: initial.paint_name || '', price_per_sqm: initial.price_per_sqm ?? '', description: initial.description || '' }), [initial]);
  const canSave = form.paint_name.trim() && form.price_per_sqm !== '' && Number(form.price_per_sqm) >= 0;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">{initial.id ? 'Sửa loại sơn' : 'Thêm loại sơn'}</h3>
              <p className="mt-2 text-xs text-on-surface-variant/70">Giá thi công dùng khi ước lượng công sơn theo m2.</p>
            </div>
            <button onClick={onCancel} className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"><X className="h-4 w-4"/></button>
          </div>

          <div className="grid gap-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Tên loại sơn</label>
              <input className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" value={form.paint_name} onChange={(e)=>setForm({...form, paint_name:e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Đơn giá thi công (VNĐ/m2)</label>
              <input type="number" min="0" step="1" className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" value={form.price_per_sqm} onChange={(e)=>setForm({...form, price_per_sqm:e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Mô tả (tuỳ chọn)</label>
              <textarea className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
            <button onClick={onCancel} className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Hủy</button>
            <button onClick={()=>onSave(form)} disabled={!canSave} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60">Lưu</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

const ManageSettings = () => {
  const [tab, setTab] = useState('thickness');

  // labor pricing
  const [labCategories, setLabCategories] = useState([]);
  const [labModels, setLabModels] = useState([]);
  const [labRatesMap, setLabRatesMap] = useState({}); // { [categoryId]: { [modelId]: { id, price } } }
  const [labEdits, setLabEdits] = useState({}); // staged edits { categoryId: { modelId: price } }
  const [labSaveConfirmOpen, setLabSaveConfirmOpen] = useState(false);
  const [labSaving, setLabSaving] = useState(false);
  const [newRate, setNewRate] = useState({ category_id: '', model_id: '', rate_amount: '' });

  // thickness
  const [thicknessList, setThicknessList] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [thFormOpen, setThFormOpen] = useState(false);
  const [thEditing, setThEditing] = useState(null);
  const [thPendingDelete, setThPendingDelete] = useState(null);
  const [thConfirmOpen, setThConfirmOpen] = useState(false);

  // paint
  const [paintList, setPaintList] = useState([]);
  const [paintFormOpen, setPaintFormOpen] = useState(false);
  const [paintEditing, setPaintEditing] = useState(null);
  const [paintPendingDelete, setPaintPendingDelete] = useState(null);
  const [paintConfirmOpen, setPaintConfirmOpen] = useState(false);

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

      setMaterials((materialsRes.data?.data || materialsRes.data || []).map(m => ({ id: m.id, material_name: m.material_name })));
      setThicknessList(thRes.data?.data || thRes.data || []);
      setPaintList(paintRes.data?.data || paintRes.data || []);

      const cats = labCatRes.data?.data || labCatRes.data || [];
      const models = labModelRes.data?.data || labModelRes.data || [];
      const rates = labRatesRes.data?.data || labRatesRes.data || [];

      setLabCategories(Array.isArray(cats) ? cats : []);
      setLabModels(Array.isArray(models) ? models : []);

      // build rates map
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
      showError('Không tải được dữ liệu cấu hình');
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleThSave = async (form) => {
    try {
      if (thEditing?.id) {
        await adminService.updateMaterialThickness(thEditing.id, form);
        showSuccess('Cập nhật thành công');
      } else {
        await adminService.createMaterialThickness(form);
        showSuccess('Thêm thành công');
      }
      setThFormOpen(false);
      setThEditing(null);
      await loadAll();
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Lưu thất bại');
    }
  };

  const handlePaintSave = async (form) => {
    try {
      if (paintEditing?.id) {
        await adminService.updatePaintType(paintEditing.id, form);
        showSuccess('Cập nhật thành công');
      } else {
        await adminService.createPaintType(form);
        showSuccess('Thêm thành công');
      }
      setPaintFormOpen(false);
      setPaintEditing(null);
      await loadAll();
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Lưu thất bại');
    }
  };

  const confirmThDelete = async () => {
    if (!thPendingDelete) return setThConfirmOpen(false);
    try {
      await adminService.deleteMaterialThickness(thPendingDelete.id);
      setThConfirmOpen(false);
      setThPendingDelete(null);
      await loadAll();
      showSuccess('Xoá thành công');
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Xoá thất bại');
    }
  };

  const confirmPaintDelete = async () => {
    if (!paintPendingDelete) return setPaintConfirmOpen(false);
    try {
      await adminService.deletePaintType(paintPendingDelete.id);
      setPaintConfirmOpen(false);
      setPaintPendingDelete(null);
      await loadAll();
      showSuccess('Xoá thành công');
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Xoá thất bại');
    }
  };

  const applyLabChanges = async () => {
    setLabSaveConfirmOpen(false);
    const updates = [];
    try {
      Object.keys(labEdits).forEach((cid) => {
        Object.keys(labEdits[cid]).forEach((mid) => {
          const newVal = labEdits[cid][mid];
          const existing = labRatesMap?.[cid]?.[mid]?.price;
          // only include if changed and not empty
          if (newVal !== '' && Number(newVal) !== Number(existing)) {
            updates.push({ category_id: cid, model_id: mid, rate_amount: Number(newVal) });
          }
        });
      });

      if (updates.length === 0) {
        showSuccess('Không có thay đổi nào.');
        setLabEdits({});
        return;
      }

      setLabSaving(true);
      await Promise.all(updates.map((u) => adminService.setLaborRate(u)));
      showSuccess('Cập nhật đơn giá nhân công thành công.');
      await loadAll();
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Cập nhật thất bại');
    } finally {
      setLabSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/60 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black">Cấu hình hệ số độ dày, đơn giá sơn & nhân công</h2>
          <TabNav tabs={[{key:'thickness',label:'Hệ số Độ dày'},{key:'paint',label:'Đơn giá Sơn'},{key:'labor',label:'Bảng giá Nhân công'}]} active={tab} onChange={setTab} />
        </div>

        {tab === 'thickness' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div />
              <button onClick={()=>{setThEditing(null); setThFormOpen(true)}} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"> <Plus className="h-4 w-4"/> <span className="hidden sm:inline">Thêm</span></button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                    <th className="p-4">Vật tư</th>
                    <th className="p-4">Độ dày</th>
                    <th className="p-4">Hệ số</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/25 text-sm">
                  {thicknessList.map(t => (<ThicknessRow key={t.id} item={t} onEdit={(it)=>{setThEditing(it); setThFormOpen(true)}} onDelete={(it)=>{setThPendingDelete(it); setThConfirmOpen(true)}} />))}
                  {thicknessList.length===0 && <tr><td colSpan={4} className="p-8 text-center text-sm text-on-surface-variant/60">Không có cấu hình nào</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'paint' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div />
              <button onClick={()=>{setPaintEditing(null); setPaintFormOpen(true)}} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors"> <Plus className="h-4 w-4"/> <span className="hidden sm:inline">Thêm</span></button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                    <th className="p-4">Tên loại sơn</th>
                    <th className="p-4">Đơn giá (VNĐ/m2)</th>
                    <th className="p-4">Mô tả</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/25 text-sm">
                  {paintList.map(p => (<PaintRow key={p.id} item={p} onEdit={(it)=>{setPaintEditing(it); setPaintFormOpen(true)}} onDelete={(it)=>{setPaintPendingDelete(it); setPaintConfirmOpen(true)}} />))}
                  {paintList.length===0 && <tr><td colSpan={4} className="p-8 text-center text-sm text-on-surface-variant/60">Không có loại sơn nào</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'labor' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2">
                  <select value={newRate.category_id} onChange={(e)=>setNewRate({...newRate, category_id: e.target.value})} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm">
                    <option value="">Chọn loại thợ</option>
                    {labCategories.map(c=> <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                  <select value={newRate.model_id} onChange={(e)=>setNewRate({...newRate, model_id: e.target.value})} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm">
                    <option value="">Chọn mô hình</option>
                    {labModels.map(m=> <option key={m.id} value={m.id}>{m.model_name}</option>)}
                  </select>
                  <input type="number" min="0" step="1" placeholder="Đơn giá" value={newRate.rate_amount} onChange={(e)=>setNewRate({...newRate, rate_amount: e.target.value})} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm w-36" />
                  <button onClick={async ()=>{
                    if(!newRate.category_id || !newRate.model_id || newRate.rate_amount === '') return showError('Vui lòng điền đầy đủ');
                    try{
                      await adminService.setLaborRate({ category_id: newRate.category_id, model_id: newRate.model_id, rate_amount: Number(newRate.rate_amount) });
                      showSuccess('Thêm đơn giá thành công');
                      setNewRate({ category_id:'', model_id:'', rate_amount:'' });
                      await loadAll();
                    }catch(e){ showError(e?.response?.data?.message || e?.message || 'Thêm thất bại'); }
                  }} className="rounded-lg bg-primary px-3 py-2 text-white">Thêm</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{setLabEdits({}); showSuccess('Đã huỷ thay đổi');}} className="rounded-lg border border-outline-variant/60 px-3 py-2 text-sm hover:bg-surface-container transition-colors">Huỷ thay đổi</button>
                <button onClick={()=>setLabSaveConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-amber-600 transition-colors">Lưu cập nhật</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                    <th className="p-4">Loại thợ / Hình thức</th>
                    {labModels.map((m)=> (<th key={m.id} className="p-4">{m.model_name}</th>))}
                    <th className="p-4">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/25 text-sm">
                  {labCategories.map((cat)=> (
                    <tr key={cat.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="p-4 font-black">{cat.category_name}</td>
                      {labModels.map((m)=> {
                        const staged = labEdits?.[cat.id]?.[m.id];
                        const existing = labRatesMap?.[cat.id]?.[m.id]?.price;
                        const value = (typeof staged !== 'undefined') ? staged : (typeof existing !== 'undefined' ? existing : '');
                        return (
                          <td key={m.id} className="p-4">
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" step="1" className="flex-1 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm outline-none focus:border-primary" value={value} onChange={(e)=>{
                                const v = e.target.value === '' ? '' : Number(e.target.value);
                                setLabEdits(prev=>{
                                  const copy = {...prev};
                                  if(!copy[cat.id]) copy[cat.id]={};
                                  copy[cat.id][m.id]=v;
                                  return copy;
                                });
                              }} />
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={async ()=>{
                            // reset staged for this row
                            setLabEdits(prev=>{ const copy={...prev}; delete copy[cat.id]; return copy; });
                            showSuccess('Hoàn tác hàng');
                          }} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container transition-colors">Hoàn tác</button>
                          <button onClick={async ()=>{
                            // save staged values for this row only
                            const row = labEdits?.[cat.id] || {};
                            const calls = [];
                            Object.keys(row).forEach(mid=>{
                              const v = row[mid];
                              if(v === '') return;
                              calls.push(adminService.setLaborRate({ category_id: cat.id, model_id: mid, rate_amount: Number(v) }));
                            });
                            if(calls.length===0){ showError('Không có thay đổi cho hàng này'); return; }
                            try{ await Promise.all(calls); showSuccess('Cập nhật hàng thành công'); await loadAll(); }catch(e){ showError(e?.response?.data?.message || e?.message || 'Cập nhật thất bại'); }
                          }} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white hover:bg-primary/90">Cập nhật</button>
                          <button onClick={async ()=>{
                            // delete existing rates for this row
                            const existingMap = labRatesMap?.[cat.id] || {};
                            const ids = Object.keys(existingMap).map(k=> existingMap[k].id).filter(Boolean);
                            if(ids.length===0){ showError('Không có đơn giá để xóa cho hàng này'); return; }
                            try{ await Promise.all(ids.map(id=> adminService.deleteLaborRate(id))); showSuccess('Xoá hàng thành công'); await loadAll(); }catch(e){ showError(e?.response?.data?.message || e?.message || 'Xoá thất bại'); }
                          }} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">Xoá</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {labCategories.length===0 && <tr><td colSpan={labModels.length+1} className="p-8 text-center text-sm text-on-surface-variant/60">Không có dữ liệu nhân công</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal open={thConfirmOpen} title="Xoá cấu hình" message={`Xoá ${thPendingDelete?.thickness_value || ''}?`} onConfirm={confirmThDelete} onCancel={()=>setThConfirmOpen(false)} />
      <ConfirmModal open={paintConfirmOpen} title="Xoá loại sơn" message={`Xoá ${paintPendingDelete?.paint_name || ''}?`} onConfirm={confirmPaintDelete} onCancel={()=>setPaintConfirmOpen(false)} />
      <ConfirmModal
        open={labSaveConfirmOpen}
        title={"Lưu ý: Thay đổi đơn giá nhân công"}
        message={"Lưu ý: Việc thay đổi đơn giá nhân công sẽ áp dụng ngay lập tức cho các Báo giá mới được tạo từ thời điểm này trở đi. Bạn có chắc chắn muốn thay đổi?"}
        onConfirm={applyLabChanges}
        onCancel={()=>setLabSaveConfirmOpen(false)}
      />

      {thFormOpen && <ThicknessForm initial={thEditing||{}} materials={materials} onCancel={()=>{setThFormOpen(false); setThEditing(null)}} onSave={handleThSave} />}
      {paintFormOpen && <PaintForm initial={paintEditing||{}} onCancel={()=>{setPaintFormOpen(false); setPaintEditing(null)}} onSave={handlePaintSave} />}
    </div>
  );
};

export default ManageSettings;
