import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { showError } from '../../utils/notify';

// Tối ưu lại Badge trạng thái theo chuẩn UI mới
function StatusBadge({ status }) {
  const map = {
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-teal-50 text-teal-700 border-teal-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border ${map[status] || 'bg-surface-container text-on-surface-variant border-outline-variant/40'}`}>
      {status || 'draft'}
    </span>
  );
}

export default function QuotationList({ onOpen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getQuotations({ page: 1, limit: 200 });
      setRows(res.data?.data || res.data || []);
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Không tải được danh sách báo giá');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  function shortCode(id) {
    if (!id) return '';
    return id.slice(0, 8).toUpperCase();
  }

  function formatVND(n) {
    if (n == null) return '-';
    return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ';
  }

  return (
    // Bỏ padding ở container, dùng overflow-hidden để header bám sát viền
    <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      
      {/* Header Bar chuẩn AdminProductPanel */}
      <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex items-center justify-start gap-2 bg-surface-container/10">
        <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface whitespace-nowrap">
          Danh sách Báo giá
        </h2>
        <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant/75">
          {rows.length} bản ghi
        </span>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto relative min-h-[300px]">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
              <th className="p-4 pl-6">Mã Báo Giá</th>
              <th className="p-4">Ngày tạo</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 pr-6 text-center w-[120px]">Hành động</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-outline-variant/25 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-xs font-bold text-on-surface-variant/50 tracking-widest uppercase">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : null}

            {rows.map(r => (
              <tr 
                key={r.id} 
                className="hover:bg-surface-container/20 transition-colors cursor-pointer" 
                onDoubleClick={() => onOpen?.(r.id)}
              >
                <td className="p-4 pl-6 font-mono text-xs font-bold text-on-surface-variant/80">
                  {shortCode(r.id)}
                </td>
                <td className="p-4 text-[13px] text-on-surface-variant/80 font-medium">
                  {new Date(r.created_at || r.createdAt || Date.now()).toLocaleString('vi-VN')}
                </td>
                <td className="p-4 font-black text-on-surface text-[13px]">
                  {formatVND(r.total_amount ?? r.total)}
                </td>
                <td className="p-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-4 pr-6 text-center">
                  <button 
                    onClick={() => onOpen?.(r.id)} 
                    className="inline-flex items-center justify-center rounded-xl border border-outline-variant/60 px-4 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all shadow-sm"
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-sm text-on-surface-variant/50 font-medium">
                  Không tìm thấy báo giá nào trong hệ thống.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}