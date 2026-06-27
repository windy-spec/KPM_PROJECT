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

  // Constants for Order Tracking Stepper
  const TRACKING_STEPS = [
    { title: "Tiếp nhận & Thanh toán", desc: "Đã xác nhận đơn hàng" },
    { title: "Chuẩn bị Vật tư", desc: "Xuất kho / Thu mua" },
    { title: "Đang Sản Xuất", desc: "Gia công tại xưởng" },
    { title: "Giao hàng", desc: "Vận chuyển đến bạn" },
    { title: "Hoàn thành", desc: "Đã nhận hàng" }
  ];

  const getCurrentStepIndex = (status) => {
    switch (status) {
      case "pending_payment":
      case "pending_deposit":
        return 0;
      case "pending":
      case "WAITING_WAREHOUSE":
      case "EXPORTING_WAREHOUSE":
      case "out_of_stock":
        return 1;
      case "warehouse_received":
      case "production_ready":
      case "producing":
      case "MANUFACTURING":
        return 2;
      case "production_completed":
      case "delivering":
        return 3;
      case "completed":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

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
            is_deposit_paid: o.is_deposit_paid,
            deposit_amount: parseFloat(o.deposit_amount) || 0,
            status: o.production_status,
            items: o.quotation_id && o.quotations?.quotation_specs
              ? o.quotations.quotation_specs.map((s) => ({
                  name: s.component_name || "Linh kiện",
                  specs: s.note || "",
                }))
              : o.order_items?.map((i) => ({
                  name: i.products?.product_name || "Sản phẩm",
                  specs: i.products?.materials?.material_name || "",
                })) || [],
            raw_items: o.order_items, // Giữ lại nguyên gốc để truyền qua Checkout
            raw_quotation_specs: o.quotations?.quotation_specs, // Giữ thêm specs báo giá
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
            tracked_at: new Date().toISOString()
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
    if (status === "pending_deposit") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
          <CreditCard className="w-3 h-3" /> Chờ cọc 10%
        </span>
      );
    }
    // Gom tất cả trạng thái nội bộ (pending -> production_completed) thành 1 label
    const processingStatuses = [
      "pending", "production", "admin_approved", "WAITING_WAREHOUSE",
      "warehouse_received", "out_of_stock", "import_approved",
      "production_ready", "producing", "production_completed",
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

  const getActorName = (track) => {
    if (track.update_by_role)
      return track.update_by_role;
    if (track.created_at)
      return track.created_at;

    // 2. Phân tích tự động dựa trên từ khóa cốt lõi của Stage Name hoặc nội dung mô tả
    const stageName = (track.stage_name || "").toLowerCase();
    const stageDesc = (track.stage_description || "").toLowerCase();

    if (stageName.includes("admin") || stageName.includes("ban giám đốc") || stageDesc.includes("admin")) {
      return "Admin";
    }
    if (stageName.includes("kho") || stageDesc.includes("kho tiếp nhận") || stageDesc.includes("vật tư")) {
      return "Bộ phận Kho";
    }
    if (stageName.includes("xưởng") || stageName.includes("sản xuất") || stageName.includes("gia công")) {
      return "Phân xưởng sản xuất";
    }
    if (stageName.includes("khách hàng") || stageDesc.includes("khách nhận hàng")) {
      return "Khách hàng";
    }

    return "Hệ thống";
  };

  // Bản đồ ánh xạ: Chỉ giữ lại các trạng thái bạn yêu cầu và đổi tên hiển thị
  const TRACKING_MAP = {
    "pending": "Đã nhận đc đơn",
    "admin_approved": "Đã nhận đc đơn",

    "pending_payment": "Đang xử lý",
    "pending_deposit": "Đang xử lý",

    "WAITING_WAREHOUSE": "Đã chuyển kho",
    "EXPORTING_WAREHOUSE": "Đã chuyển kho",
    "out_of_stock": "Đã chuyển kho",

    "production_ready": "Kho bắt đầu sản xuất",
    "producing": "Kho bắt đầu sản xuất",
    "MANUFACTURING": "Kho bắt đầu sản xuất",

    "production_completed": "Kho sản xuất xong",

    "delivering": "Đang vận chuyển",
    "Đang giao hàng": "Đang vận chuyển",
    "đang vận chuyển": "Đang vận chuyển"
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
              <div className="flex flex-col items-end gap-1.5">
                {getStatusBadge(order.status)}
                {order.is_deposit_paid ? (
                  <div className="text-right">
                    <p className="text-xs font-bold text-on-surface-variant line-through decoration-rose-500/50 mb-0.5">
                      Tổng: {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-black uppercase mb-1">
                      Đã cọc: {formatCurrency(order.deposit_amount)}
                    </p>
                    <p className="text-lg font-black text-rose-600 leading-none">
                      <span className="text-[10px] uppercase text-rose-700 mr-1 block sm:inline">Còn nợ COD:</span>
                      {formatCurrency(order.total_amount - order.deposit_amount)}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-black text-on-surface">
                    {formatCurrency(order.total_amount)}
                  </p>
                )}
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
                      const isFromQuote = order.raw_quotation_specs && order.raw_quotation_specs.length > 0;
                      let formattedCheckoutItems = [];

                      if (isFromQuote) {
                        formattedCheckoutItems = order.raw_quotation_specs.map((s) => ({
                           id: s.id,
                           product_id: s.dimensions?.product_id || null,
                           product_name: s.component_name || "Linh kiện tùy chỉnh",
                           product_code: "KPM-CUSTOM",
                           image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200",
                           material_name: s.note || "Báo giá tùy chỉnh",
                           quantity: s.dimensions?.quantity || 1,
                           price: parseFloat(s.snapshot_price) || 0,
                        }));
                      } else {
                        formattedCheckoutItems = (order.raw_items || []).map(
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
                      }

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
                ) : order.status === "pending_deposit" ? (
                  <button
                    onClick={() => navigate(`/deposit-payment?order_id=${order.id}`)}
                    className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Thanh toán cọc 10%
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
              <div className="flex-1 overflow-y-auto bg-surface-container-lowest">
                {/* 1. KHỐI STEPPER THEO DÕI TIẾN ĐỘ TỔNG QUAN */}
                <div className="p-6 border-b border-outline-variant/30 bg-surface">
                  <h4 className="text-sm font-black text-on-surface mb-6 uppercase tracking-wider">Tiến độ tổng quan</h4>
                  {selectedTrackingOrder?.status === "cancelled" ? (
                    <div className="flex flex-col items-center justify-center py-4 text-rose-600">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
                        <X className="w-6 h-6" />
                      </div>
                      <p className="font-bold">Đơn hàng đã bị hủy bỏ</p>
                    </div>
                  ) : (
                    <div className="relative flex justify-between items-start w-full">
                      {/* Thanh nối Progress */}
                      <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700 ease-in-out"
                          style={{ width: `${(getCurrentStepIndex(selectedTrackingOrder.status) / (TRACKING_STEPS.length - 1)) * 100}%` }}
                        />
                      </div>

                      {/* Các điểm neo Stepper */}
                      {TRACKING_STEPS.map((step, index) => {
                        const currentIndex = getCurrentStepIndex(selectedTrackingOrder.status);
                        const isCompleted = index < currentIndex;
                        const isActive = index === currentIndex;
                        const isPending = index > currentIndex;

                        return (
                          <div key={index} className="relative z-10 flex flex-col items-center flex-1">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${isCompleted ? "bg-primary text-white" :
                                isActive ? "bg-primary text-white shadow-[0_0_0_4px_rgba(var(--color-primary-rgb),0.15)] ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110" :
                                  "bg-surface-container-high text-on-surface-variant"
                                }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                            </div>
                            <div className="mt-3 text-center">
                              <p className={`text-[11px] uppercase tracking-wider font-bold ${isActive ? "text-primary" : "text-on-surface"}`}>
                                {step.title}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 hidden md:block">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. KHỐI LOG LỊCH SỬ CHI TIẾT */}
                <div className="p-6">
                  <h4 className="text-sm font-black text-on-surface mb-6 uppercase tracking-wider">Lịch sử cập nhật chi tiết</h4>
                  {trackingLoading ? (
                    <div className="py-8 text-center text-sm font-bold text-on-surface-variant/70 animate-pulse">
                      Đang tải dữ liệu tiến độ...
                    </div>
                  ) : trackingData.length === 0 ? (
                    <div className="py-8 text-center text-sm font-bold text-on-surface-variant/70">
                      Chưa có thông tin tiến độ nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="relative pl-4 border-l-2 border-l-primary/30 space-y-6">
                      {trackingData
                        // BƯỚC 1: LỌC - Chỉ lấy những stage_name tồn tại trong danh sách yêu cầu
                        .filter(track => TRACKING_MAP[track.stage_name] !== undefined)
                        // BƯỚC 2: RENDER dữ liệu đã lọc
                        .map((track, idx) => {
                          const displayName = TRACKING_MAP[track.stage_name];

                          return (
                            <div key={idx} className="relative group">
                              {/* Điểm neo chấm tròn Timeline */}
                              <div className="absolute -left-[21px] mt-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary shadow-sm group-hover:scale-125 transition-transform" />

                              <div className="bg-surface p-4 rounded-2xl border border-outline-variant/40 shadow-sm hover:border-primary/30 transition-colors">

                                {/* Hiển thị thời gian cập nhật */}
                                <p className="text-[11px] font-medium text-on-surface-variant/80 mb-2 flex flex-wrap items-center gap-1.5">
                                  <span className="font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md text-[10px] tracking-wider uppercase">
                                    {getActorName(track)}
                                  </span>
                                  <span>đã cập nhật vào lúc</span>
                                  <span className="font-bold text-on-surface flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-primary" />
                                    {new Date(track.tracked_at).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric"
                                    })}
                                  </span>
                                </p>

                                {/* Tên tiêu đề tiến độ hành động - THAY BẰNG TÊN TIẾNG VIỆT ĐÃ LỌC */}
                                <h4 className="text-sm font-black text-on-surface text-primary">
                                  {displayName}
                                </h4>

                                {/* Nội dung diễn giải chi tiết từ hệ thống */}
                                {track.stage_description && (
                                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                                    {track.stage_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
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
