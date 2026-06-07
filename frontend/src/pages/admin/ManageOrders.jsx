import React, { useMemo, useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  X, 
  FileText, 
  TrendingUp, 
  Package 
} from 'lucide-react';
import Portal from '../../components/common/Portal';
import Pagination from '../../components/common/Pagination';
import { showSuccess } from '../../utils/notify';

// Hàm helper format hiển thị tiền tệ VNĐ
const formatMoney = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

// Hàm helper hiển thị ngày tháng thân thiện
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 1. DỮ LIỆU ẢO (MOCK DATA) ĐƠN HÀNG CHẤT LƯỢNG CAO
const MOCK_ORDERS = [
  {
    id: "ORD-9901",
    customer_name: "Nguyễn Văn Hùng",
    customer_phone: "0908123456",
    created_at: "2026-06-06T14:32:00.000Z",
    total_amount: 15450000,
    status: "PENDING", // PENDING, CONFIRMED, DELIVERED, CANCELLED
    shipping_address: "180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh",
    notes: "Giao hàng giờ hành chính, gọi trước 30 phút.",
    items: [
      { id: 1, product_name: "Sắt hộp mạ kẽm Hòa Phát 40x80x1.8mm", quantity: 50, price: 225000, unit: "Cây" },
      { id: 2, product_name: "Thép tấm chống trượt 3mm", quantity: 2, price: 2100000, unit: "Tấm" }
    ]
  },
  {
    id: "ORD-9902",
    customer_name: "Công ty Cơ khí Kiến Phát",
    customer_phone: "0912345678",
    created_at: "2026-06-05T09:15:00.000Z",
    total_amount: 42800000,
    status: "CONFIRMED",
    shipping_address: "Lô C2, Đường số 4, KCN Vĩnh Lộc, Bình Chánh, TP. HCM",
    notes: "Cần kèm theo biên bản kiểm định chất lượng xuất xưởng.",
    items: [
      { id: 3, product_name: "Inox tấm SUS 304 độ dày 2mm", quantity: 5, price: 4500000, unit: "Tấm" },
      { id: 4, product_name: "Thép hình chữ I đúc I150", quantity: 10, price: 2030000, unit: "Cây" }
    ]
  },
  {
    id: "ORD-9903",
    customer_name: "Trần Thị Minh Tâm",
    customer_phone: "0934888999",
    created_at: "2026-06-04T16:45:00.000Z",
    total_amount: 3240000,
    status: "DELIVERED",
    shipping_address: "45/12 Đường số 8, Phường 11, Gò Vấp, TP. HCM",
    notes: "",
    items: [
      { id: 5, product_name: "Kính cường lực 10mm tiêu chuẩn", quantity: 4, price: 810000, unit: "m²" }
    ]
  },
  {
    id: "ORD-9904",
    customer_name: "Xưởng gia công nhôm kính Thành Phát",
    customer_phone: "0977222111",
    created_at: "2026-06-02T11:00:00.000Z",
    total_amount: 8900000,
    status: "CANCELLED",
    shipping_address: "789 Nguyễn Văn Linh, Quận 7, TP. HCM",
    notes: "Khách hủy do thay đổi thiết kế công trình.",
    items: [
      { id: 6, product_name: "Nhôm thanh định hình Xingfa hệ 55", quantity: 20, price: 445000, unit: "Thanh" }
    ]
  },
  {
    id: "ORD-9905",
    customer_name: "Lê Hoàng Long",
    customer_phone: "0909555444",
    created_at: "2026-06-01T08:20:00.000Z",
    total_amount: 12600000,
    status: "DELIVERED",
    shipping_address: "Chung cư Topaz City, Khối C, Quận 8, TP. HCM",
    notes: "Giao lên lầu 12 bằng thang máy hàng.",
    items: [
      { id: 7, product_name: "Sắt đặc tròn φ12 mạ kẽm nhúng nóng", quantity: 50, price: 198000, unit: "Cây" },
      { id: 8, product_name: "Bản mã thép 200x200x8mm", quantity: 50, price: 54000, unit: "Cái" }
    ]
  }
];

export default function ManageOrders() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quản lý phân trang client
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Xem chi tiết đơn hàng (Modal)
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Bộ lọc tìm kiếm & trạng thái mượt mà
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery);
        
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Phân chia dữ liệu theo trang
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const currentTableData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page]);

  // Thống kê nhanh từ tập dữ liệu
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;

    orders.forEach(o => {
      if (o.status === 'DELIVERED' || o.status === 'CONFIRMED') totalRevenue += o.total_amount;
      if (o.status === 'PENDING') pendingCount++;
      if (o.status === 'CONFIRMED') confirmedCount++;
    });

    return { totalRevenue, pendingCount, confirmedCount };
  }, [orders]);

  // Giả lập hàm đổi trạng thái đơn hàng nhanh
  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showSuccess(`Đã cập nhật trạng thái đơn hàng ${orderId} thành công!`);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  // Định dạng nhãn trạng thái trực quan
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Chờ duyệt
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã giao hàng
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Đã hủy bỏ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* 1. TIÊU ĐỀ KHỐI QUẢN LÝ */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-on-surface">
          Quản Lý Đơn Hàng Hệ Thống
        </h1>
        <p className="text-sm font-medium text-on-surface-variant/80">
          Theo dõi tiến trình đặt hàng vật tư cơ khí, phê duyệt đơn hàng và quản lý thông tin xuất xưởng của khách hàng.
        </p>
      </div>

      {/* 2. KHỐI THẺ THỐNG KÊ NHANH CẤP CAO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Doanh thu tạm tính</p>
            <p className="text-xl font-black text-on-surface">{formatMoney.format(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Đơn hàng chờ duyệt</p>
            <p className="text-2xl font-black text-on-surface">{stats.pendingCount} đơn</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">Đang xử lý / Đã chốt</p>
            <p className="text-2xl font-black text-on-surface">{stats.confirmedCount} đơn</p>
          </div>
        </div>
      </div>

      {/* 3. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐỒNG BỘ */}
      <div className="flex flex-col gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn ORD, tên khách hàng, số điện thoại..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface pl-10 pr-4 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 h-10 text-xs font-bold text-on-surface-variant">
            <Filter className="h-3.5 w-3.5" />
            <span>Trạng thái:</span>
          </div>
          {[
            { key: 'ALL', label: 'Tất cả đơn' },
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'CONFIRMED', label: 'Đã xác nhận' },
            { key: 'DELIVERED', label: 'Đã giao' },
            { key: 'CANCELLED', label: 'Đã hủy' }
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => { setStatusFilter(st.key); setPage(1); }}
              className={`h-10 px-3.5 rounded-xl text-xs font-black transition-all ${
                statusFilter === st.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. BẢNG HIỂN THỊ DANH SÁCH ĐƠN HÀNG */}
      <div className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low/40 text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider">
                <th className="p-4 w-28 text-center">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Thời gian đặt</th>
                <th className="p-4 text-right">Tổng thanh toán</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {currentTableData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">
                      <Package className="h-8 w-8" />
                      <p className="text-sm font-bold">Không tìm thấy đơn hàng nào khớp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTableData.map((order) => (
                  <tr 
                    key={order.id} 
                    className="group hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="p-4 text-center font-mono font-black text-primary">
                      #{order.id}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">{order.customer_name}</div>
                      <div className="text-xs text-on-surface-variant/70 font-medium">{order.customer_phone}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant/90 font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-on-surface">
                      {formatMoney.format(order.total_amount)}
                    </td>
                    <td className="p-4 text-center">
                      {renderStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        title="Xem chi tiết đơn hàng"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Khối điều hướng phân trang (Dùng component Pagination của hệ thống) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/20">
            <p className="text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">
              Trang {page} / {totalPages} ({filteredOrders.length} đơn hàng ảo)
            </p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>

      {/* 5. PORTAL MODAL CHI TIẾT ĐƠN HÀNG VÀ XỬ LÝ DUYỆT NHANH */}
      {selectedOrder && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[32px] border border-outline-variant/60 bg-surface shadow-2xl overflow-hidden animate-scale-up">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-low px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">
                      Chi Tiết Đơn Hàng #{selectedOrder.id}
                    </h3>
                    <p className="text-xs font-bold text-on-surface-variant/70">
                      Đặt lúc: {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nội dung chi tiết đơn */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Thông tin khách hàng & Giao hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-surface-container-low/40 p-4 border border-outline-variant/30">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">Thông tin khách hàng</h4>
                    <div className="flex items-start gap-2 text-sm font-semibold text-on-surface">
                      <User className="w-4 h-4 mt-0.5 opacity-60 text-on-surface-variant" />
                      <div>
                        <p>{selectedOrder.customer_name}</p>
                        <p className="text-xs text-on-surface-variant/80 font-medium">SĐT: {selectedOrder.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">Địa chỉ nhận hàng</h4>
                    <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
                      {selectedOrder.shipping_address}
                    </p>
                  </div>
                </div>

                {/* Danh sách vật tư/sản phẩm đặt mua */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Danh mục vật tư yêu cầu</h4>
                  <div className="rounded-xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/40 bg-surface-container-low/60 text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                          <th className="p-3">Tên sản phẩm vật tư</th>
                          <th className="p-3 text-center w-24">Số lượng</th>
                          <th className="p-3 text-right w-32">Đơn giá</th>
                          <th className="p-3 text-right w-32">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-semibold text-on-surface">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                            <td className="p-3 font-bold text-on-surface">{item.product_name}</td>
                            <td className="p-3 text-center text-on-surface-variant">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-3 text-right font-mono text-on-surface-variant">
                              {formatMoney.format(item.price)}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-primary">
                              {formatMoney.format(item.quantity * item.price)}
                            </td>
                          </tr>
                        ))}
                        {/* Dòng tổng số tiền */}
                        <tr className="bg-surface-container-low/30 font-black">
                          <td colSpan="3" className="p-3 text-right text-sm uppercase tracking-wide text-on-surface-variant">Tổng hóa đơn:</td>
                          <td className="p-3 text-right text-base font-black text-rose-600 font-mono">
                            {formatMoney.format(selectedOrder.total_amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ghi chú đơn hàng từ khách */}
                {selectedOrder.notes && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs font-medium text-amber-900">
                    <span className="font-bold block text-amber-800 uppercase tracking-wide text-[10px]">Ghi chú từ khách hàng:</span>
                    "{selectedOrder.notes}"
                  </div>
                )}
              </div>

              {/* Footer điều phối trạng thái hoặc đóng đơn */}
              <div className="flex flex-wrap items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/60 px-6 py-4 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">Thao tác duyệt đơn ảo:</span>
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                        className="h-9 px-3 bg-primary text-white text-xs font-black rounded-lg shadow-sm hover:bg-primary/90 transition-all"
                      >
                        Xác nhận đơn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                        className="h-9 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-lg hover:bg-rose-100 transition-all"
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      className="h-9 px-3 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-emerald-700 transition-all"
                    >
                      Đánh dấu đã giao xong
                    </button>
                  )}
                  {(selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'CANCELLED') && (
                    <span className="text-xs font-black text-on-surface-variant/60 italic">Đơn hàng này đã đóng vòng đời điều phối.</span>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="h-9 rounded-lg border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Đóng lại
                </button>
              </div>

            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
