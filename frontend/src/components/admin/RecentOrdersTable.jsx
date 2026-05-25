import React from 'react';
import { Filter, FileSpreadsheet, Eye, Edit3 } from 'lucide-react';

const RecentOrdersTable = ({ orders }) => {
  return (
    <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Table */}
      <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <h3 className="text-xs font-black uppercase tracking-wider text-on-surface">
          Đơn hàng mới cập nhật
        </h3>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button className="px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-surface-container transition-colors">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant" /> Bộ lọc
          </button>
          <button className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-primary-container transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container/40 border-b border-outline-variant/40 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/80">
              <th className="p-4 pl-6">Mã đơn</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Ngày đặt</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Giá trị</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 pr-6 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-xs font-bold text-on-surface-variant">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-container/20 transition-colors">
                <td className="p-4 pl-6 font-mono text-on-surface">{order.code}</td>
                <td className="p-4 text-on-surface">{order.customer}</td>
                <td className="p-4 opacity-75">{order.date}</td>
                <td className="p-4 text-on-surface max-w-xs truncate">{order.product}</td>
                <td className="p-4 font-black text-on-surface">{order.value}</td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === 'Hoàn tất' 
                      ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 pr-6">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Xem chi tiết">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;