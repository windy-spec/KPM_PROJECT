import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { Pencil, Trash, Plus } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';

const ManageProducts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({ page: 1, limit: 50 });
      const data = res.data?.data || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Lỗi tải sản phẩm', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xoá sản phẩm này?')) return;
    try {
      await adminService.deleteProduct(id);
      await load();
    } catch (e) {
      alert('Xoá thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  const handleSave = async (form) => {
    try {
      if (editing && editing.id) {
        await adminService.updateProduct(editing.id, form);
      } else {
        await adminService.createProduct(form);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      alert('Lưu thất bại: ' + (e?.response?.data?.message || e.message || e));
    }
  };

  return (
    <div className="p-6 bg-surface-container/10 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black">Quản lý sản phẩm</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleCreate} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded">
            <Plus className="w-4 h-4"/> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container/60 text-xs font-black uppercase"><tr><th className="p-3">Mã</th><th>Tên</th><th>Giá</th><th>Trạng thái</th><th className="text-center">Hành động</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b hover:bg-surface-container/20">
                <td className="p-3 font-mono">{it.product_code || it.sku || it.id}</td>
                <td className="p-3">{it.name || it.title}</td>
                <td className="p-3">{it.price ? `${it.price}đ` : '-'}</td>
                <td className="p-3">{it.status || '-'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleEdit(it)} className="px-2 py-1 mr-2 rounded bg-amber-50 hover:bg-amber-100"> <Pencil className="w-4 h-4"/> </button>
                  <button onClick={() => handleDelete(it.id)} className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100"> <Trash className="w-4 h-4"/> </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-6 text-center opacity-60">Không có sản phẩm nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProductForm initial={editing || {}} onCancel={() => setShowForm(false)} onSave={handleSave} />
      )}
    </div>
  );
};

export default ManageProducts;
