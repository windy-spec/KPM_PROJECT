import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  CreditCard,
  Loader2,
  X,
  Box,
  Settings,
  Layers
} from "lucide-react";
import orderService from "../../services/order.service";
import Portal from "../../components/common/Portal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useSocket } from "../../context/SocketContext";
import { showSuccess, showError } from "../../utils/notify";

const OrdersTab = () => {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null });

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
  const [exportingPdf, setExportingPdf] = useState(null);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedBreakdownOrder, setSelectedBreakdownOrder] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedParts, setExpandedParts] = useState({});

  const navigate = useNavigate();

  const handleExportPDF = (orderId, orderCode) => {
    setExportingPdf(orderId);
    setTimeout(() => {
      window.print();
      setTimeout(() => setExportingPdf(null), 1000);
    }, 500);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders();
      if (res.success && res.data) {
        const formattedOrders = res.data.map((o) => ({
          id: o.id,
          order_code: o.order_code,
          created_at: o.created_at,
          total_amount: parseFloat(o.total_amount) || 0,
          shipping_fee: parseFloat(o.shipping_fee) || 0,
          installation_fee: parseFloat(o.installation_fee) || 0,
          is_deposit_paid: o.is_deposit_paid,
          deposit_amount: parseFloat(o.deposit_amount) || 0,
          status: o.production_status,
          customer_name: o.customer_name || o.users?.username || o.quotations?.users?.username || "Khách",
          customer_phone: o.customer_phone || o.users?.phone || o.quotations?.users?.phone || "N/A",
          shipping_address: o.shipping_address || o.quotations?.address || "Liên hệ nhận hàng",
          items: o.quotation_id
            ? [{
              name: o.quotations?.title || "Báo giá tùy chỉnh (Đã chốt)",
              specs: "Đơn hàng gia công theo yêu cầu",
              quantity: 1,
              unit_price: parseFloat(o.total_amount) || 0
            }]
            : (o.order_items || []).map((i) => ({
              name: i.products?.product_name || "Sản phẩm",
              specs: i.products?.product_code || "N/A",
              quantity: i.quantity,
              unit_price: parseFloat(i.price) || 0
            })),
          raw_items: o.order_items,
          raw_quotation_specs: o.quotations?.quotation_specs,
          quotations: o.quotations,
        }));
        setOrders(formattedOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdated = (data) => {
      fetchOrders();

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

  const handleConfirmReceived = (orderId) => {
    setConfirmModal({ isOpen: true, orderId });
  };

  const executeConfirmReceived = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ isOpen: false, orderId: null });
    if (!orderId) return;

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
            id={`order-card-${order.id}`}
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
                {order.is_deposit_paid && order.total_amount > order.deposit_amount && order.status !== "completed" ? (
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
            {order.quotations?.quotation_attachments && order.quotations.quotation_attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase mb-2">Tài liệu đính kèm (Bản vẽ)</h4>
                <div className="flex flex-wrap gap-2">
                  {order.quotations.quotation_attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                    >
                      {att.file_name || att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

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
                        formattedCheckoutItems = [
                          {
                            id: order.id,
                            product_id: null,
                            product_name: order.quotations?.nick_name || order.quotations?.title || "Sản phẩm gia công theo yêu cầu",
                            product_code: order.order_code || "KPM-CUSTOM",
                            image:
                              order.quotations?.product_images?.[0]?.image_url ||
                              order.quotations?.quotation_attachments?.find(a => 
                                !a.file_name?.startsWith("Bản vẽ 2D") && 
                                !a.file_name?.startsWith("Ảnh mô tả") && 
                                !a.file_name?.startsWith("Ảnh nét đứt") &&
                                a.file_url?.match(/\.(jpeg|jpg|png|webp)$/i)
                              )?.file_url ||
                              order.quotations?.quotation_attachments?.[0]?.file_url ||
                              "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200",
                            material_name: "Báo giá tùy chỉnh (Đã chốt)",
                            quantity: 1,
                            price: order.total_amount - (order.shipping_fee || 0) - (order.installation_fee || 0),
                          }
                        ];
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
                        onClick={() => {
                          if (order.is_deposit_paid && order.total_amount > order.deposit_amount) {
                            navigate("/phase2-checkout", { state: { order_id: order.id, total_amount: order.total_amount, deposit_amount: order.deposit_amount, shipping_fee: order.shipping_fee, installation_fee: order.installation_fee } });
                          } else {
                            handleConfirmReceived(order.id);
                          }
                        }}
                        disabled={confirmingOrderId === order.id}
                        className={`px-5 py-2 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-1.5 ${order.is_deposit_paid && order.total_amount > order.deposit_amount ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      >
                        {confirmingOrderId === order.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> {order.is_deposit_paid && order.total_amount > order.deposit_amount ? "Thanh toán đợt 2" : "Đã nhận hàng"}</>
                        )}
                      </button>
                    )}
                    {order.status === "completed" && (
                      <button
                        onClick={() => handleExportPDF(order.id, order.order_code)}
                        disabled={exportingPdf === order.id}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {exportingPdf === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Tải PDF
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBreakdownOrder(order);
                        setBreakdownModalOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                    >
                      Bóc tách
                    </button>
                    <button
                      onClick={() => handleTrackOrder(order)}
                      className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-colors shadow-sm"
                    >
                      Theo dõi
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

      {exportingPdf && (() => {
        const order = orders.find(o => o.id === exportingPdf);
        if (!order) return null;
        return (
          <Portal>
            <div className="fixed inset-0 z-[9999] bg-white print-area hidden print:block overflow-auto print:overflow-visible">
              <div className="w-full max-w-[210mm] mx-auto p-8 bg-white">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-wider mb-2">Hóa Đơn Mua Hàng</h1>
                    <p className="text-sm font-medium text-slate-600">Mã Đơn Hàng: <span className="font-bold text-slate-800">{order.order_code}</span></p>
                    <p className="text-sm font-medium text-slate-600">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-primary tracking-tight">KPM</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">Gia công cơ khí & Nhà xưởng</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex gap-8 mb-8">
                  <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Thông Tin Khách Hàng</h3>
                    <div className="space-y-1.5 text-sm font-medium text-slate-800">
                      <p><span className="text-slate-500 mr-2">Khách hàng:</span> {order.customer_name}</p>
                      <p><span className="text-slate-500 mr-2">Điện thoại:</span> {order.customer_phone}</p>
                      <p><span className="text-slate-500 mr-2">Địa chỉ:</span> {order.shipping_address}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Table */}
                <div className="mb-8 rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">Tên Sản Phẩm / Vật Tư</th>
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 text-center">Số Lượng</th>
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 text-right">Đơn Giá</th>
                        <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="py-3 px-4">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.specs}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">{item.quantity}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.unit_price > 0 ? (item.unit_price).toLocaleString('vi-VN') + ' đ' : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-black">
                            {item.unit_price > 0 ? (item.unit_price * (item.quantity || 1)).toLocaleString('vi-VN') + ' đ' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end mb-12">
                  <div className="w-1/2 space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-600 pb-3 border-b border-slate-100">
                      <span>Phí Vận Chuyển</span>
                      <span className="font-bold text-slate-800">{order.shipping_fee > 0 ? order.shipping_fee.toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium text-slate-600 pb-3 border-b border-slate-100">
                      <span>Phí Lắp Đặt</span>
                      <span className="font-bold text-slate-800">{order.installation_fee > 0 ? order.installation_fee.toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-black uppercase tracking-wider text-slate-400">Tổng Thanh Toán</span>
                      <span className="text-2xl font-black text-rose-600">{order.total_amount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-sm font-medium text-slate-500">
                      <span>Đã Cọc (Nếu có)</span>
                      <span>{order.deposit_amount > 0 ? order.deposit_amount.toLocaleString('vi-VN') + ' đ' : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between text-center pt-8 border-t border-slate-200">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-12">Người Lập Phiếu</p>
                    <p className="text-sm font-medium text-slate-800">(Ký & ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-12">Khách Hàng</p>
                    <p className="text-sm font-medium text-slate-800">(Ký & ghi rõ họ tên)</p>
                  </div>
                </div>

                <div className="mt-16 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của KPM!
                </div>
              </div>
            </div>
          </Portal>
        );
      })()}

      <ConfirmModal
        open={confirmModal.isOpen}
        title="Xác nhận nhận hàng"
        message="Xác nhận bạn đã nhận được hàng? Đơn hàng sẽ được đánh dấu hoàn thành."
        onConfirm={executeConfirmReceived}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null })}
      />
      {/* Breakdown Modal */}
      {breakdownModalOpen && selectedBreakdownOrder && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[32px] border border-outline-variant/60 bg-surface shadow-2xl overflow-hidden animate-scale-up">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-low px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface">
                      Bóc tách Vật tư
                    </h3>
                    <p className="text-xs font-bold text-on-surface-variant/70">
                      Đơn hàng {selectedBreakdownOrder.order_code}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBreakdownModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nội dung Breakdown */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
                {selectedBreakdownOrder.raw_items?.length > 0 ? (
                  selectedBreakdownOrder.raw_items.map((item, idx) => {
                    const isExpandedProduct = expandedProducts[item.id];
                    const drawings = item.products?.product_drawings || [];
                    const hasDrawings = drawings.length > 0;

                    return (
                      <div key={item.id} className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden transition-all">
                        {/* Cấp 1: Sản phẩm */}
                        <div 
                          className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpandedProduct ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                          onClick={() => setExpandedProducts(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-black text-slate-800">{item.products?.product_name}</p>
                              <p className="text-xs font-bold text-slate-500">Mã SP: {item.products?.product_code}</p>
                            </div>
                          </div>
                          <div className="text-slate-400">
                            {isExpandedProduct ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Cấp 2: Bản vẽ & Linh kiện */}
                        {isExpandedProduct && (
                          <div className="p-4 pt-2 border-t border-outline-variant/40 bg-white">
                            {!hasDrawings ? (
                              <p className="text-xs text-slate-500 italic px-4">Sản phẩm này chưa có chi tiết linh kiện.</p>
                            ) : (
                              drawings.map(dwg => {
                                const parts = dwg.drawing_parts || [];
                                return parts.map((part, pIdx) => {
                                  const partKey = `${item.id}-${part.id}`;
                                  const isExpandedPart = expandedParts[partKey];
                                  return (
                                    <div key={partKey} className="ml-4 mb-2 border border-outline-variant/50 rounded-xl overflow-hidden">
                                      {/* Cấp 2 Header */}
                                      <div 
                                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpandedPart ? 'bg-teal-50/50' : 'hover:bg-slate-50'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedParts(prev => ({ ...prev, [partKey]: !prev[partKey] }));
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Settings className="w-4 h-4 text-teal-600" />
                                          <span className="text-xs font-bold text-slate-700">{part.component_name}</span>
                                        </div>
                                        <div className="text-slate-400">
                                          {isExpandedPart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                      </div>

                                      {/* Cấp 3: Vật tư (Mock) */}
                                      {isExpandedPart && (
                                        <div className="p-3 bg-slate-50 border-t border-outline-variant/40">
                                            {/* Hiển thị vật tư lấy từ bản vẽ */}
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 pl-2">
                                              <Box className="w-3.5 h-3.5 text-slate-400" />
                                              {(() => {
                                                const comp = (item.products?.components || []).find(c => c.component_name === part.component_name);
                                                const matName = comp?.material_name ? `${comp.material_name} ${comp.thickness_value ? `(${comp.thickness_value})` : ''}` : part.material_category;
                                                return <span className="bg-white px-2 py-1 rounded border border-slate-200">Vật liệu: {matName || "Đang cập nhật..."}</span>;
                                              })()}
                                            </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl border border-outline-variant/60 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-black text-slate-800">{selectedBreakdownOrder.quotations?.title || "Báo giá tùy chỉnh"}</p>
                        <p className="text-xs font-bold text-slate-500">Đơn hàng gia công theo yêu cầu</p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-outline-variant/40 pt-4">
                      {selectedBreakdownOrder.raw_quotation_specs?.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-700 uppercase mb-2">Chi tiết Bóc tách Vật tư:</p>
                          {selectedBreakdownOrder.raw_quotation_specs.map((spec, sIdx) => {
                            const specKey = `spec-${sIdx}`;
                            const isExpandedSpec = expandedParts[specKey];
                            return (
                              <div key={specKey} className="border border-outline-variant/50 rounded-xl overflow-hidden mb-2">
                                <div 
                                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpandedSpec ? 'bg-teal-50/50' : 'hover:bg-slate-50'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedParts(prev => ({ ...prev, [specKey]: !prev[specKey] }));
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-teal-600" />
                                    <span className="text-xs font-bold text-slate-700">{spec.component_name || `Linh kiện ${sIdx + 1}`}</span>
                                  </div>
                                  <div className="text-slate-400">
                                    {isExpandedSpec ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                </div>
                                
                                {isExpandedSpec && (
                                  <div className="p-3 bg-slate-50 border-t border-outline-variant/40">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 pl-2">
                                      <Box className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="bg-white px-2 py-1 rounded border border-slate-200">Vật liệu: {spec.materials?.material_name || "Vật tư tùy chỉnh"} {spec.material_thickness?.thickness_value ? `(${spec.material_thickness.thickness_value})` : ""}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Chưa có chi tiết vật tư cụ thể.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
};

export default OrdersTab;
