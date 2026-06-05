import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { showError } from '../../utils/notify';

function StatusBadge({ status }) {
  const map = {
    draft: 'bg-amber-50 text-amber-700 border border-amber-100',
    approved: 'bg-teal-50 text-teal-700 border border-teal-100',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-100',
  };
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.12em] ${map[status] || 'bg-surface-container/20'}`}>{status || 'draft'}</span>;
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

  useEffect(()=>{ load(); }, []);

  function shortCode(id){
    if(!id) return '';
    return id.slice(0,8).toUpperCase();
  }

  function formatVND(n){
    if(n==null) return '-';
    return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ';
  }

  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.22em]">Danh sách Báo giá</h3>
        <div className="text-xs text-on-surface-variant/70">{rows.length} bản ghi</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container/40 border-b border-outline-variant/40 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
              <th className="p-4 pl-6">Mã Báo Giá</th>
              <th className="p-4">Ngày tạo</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 pr-6 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center">Đang tải...</td></tr>
            ) : null}

            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-container/20 transition-colors cursor-pointer" onDoubleClick={()=>onOpen?.(r.id)}>
                <td className="p-4 pl-6 font-mono">{shortCode(r.id)}</td>
                <td className="p-4">{new Date(r.created_at || r.createdAt || Date.now()).toLocaleString()}</td>
                <td className="p-4 font-black">{formatVND(r.total_amount ?? r.total)}</td>
                <td className="p-4"><StatusBadge status={r.status} /></td>
                <td className="p-4 pr-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={()=>onOpen?.(r.id)} className="rounded-lg border border-outline-variant/60 px-3 py-1.5 text-[11px] font-bold hover:bg-surface-container transition-colors">Xem</button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length===0 && !loading && (<tr><td colSpan={5} className="p-8 text-center text-sm text-on-surface-variant/60">Không có báo giá</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
