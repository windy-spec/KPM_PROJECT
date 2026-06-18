import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { showError } from '../../utils/notify';
import Pagination from '../../components/common/Pagination';
import AdminQuoteReviewModal from '../../components/admin/AdminQuoteReviewModal';
import { useSocket } from '../../context/SocketContext';
import { showSuccess } from '../../utils/notify';

// Tối ưu lại Badge trạng thái theo chuẩn UI mới
function StatusBadge({ status }) {
  const map = {
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    pending_admin: 'bg-amber-100 text-amber-800 border-amber-300',
    sent_to_customer: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-teal-50 text-teal-700 border-teal-200',
    customer_approved: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    admin_confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    favorite: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  const labelMap = {
    draft: 'Nháp',
    pending_admin: 'Chờ duyệt',
    sent_to_customer: 'Chờ KH chốt',
    approved: 'KH đã xác nhận',
    customer_approved: 'KH đã xác nhận',
    admin_confirmed: 'Đã lên đơn hàng',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
    favorite: 'Yêu thích',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em] border ${map[status] || 'bg-surface-container text-on-surface-variant border-outline-variant/40'}`}>
      {labelMap[status] || status || 'draft'}
    </span>
  );
}

export default function QuotationList({ onOpen }) {
  const socket = useSocket();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getQuotations({ page: 1, limit: 200 });
      setRows(res.data?.data || res.data || []);
      setCurrentPage(1);
    } catch (e) {
      showError(e?.response?.data?.message || e?.message || 'Không tải được danh sách báo giá');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewQuote = (payload) => {
      showSuccess(payload?.message || "Có yêu cầu báo giá mới từ khách hàng!");
      load();
    };

    const handleQuoteNegotiated = (payload) => {
      showSuccess(payload?.message || "Khách hàng vừa phản hồi một báo giá!");
      load();
    };

    socket.on("new_quotation", handleNewQuote);
    socket.on("quote_negotiated", handleQuoteNegotiated);

    return () => {
      socket.off("new_quotation", handleNewQuote);
      socket.off("quote_negotiated", handleQuoteNegotiated);
    };
  }, [socket]);

  function shortCode(id) {
    if (!id) return '';
    return id.slice(0, 8).toUpperCase();
  }

  function formatVND(n) {
    if (n == null) return '-';
    return new Intl.NumberFormat('vi-VN').format(Number(n)) + ' đ';
  }

  // Tính toán dữ liệu phân trang
  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
  const paginatedRows = rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex items-center justify-start gap-2 bg-surface-container/10">
        <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
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
                <td colSpan={5} className="p-12 text-center text-xs font-bold text-on-surface-variant/50 tracking-widest uppercase animate-pulse">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : null}

            {!loading && paginatedRows.map(r => (
              <tr
                key={r.id}
                // Thêm lớp "group" để có thể tinh chỉnh các phần tử con bên trong khi hover vào hàng
                className="group hover:bg-surface-container/20 transition-all duration-150 cursor-pointer"
                onDoubleClick={() => onOpen?.(r.id)}
              >
                {/* Thêm tiền tố # để phần mã nhìn chuyên nghiệp và đầy đặn hơn */}
                <td className="p-4 pl-6 font-mono text-xs font-bold text-on-surface-variant/80 group-hover:text-primary transition-colors">
                  #{shortCode(r.id)}
                </td>
                <td className="p-4 text-[13px] text-on-surface-variant/80 font-medium">
                  {new Date(r.created_at || r.createdAt || Date.now()).toLocaleString('vi-VN')}
                </td>
                {/* Nâng kích thước chữ tiền lên text-sm giúp cột giá trị bớt trống trải */}
                <td className="p-4 font-black text-on-surface text-sm tracking-wide">
                  {formatVND(r.total_quoted_price ?? r.total_amount ?? r.total)}
                </td>
                <td className="p-4">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-4 pr-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* Nút Xem gốc (Giữ nguyên prop callback onOpen ban đầu của bạn) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen?.(r.id);
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-outline-variant/60 bg-white px-3 py-1.5 text-[11px] font-bold text-on-surface-variant transition-all shadow-2xs hover:border-on-surface-variant hover:bg-surface-container/40 active:scale-95 cursor-pointer"
                    >
                      Xem
                    </button>
                  </div>
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

      {/* Khu vực hiển thị Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-outline-variant/40 flex justify-end bg-surface-container/5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}