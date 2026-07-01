import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, AlertCircle, Loader2, XCircle, Wrench, Truck } from "lucide-react";
import apiClient from "../../services/apiClient";
import notify from "../../utils/notify";

const Phase2Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.order_id;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("vietqr");
  const [qrData, setQrData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      notify.showError("Không tìm thấy mã đơn hàng thanh toán Đợt 2.");
      navigate("/profile?panel=orders");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/orders/${orderId}`);
        const data = res.data?.data || res.data;
        if (!data) throw new Error("Order not found");

        if (!data.is_deposit_paid) {
          notify.showError("Đơn hàng chưa thanh toán cọc 10%.");
          navigate("/profile?panel=orders");
          return;
        }

        // Đảm bảo là production_completed hoặc delivering hoặc đang chờ thanh toán Phase 2
        // Tuỳ vào logic flow của status. Mình sẽ cho thanh toán nếu đã hoàn thành cọc và chưa hoàn thành đơn.
        if (data.production_status === "completed" || data.production_status === "cancelled") {
          notify.showWarning("Đơn hàng này không thể thanh toán Phase 2.");
          navigate("/profile?panel=orders");
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error("Lỗi lấy thông tin đơn hàng:", err);
        notify.showError("Không thể lấy thông tin đơn hàng.");
        navigate("/profile?panel=orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handlePayPhase2 = async () => {
    setIsSubmitting(true);
    try {
      if (paymentMethod === "momo") {
        const res = await apiClient.post("/payments/momo", {
          order_id: orderId,
          is_phase_2: true
        });
        if (res.data?.data?.payUrl) window.location.href = res.data.data.payUrl;
      } else if (paymentMethod === "vnpay") {
        const res = await apiClient.post("/payments/vnpay", {
          order_id: orderId,
          is_phase_2: true
        });
        if (res.data?.data?.payUrl) window.location.href = res.data.data.payUrl;
      } else if (paymentMethod === "vietqr") {
        const res = await apiClient.post("/payments/vietqr", {
          order_id: orderId,
          is_phase_2: true
        });
        if (res.data?.success) setQrData(res.data.data);
      } else if (paymentMethod === "cod") {
        await apiClient.post("/payments/cash", { order_id: orderId, is_phase_2: true });
        notify.showSuccess("Thanh toán thành công (COD). Đã nhận hàng!");
        navigate("/profile?panel=orders");
      }
    } catch (e) {
      notify.showError("Lỗi tạo thanh toán Đợt 2: " + (e.response?.data?.message || e.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const depositAmount = Number(order.deposit_amount) || 0;
  const totalAmount = Number(order.total_amount) || 0;
  const materialAmount = totalAmount - Number(order.shipping_fee) - Number(order.installation_fee);
  const remainingMaterial = materialAmount - depositAmount;
  const phase2Amount = totalAmount - depositAmount;

  // Lấy địa chỉ để check chặn COD
  const addressStr = (order.shipping_address || "").toLowerCase();
  const blockCOD = addressStr.includes("bình dương") || addressStr.includes("cần giờ") || addressStr.includes("vũng tàu") || !addressStr.includes("hồ chí minh");

  return (
    <div className="min-h-screen bg-surface-container/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-wider text-center text-on-surface mb-8">
          Thanh Toán Đợt 2 & Nhận Hàng
        </h1>

        <div className="bg-white border border-outline-variant/60 rounded-3xl p-8 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6 p-4 bg-primary/10 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-primary shrink-0" />
            <p className="text-sm font-medium text-on-surface">
              Đơn hàng <strong>#{order.order_code}</strong> đã gia công hoàn tất. Vui lòng thanh toán phần còn lại kèm chi phí giao hàng/lắp đặt.
            </p>
          </div>

          <div className="space-y-4 mb-8 text-sm">
            <div className="flex justify-between border-b border-outline-variant/30 pb-3">
              <span className="text-on-surface-variant font-medium">Tổng giá trị đơn hàng</span>
              <span className="font-bold">{totalAmount.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/30 pb-3">
              <span className="text-on-surface-variant font-medium">Đã thanh toán cọc (10% vật tư)</span>
              <span className="font-bold text-primary">- {depositAmount.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/30 pb-3">
              <span className="text-on-surface-variant font-medium flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> Phí lắp đặt</span>
              <span className="font-bold">{Number(order.installation_fee).toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/30 pb-3">
              <span className="text-on-surface-variant font-medium flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Phí vận chuyển</span>
              <span className="font-bold">{Number(order.shipping_fee).toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-on-surface-variant font-medium">Cần thanh toán Đợt 2</span>
              <span className="font-black text-xl text-error">{phase2Amount.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "vietqr" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="vietqr"
                checked={paymentMethod === "vietqr"}
                onChange={() => setPaymentMethod("vietqr")}
                className="accent-primary"
              />
              <span className="text-sm font-bold text-on-surface">Chuyển khoản Ngân hàng (VietQR)</span>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "vnpay" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="vnpay"
                checked={paymentMethod === "vnpay"}
                onChange={() => setPaymentMethod("vnpay")}
                className="accent-primary"
              />
              <span className="text-sm font-bold text-on-surface">Thanh toán qua cổng VNPay</span>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "momo" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="momo"
                checked={paymentMethod === "momo"}
                onChange={() => setPaymentMethod("momo")}
                className="accent-primary"
              />
              <span className="text-sm font-bold text-on-surface">Thanh toán qua Ví MoMo</span>
            </label>
            <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60"} ${blockCOD ? "opacity-50 cursor-not-allowed bg-surface-container/30" : "cursor-pointer hover:bg-surface-container/10"}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                disabled={blockCOD}
                className="mt-1 accent-primary"
              />
              <div className="flex-1">
                <span className="text-sm font-bold text-on-surface">Thanh toán khi nhận hàng (COD)</span>
                {blockCOD && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">
                    Khu vực của bạn không được hỗ trợ thanh toán COD đối với đơn đặt cọc, vui lòng chuyển khoản.
                  </p>
                )}
              </div>
            </label>
          </div>

          <button
            onClick={handlePayPhase2}
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 px-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "THANH TOÁN ĐỢT 2"}
          </button>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/profile?panel=orders")}
              className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors underline underline-offset-2"
            >
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>
      </div>

      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => {
                setQrData(null);
                navigate("/profile?panel=orders");
              }}
              className="absolute top-4 right-4 p-2 text-on-surface-variant/50 hover:text-error transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-black text-on-surface uppercase mb-1">
              Quét mã thanh toán Đợt 2
            </h3>
            <div className="p-2 border-2 border-primary/20 rounded-2xl bg-white shadow-inner mb-6 mx-auto w-fit mt-4">
              <img
                src={qrData.qrCodeUrl}
                alt="Mã VietQR"
                className="w-56 h-56 object-contain rounded-xl"
              />
            </div>
            <div className="bg-surface-container/30 p-4 rounded-xl mb-6 text-left border border-outline-variant/40 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Số tiền Đợt 2:</span>
                <span className="text-primary font-black text-lg">{qrData.qr_amount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Nội dung:</span>
                <span className="font-bold text-on-surface">{qrData.description}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setQrData(null);
                navigate("/profile?panel=orders");
              }}
              className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              TÔI ĐÃ CHUYỂN KHOẢN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2Checkout;
