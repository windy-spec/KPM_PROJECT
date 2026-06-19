import React, { useMemo, useState, useEffect } from "react";
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
  Package,
  Truck,
} from "lucide-react";
import Portal from "../../components/common/Portal";
import Pagination from "../../components/common/Pagination";
import { showSuccess } from "../../utils/notify";
import orderService from "../../services/order.service";

// Hàm helper format hiển thị tiền tệ VNĐ
const formatMoney = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

// Hàm helper hiển thị ngày tháng thân thiện
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getAllOrders();
        if (res.success && res.data) {
          const formattedOrders = res.data.map((o) => ({
            id: o.id,
            display_id: o.order_code,
            customer_name:
              o.users?.username || o.quotations?.users?.username || "Khách",
            customer_phone:
              o.users?.phone || o.quotations?.users?.phone || "N/A",
            created_at: o.created_at,
            status: o.production_status || "pending",
            shipping_address: o.quotations?.address || "Liên hệ nhận hàng",
            notes: o.quotations?.notes || "",
            items:
              o.order_items?.map((i) => ({
                id: i.id,
                product_name: i.products?.product_name || "Sản phẩm",
                quantity: i.quantity,
                price: parseFloat(i.price) || 0,
                unit: "Cái",
              })) || [],
            total_amount: parseFloat(o.total_amount) || 0,
          }));
          setOrders(formattedOrders);
        }
      } catch (e) {
        console.error("Failed to load orders", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Quản lý phân trang client
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Xem chi tiết đơn hàng (Modal)
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Bộ lọc tìm kiếm & trạng thái mượt mà
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.display_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_phone && order.customer_phone.includes(searchQuery));

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;
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
    let inProgressCount = 0;

    orders.forEach((o) => {
      if (["completed", "delivering", "production"].includes(o.status))
        totalRevenue += o.total_amount;
      if (["pending_payment", "pending"].includes(o.status)) pendingCount++;
      if (["production", "delivering"].includes(o.status)) inProgressCount++;
    });

    return { totalRevenue, pendingCount, inProgressCount };
  }, [orders]);

  // Hàm cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (
    orderId,
    newStatus,
    stageName,
    stageDesc,
  ) => {
    try {
      const res = await orderService.updateOrderStatus(orderId, {
        status: newStatus,
        stage_name: stageName,
        stage_description: stageDesc,
      });
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        showSuccess(`Đã cập nhật trạng thái đơn hàng thành công!`);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  // Định dạng nhãn trạng thái trực quan
  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
            <DollarSign className="w-3 h-3" /> Chờ thanh toán
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Chờ xử lý
          </span>
        );
      case "production":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3 h-3" /> Đang sản xuất
          </span>
        );
      case "delivering":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3" /> Đang giao hàng
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-gray-50 text-gray-700 border border-gray-200">
            <XCircle className="w-3 h-3" /> Đã hủy bỏ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
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
          Theo dõi tiến trình đặt hàng vật tư cơ khí, phê duyệt đơn hàng và quản
          lý thông tin xuất xưởng của khách hàng.
        </p>
      </div>

      {/* 2. KHỐI THẺ THỐNG KÊ NHANH CẤP CAO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
              Doanh thu tạm tính
            </p>
            <p className="text-xl font-black text-on-surface">
              {formatMoney.format(stats.totalRevenue)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
              Đơn hàng chờ duyệt
            </p>
            <p className="text-2xl font-black text-on-surface">
              {stats.pendingCount} đơn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
              Đang sản xuất / Giao hàng
            </p>
            <p className="text-2xl font-black text-on-surface">
              {stats.inProgressCount} đơn
            </p>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface pl-10 pr-4 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 h-10 text-xs font-bold text-on-surface-variant">
            <Filter className="h-3.5 w-3.5" />
            <span>Trạng thái:</span>
          </div>
          {/* LƯU Ý PHẢI CÓ DẤU NGOẶC VUÔNG SAU DẤU NGOẶC NHỌN */}
          {[
            { key: "ALL", label: "Tất cả đơn" },
            { key: "PENDING", label: "Chờ duyệt" },
            { key: "CONFIRMED", label: "Đã xác nhận" },
            { key: "DELIVERED", label: "Đã giao" },
            { key: "CANCELLED", label: "Đã hủy" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => {
                setStatusFilter(st.key);
                setPage(1);
              }}
              className={`h-10 px-3.5 rounded-xl text-xs font-black transition-all ${statusFilter === st.key
                ? "bg-primary text-white shadow-sm"
                : "border border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container-low"
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
                      <p className="text-sm font-bold">
                        Không tìm thấy đơn hàng nào khớp với bộ lọc.
                      </p>
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
                      {order.display_id}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-on-surface">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-on-surface-variant/70 font-medium">
                        {order.customer_phone}
                      </div>
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
                    <td
                      className="p-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
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
              Trang {page} / {totalPages} ({filteredOrders.length} đơn hàng)
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
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
                      Chi Tiết Đơn Hàng {selectedOrder.display_id}
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
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                      Thông tin khách hàng
                    </h4>
                    <div className="flex items-start gap-2 text-sm font-semibold text-on-surface">
                      <User className="w-4 h-4 mt-0.5 opacity-60 text-on-surface-variant" />
                      <div>
                        <p>{selectedOrder.customer_name}</p>
                        <p className="text-xs text-on-surface-variant/80 font-medium">
                          SĐT: {selectedOrder.customer_phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-primary uppercase tracking-wider">
                      Địa chỉ nhận hàng
                    </h4>
                    <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
                      {selectedOrder.shipping_address}
                    </p>
                  </div>
                </div>

                {/* Danh sách vật tư/sản phẩm đặt mua */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider">
                    Danh mục vật tư yêu cầu
                  </h4>
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
                          <tr
                            key={item.id}
                            className="hover:bg-surface-container-low/20 transition-colors"
                          >
                            <td className="p-3 font-bold text-on-surface">
                              {item.product_name}
                            </td>
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
                          <td
                            colSpan="3"
                            className="p-3 text-right text-sm uppercase tracking-wide text-on-surface-variant"
                          >
                            Tổng hóa đơn:
                          </td>
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
                    <span className="font-bold block text-amber-800 uppercase tracking-wide text-[10px]">
                      Ghi chú từ khách hàng:
                    </span>
                    "{selectedOrder.notes}"
                  </div>
                )}
              </div>

              {/* Footer điều phối trạng thái hoặc đóng đơn */}
              <div className="flex flex-wrap items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/60 px-6 py-4 gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">
                    Cập nhật tiến độ:
                  </span>

                  {selectedOrder.status === "pending_payment" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          "pending",
                          "Đã thanh toán",
                          "Khách hàng đã hoàn tất thanh toán",
                        )
                      }
                      className="h-9 px-3 bg-blue-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                    >
                      Xác nhận đã thanh toán
                    </button>
                  )}

                  {selectedOrder.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(
                            selectedOrder.id,
                            "production",
                            "Đang sản xuất",
                            "Đơn hàng đã được chuyển xuống xưởng sản xuất",
                          )
                        }
                        className="h-9 px-3 bg-amber-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-amber-700 transition-all"
                      >
                        Bắt đầu sản xuất
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateStatus(
                            selectedOrder.id,
                            "cancelled",
                            "Đã hủy đơn",
                            "Đơn hàng bị hủy",
                          )
                        }
                        className="h-9 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-lg hover:bg-rose-100 transition-all"
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}

                  {selectedOrder.status === "production" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          "delivering",
                          "Đang giao hàng",
                          "Đơn hàng đang được vận chuyển đến khách hàng",
                        )
                      }
                      className="h-9 px-3 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                    >
                      Chuyển sang giao hàng
                    </button>
                  )}

                  {selectedOrder.status === "delivering" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          "completed",
                          "Đã hoàn thành",
                          "Đơn hàng đã giao thành công và hoàn tất",
                        )
                      }
                      className="h-9 px-3 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-sm hover:bg-emerald-700 transition-all"
                    >
                      Đánh dấu hoàn thành
                    </button>
                  )}

                  {(selectedOrder.status === "completed" ||
                    selectedOrder.status === "cancelled") && (
                      <span className="text-xs font-black text-on-surface-variant/60 italic">
                        Đơn hàng này đã đóng vòng đời điều phối.
                      </span>
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
