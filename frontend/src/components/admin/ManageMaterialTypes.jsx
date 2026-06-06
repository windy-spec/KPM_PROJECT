import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Search } from 'lucide-react';
import adminService from '../../services/admin.service';
import Portal from '../../components/common/Portal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { showError, showSuccess } from '../../utils/notify';

export default function ManageMaterialTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Xử lý phân trang & tìm kiếm đồng bộ
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type_name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await adminService.getMaterialTypes();
      const rawData = res.data?.data || res.data || [];
      
      // Filter client-side if your endpoint doesn't support pagination yet
      const filtered = rawData.filter(t => 
        t.type_name.toLowerCase().includes(search.toLowerCase())
      );
      
      setTotalPages(Math.ceil(filtered.length / limit) || 1);
      const start = (page - 1) * limit;
      setTypes(filtered.slice(start, start + limit));
    } catch (err) {
      showError('Không thể tải danh sách loại vật tư');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [page, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ type_name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ type_name: item.type_name, description: item.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type_name.trim()) return showError('Vui lòng điền tên loại vật tư');
    
    setFormLoading(true);
    try {
      if (editing) {
        await adminService.updateMaterialType(editing.id, form);
        showSuccess('Cập nhật loại vật tư thành công');
      } else {
        await adminService.createMaterialType(form);
        showSuccess('Thêm loại vật tư thành công');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      showError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await adminService.deleteMaterialType(pendingDelete.id);
      showSuccess('Xoá loại vật tư thành công');
      fetchTypes();
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể xoá loại vật tư này');
    } finally {
      setShowDeleteModal(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
        <div>
          <h2 className="text-base font-black tracking-tight text-on-surface">Quản Lý Loại Vật Tư</h2>
          <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider mt-0.5">Phân loại chất liệu, nhóm phôi gia công</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="h-10 px-4 bg-primary text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-primary/95 transition-colors shadow-sm cursor-pointer select-none"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Thêm Loại Vật Tư
        </button>
      </div>

      {/* Main Table Body */}
      <div className="bg-white rounded-2xl border border-outline-variant/60 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/50 flex flex-wrap items-center justify-between gap-3 bg-surface/30">
          <div className="flex items-center gap-2 w-full sm:max-w-md bg-surface border border-outline-variant/80 px-3 h-10 rounded-xl focus-within:border-primary transition-colors">
            <Search className="h-4 w-4 text-on-surface-variant/50 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm loại vật tư..."
              className="w-full h-full text-xs font-semibold focus:outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface/40 text-[11px] font-black uppercase text-on-surface-variant/70 tracking-wider">
                <th className="py-3.5 px-4 w-52">Tên loại vật tư</th>
                <th className="py-3.5 px-4">Mô tả chi tiết</th>
                <th className="py-3.5 px-4 text-center w-24">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-xs font-semibold text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-on-surface-variant/60">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" /> Đang tải dữ liệu...
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-on-surface-variant/60">Không có dữ liệu loại vật tư.</td>
                </tr>
              ) : (
                types.map((t) => (
                  <tr key={t.id} className="hover:bg-surface/20 transition-colors">
                    <td className="py-3.5 px-4 font-black text-on-surface">{t.type_name}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant/80 font-medium max-w-sm truncate">{t.description || '---'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => openEdit(t)} className="h-7 w-7 rounded-md hover:bg-surface-container flex items-center justify-center border border-outline-variant/40 text-on-surface-variant hover:text-primary transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => { setPendingDelete(t); setShowDeleteModal(true); }} className="h-7 w-7 rounded-md hover:bg-red-50 flex items-center justify-center border border-outline-variant/40 text-on-surface-variant hover:text-red-600 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-outline-variant/50 flex items-center justify-between bg-surface/10">
          <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider">Trang {page} / {totalPages}</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
      </div>

      {/* PORTAL FORM MODAL */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-outline-variant/60 flex flex-col animate-scale-in">
              <div className="p-5 border-b border-outline-variant/60 bg-white flex items-center justify-between">
                <h3 className="text-base font-black text-on-surface tracking-tight">{editing ? 'Cập nhật Loại vật tư' : 'Thêm Loại vật tư'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant/80">Tên loại vật tư <span className="text-red-500">*</span></label>
                  <input type="text" value={form.type_name} onChange={e => setForm({ ...form, type_name: e.target.value })} placeholder="VD: Thép tấm, Nhôm hợp kim..." className="w-full h-10 px-3 border border-outline-variant rounded-lg text-sm font-semibold focus:border-primary focus:outline-none bg-surface" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant/80">Mô tả chi tiết</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nhập mô tả cho loại vật tư này..." className="w-full p-3 border border-outline-variant rounded-lg text-sm font-semibold focus:border-primary focus:outline-none bg-surface resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/60">
                  <button type="button" onClick={() => setShowModal(false)} className="h-10 px-4 border border-outline-variant rounded-xl text-sm font-bold hover:bg-surface-container">Hủy</button>
                  <button type="submit" disabled={formLoading} className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/95">
                    {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Lưu lại
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      <ConfirmModal 
        open={showDeleteModal} 
        title="Xác nhận xoá loại vật tư" 
        message={pendingDelete ? `Bạn chắc chắn muốn xoá loại vật tư "${pendingDelete.type_name}"?` : ''} 
        confirmText="Xoá" 
        cancelText="Hủy" 
        onCancel={() => { setShowDeleteModal(false); setPendingDelete(null); }} 
        onConfirm={handleDelete} 
      />
    </div>
  );
}