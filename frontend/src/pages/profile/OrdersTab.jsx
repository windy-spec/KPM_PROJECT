import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Download,
  CreditCard,
  Loader2,
  X,
} from "lucide-react";
import { showError } from "../../utils/notify";
import orderService from "../../services/order.service";
import Portal from "../../components/common/Portal";
import { useSocket } from "../../context/SocketContext";
import { showSuccess } from "../../utils/notify";

const OrdersTab = () => {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for tracking modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [trackingData, setTrackingData] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getMyOrders();
        if (res.success && res.data) {
          const formattedOrders = res.data.map((o) => ({
            id: o.id, // GIỮ NGUYÊN UUID ĐỂ THANH TOÁN
            order_code: o.order_code, // Tách riêng mã hiển thị
            created_at: o.created_at,
            total_amount: parseFloat(o.total_amount) || 0,
            shipping_fee: parseFloat(o.shipping_fee) || 0,
            installation_fee: parseFloat(o.installation_fee) || 0,
            status: o.production_status,
            items:
              o.order_items?.map((i) => ({
                name: i.products?.product_name || "Sản phẩm",
                specs: i.products?.materials?.material_name || "",
              })) || [],
            raw_items: o.order_items, // Giữ lại nguyên gốc để truyền qua Checkout
          }));
          setOrders(formattedOrders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdated = (data) => {
      setOrders((prev) =>
        prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o)
      );
      showSuccess(`Đơn hàng ${data.orderId.split('-').pop()} vừa được cập nhật: ${data.stage_name}`);

      // Nếu đang mở modal theo dõi chính đơn hàng này, cập nhật thêm tracking log luôn
      setTrackingData(prev => {
        // Chỉ thêm vào nếu trùng order đang mở modal
        if (selectedTrackingOrder && selectedTrackingOrder.id === data.orderId) {
          return [{
            stage_name: data.stage_name,
            stage_description: data.stage_description,
            created_at: new Date().toISOString()
          }, ...prev];
        }
        return prev;
      });
    };

    socket.on("orderStatusUpdated", handleOrderStatusUpdated);

    return () => {
      socket.off("orderStatusUpdated", handleOrderStatusUpdated);
    };
  }, [socket, selectedTrackingOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    // Trạng thái chờ thanh toán riêng
    if (status === "pending_payment") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          <CreditCard className="w-3 h-3" /> Chờ thanh toán
        </span>
      );
    }
    // Gom tất cả trạng thái nội bộ (pending -> production_completed) thành 1 label
    const processingStatuses = [
      "pending", "production", "admin_approved", "WAITING_WAREHOUSE",
      "warehouse_received", "out_of_stock", "import_approved",
      "production_ready", "production_completed",
    ];
    if (processingStatuses.includes(status)) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang xử lý đơn hàng
        </span>
      );
    }
    if (status === "delivering") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
          <Truck className="w-3 h-3" /> Đang giao hàng
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
          Đã hủy
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  // Hàm xác nhận đã nhận hàng (delivering -> completed)
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const handleConfirmReceived = async (orderId) => {
    if (!window.confirm("Xác nhận bạn đã nhận được hàng? Đơn hàng sẽ được đánh dấu hoàn thành.")) return;
    setConfirmingOrderId(orderId);
    try {
      const res = await orderService.updateOrderStatus(orderId, {
        status: "completed",
        stage_name: "Đã nhận hàng",
        stage_description: "Khách hàng xác nhận đã nhận hàng thành công.",
      });
      if (res.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)));
        showSuccess("Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn thành.");
      }
    } catch (error) {
      console.error(error);
      showError("Có lỗi xảy ra khi xác nhận nhận hàng.");
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleTrackOrder = async (order) => {
    setSelectedTrackingOrder(order);
    setTrackingModalOpen(true);
    setTrackingLoading(true);
    try {
      const res = await orderService.getOrderTracking(order.id);
      if (res.success && res.data) {
        setTrackingData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">
        Đang tải danh sách đơn hàng...
      </div>
    );

  return (
    <div className="mt-6 space-y-4">
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <Package className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">
            Bạn chưa có đơn hàng nào
          </h3>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                  <span className="text-primary">{order.order_code}</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">
                  Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(order.status)}
                <p className="text-lg font-black text-on-surface">
                  {formatCurrency(order.total_amount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-bold text-on-surface">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.specs}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                {order.status === "pending_payment"
                  ? "Vui lòng thanh toán để sản xuất"
                  : "Đang cập nhật tiến độ..."}
              </div>

              <div className="flex gap-3">
                {/* HIỂN THỊ NÚT THANH TOÁN LẠI NẾU ĐANG CHỜ TIỀN */}
                {order.status === "pending_payment" ? (
                  <button
                    onClick={() => {
                      // Bắt buộc phải format lại cục data này trước khi truyền đi
                      const formattedCheckoutItems = order.raw_items.map(
                        (i) => ({
                          id: i.id,
                          product_id: i.product_id,
                          product_name: i.products?.product_name || "Sản phẩm",
                          product_code: i.products?.product_code || "KPM",
                          image:
                            i.products?.product_images?.[0]?.image_url ||
                            "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200",
                          material_name:
                            i.products?.materials?.material_name || "Linh kiện",
                          quantity: i.quantity,
                          price: parseFloat(i.price) || 0,
                        }),
                      );

                      navigate("/checkout", {
                        state: {
                          order_id: order.id,
                          checkoutItems: formattedCheckoutItems, // Truyền cái data đã format vào đây
                          from_order: true,
                          shipping_fee: order.shipping_fee,
                          installation_fee: order.installation_fee,
                          total_amount: order.total_amount,
                        },
                      });
                    }}
                    className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md"
                  >
                    Tiếp tục thanh toán
                  </button>
                ) : (
                  <div className="flex gap-2">
                    {order.status === "delivering" && (
                      <button
                        onClick={() => handleConfirmReceived(order.id)}
                        disabled={confirmingOrderId === order.id}
                        className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {confirmingOrderId === order.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận hàng</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleTrackOrder(order)}
                      className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-colors shadow-sm"
                    >
                      Theo dõi đơn hàng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Tracking Modal */}
      {trackingModalOpen && selectedTrackingOrder && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[32px] border border-outline-variant/60 bg-surface shadow-2xl overflow-hidden animate-scale-up">

              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-low px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">
                      Theo Dõi Tiến Độ
                    </h3>
                    <p className="text-xs font-bold text-on-surface-variant/70">
                      Đơn hàng {selectedTrackingOrder.order_code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nội dung Tracking Timeline */}
              <div className="flex-1 overflow-y-auto p-6">
                {trackingLoading ? (
                  <div className="py-8 text-center text-sm font-bold text-on-surface-variant/70 animate-pulse">
                    Đang tải dữ liệu tiến độ...
                  </div>
                ) : trackingData.length === 0 ? (
                  <div className="py-8 text-center text-sm font-bold text-on-surface-variant/70">
                    Chưa có thông tin tiến độ nào được ghi nhận.
                  </div>
                ) : (
                  <div className="relative pl-4 border-l-2 border-outline-variant/40 space-y-6">
                    {trackingData.map((track, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] mt-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary shadow-sm" />
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                            {new Date(track.created_at).toLocaleString("vi-VN")}
                          </p>
                          <h4 className="text-sm font-black text-on-surface">
                            {track.stage_name}
                          </h4>
                          {track.stage_description && (
                            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                              {track.stage_description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="flex justify-end border-t border-outline-variant/40 bg-surface-container-low/60 px-6 py-4">
                <button
                  onClick={() => setTrackingModalOpen(false)}
                  className="h-9 rounded-lg border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        </Portal>
      )}

    </div>
  );
};

export default OrdersTab;
