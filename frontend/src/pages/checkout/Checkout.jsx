import React, { useState, useEffect } from "react";
import {
  CreditCard,
  MapPin,
  Phone,
  User,
  Truck,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { authService } from "../../services/auth.service";
import notify from "../../utils/notify";
import defaultProductImg from "../../assets/img/avt_chung.jpg";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isFromOrder = location.state?.from_order;
  const cartItems = location.state?.checkoutItems || [];
  const orderId = location.state?.order_id || null;

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [needInstallation, setNeedInstallation] = useState(
    location.state?.from_order ? (location.state?.installation_fee > 0) : false
  );
  const [paymentMethod, setPaymentMethod] = useState("vietqr");
  const [paymentOption, setPaymentOption] = useState("full"); // "full" or "deposit"
  const [qrData, setQrData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAndCheckProfile = async () => {
      try {
        const res = await authService.getMe();
        const profile = res.data?.data?.profile;
        const user = res.data?.data?.user;

        if (!profile?.phoneNumber || !profile?.address) {
          notify.showWarning(
            "Vui lòng cập nhật Số điện thoại và Địa chỉ trước khi thanh toán!",
          );
          navigate("/profile?panel=profile");
          return;
        }

        setShippingInfo({
          fullName:
            `${profile.firstName || ""} ${profile.middleName || ""} ${profile.lastName || ""}`
              .replace(/\s+/g, " ")
              .trim(),
          phone: profile.phoneNumber,
          email: user?.email || "",
          address: profile.address,
          notes: "",
        });
      } catch (error) {
        console.error("Lỗi tải profile:", error);
        notify.showError(
          "Không thể xác thực thông tin. Vui lòng đăng nhập lại.",
        );
        navigate("/login");
      } finally {
        setProfileLoading(false);
      }
    };
    loadAndCheckProfile();
  }, [navigate]);

  // TÍNH TOÁN TIỀN NONG TỰ ĐỘNG
  const passedShippingFee = location.state?.shipping_fee;
  const passedInstallationFee = location.state?.installation_fee;
  const passedTotalAmount = location.state?.total_amount;

  const tempTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const shippingFee = isFromOrder && passedShippingFee !== undefined
    ? passedShippingFee
    : (tempTotal > 5000000 ? 0 : 150000);

  // Lấy 8% tổng giá trị linh kiện làm phí lắp đặt/thi công (Tự động scale theo độ khủng của đơn hàng)
  const calculateAutoInstallFee = (items) => {
    return items.reduce(
      (acc, item) => acc + item.price * item.quantity * 0.08,
      0,
    );
  };

  const installationFee = needInstallation
    ? (isFromOrder && passedInstallationFee > 0 ? passedInstallationFee : calculateAutoInstallFee(cartItems))
    : 0;

  const finalTotal = isFromOrder && passedTotalAmount !== undefined && (installationFee === passedInstallationFee)
    ? passedTotalAmount
    : tempTotal + shippingFee + installationFee;
  const isLocked = isSubmitting || !!qrData || profileLoading;

  // Tự động chuyển phương thức thanh toán nếu COD bị khóa do finalTotal
  useEffect(() => {
    if (paymentMethod === "cod" && finalTotal >= 10000000) {
      setPaymentMethod("vietqr");
    }
  }, [finalTotal, paymentMethod]);


  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!orderId) {
      notify.showError(
        "Không tìm thấy mã đơn hàng. Vui lòng quay lại giỏ hàng.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Cập nhật Order vào Database
      await apiClient.put(`/orders/${orderId}/checkout`, {
        customer_name: shippingInfo.fullName,
        customer_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        order_notes: shippingInfo.notes,
        shipping_fee: shippingFee,
        installation_fee: installationFee,
        final_total: finalTotal,
        is_deposit: paymentOption === "deposit"
      });

      // 2. Gọi thanh toán
      let paymentUrl = null;
      let payload = { order_id: orderId, is_deposit: paymentOption === "deposit" };
      if (paymentMethod === "momo") {
        const res = await apiClient.post("/payments/momo", payload);
        paymentUrl = res.data?.data?.payUrl;
      } else if (paymentMethod === "vnpay") {
        const res = await apiClient.post("/payments/vnpay", payload);
        paymentUrl = res.data?.data?.payUrl;
      } else if (paymentMethod === "vietqr") {
        const res = await apiClient.post("/payments/vietqr", payload);
        if (res.data?.success) setQrData(res.data.data);
      } else if (paymentMethod === "cod") {
        await apiClient.post("/payments/cash", payload);
        notify.showSuccess("Đã ghi nhận đặt hàng thành công!");
        navigate("/profile?panel=orders");
        return;
      }
      
      if (paymentUrl) window.location.href = paymentUrl;
    } catch (e) {
      notify.showError(
        "Lỗi thanh toán: " + (e.response?.data?.message || e.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-primary">
        Đang đồng bộ hồ sơ khách hàng...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-6">
          <Link
            to={isFromOrder ? "/profile?panel=orders" : "/cart"}
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromOrder ? "Quay lại đơn hàng" : "Quay lại giỏ hàng"}
          </Link>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wider text-on-surface mb-8">
          Thanh toán đơn hàng
        </h1>

        <form
          onSubmit={handleSubmitOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                    Thông tin nhận hàng
                  </h2>
                </div>
                <Link
                  to="/profile?panel=profile"
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Cập nhật hồ sơ
                </Link>
              </div>

              <div className="p-3 mb-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary font-medium leading-relaxed">
                  Thông tin giao hàng được lấy tự động từ Hồ sơ của bạn. Bạn chỉ
                  có thể sửa <b>Ghi chú</b>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                      <input
                        type="text"
                        value={shippingInfo.fullName}
                        disabled
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 pl-10 pr-4 py-2.5 text-sm cursor-not-allowed text-on-surface-variant font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                      <input
                        type="text"
                        value={shippingInfo.phone}
                        disabled
                        className="w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 pl-10 pr-4 py-2.5 text-sm cursor-not-allowed text-on-surface-variant font-medium"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={shippingInfo.email}
                    disabled
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 px-4 py-2.5 text-sm cursor-not-allowed text-on-surface-variant font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Địa chỉ nhận hàng
                  </label>
                  <textarea
                    rows={2}
                    value={shippingInfo.address}
                    disabled
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container/30 px-4 py-2.5 text-sm cursor-not-allowed text-on-surface-variant font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Ghi chú giao hàng
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={shippingInfo.notes}
                    onChange={(e) =>
                      setShippingInfo({
                        ...shippingInfo,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Lưu ý về giờ giao hàng..."
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary"
                  checked={needInstallation}
                  onChange={(e) => setNeedInstallation(e.target.checked)}
                  disabled={isLocked}
                />
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <span className="text-base font-black uppercase tracking-wide text-on-surface">
                    Yêu cầu hỗ trợ lắp đặt tại nhà
                  </span>
                </div>
              </label>
              {needInstallation && (
                <p className="mt-3 text-xs text-on-surface-variant/80 italic animate-in fade-in pl-8">
                  * Hệ thống đã tự động bóc tách vật tư và tính toán chi phí thi
                  công/lắp ráp phù hợp.
                </p>
              )}
            </div>

            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-5">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                  Phương thức thanh toán
                </h2>
              </div>
              
              {finalTotal >= 10000000 && (
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-bold text-on-surface">Lựa chọn thanh toán:</h3>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentOption === "full" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}>
                      <input type="radio" name="paymentOption" value="full" checked={paymentOption === "full"} onChange={() => setPaymentOption("full")} disabled={isLocked} className="accent-primary" />
                      <span className="text-sm font-bold text-on-surface">Thanh toán toàn bộ</span>
                    </label>
                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${paymentOption === "deposit" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}>
                      <input type="radio" name="paymentOption" value="deposit" checked={paymentOption === "deposit"} onChange={() => { setPaymentOption("deposit"); if (paymentMethod === "cod") setPaymentMethod("vietqr"); }} disabled={isLocked} className="accent-primary" />
                      <div>
                        <span className="text-sm font-bold text-on-surface block">Thanh toán cọc 10%</span>
                        <span className="text-[11px] text-on-surface-variant block">Chỉ tính trên vật tư. Ship/Lắp đặt thu đợt 2.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "vietqr" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vietqr"
                    checked={paymentMethod === "vietqr"}
                    onChange={() => setPaymentMethod("vietqr")}
                    disabled={isLocked}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-on-surface">
                      Chuyển khoản Ngân hàng (VietQR)
                    </span>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "vnpay" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                    disabled={isLocked}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-on-surface">
                      Thanh toán qua cổng VNPay
                    </span>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "momo" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60 hover:bg-surface-container/10"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                    disabled={isLocked}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-on-surface">
                      Thanh toán qua Ví MoMo
                    </span>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    paymentMethod === "cod" ? "border-primary bg-primary/[0.02]" : "border-outline-variant/60"
                  } ${
                    isLocked || paymentOption === "deposit" || finalTotal >= 10000000 ||
                    (shippingInfo.address.toLowerCase().includes("bình dương") ||
                     shippingInfo.address.toLowerCase().includes("cần giờ") ||
                     shippingInfo.address.toLowerCase().includes("vũng tàu") ||
                     !shippingInfo.address.toLowerCase().includes("hồ chí minh"))
                      ? "opacity-50 cursor-not-allowed bg-surface-container/30"
                      : "cursor-pointer hover:bg-surface-container/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    disabled={isLocked || paymentOption === "deposit" || finalTotal >= 10000000 ||
                      (shippingInfo.address.toLowerCase().includes("bình dương") ||
                       shippingInfo.address.toLowerCase().includes("cần giờ") ||
                       shippingInfo.address.toLowerCase().includes("vũng tàu") ||
                       !shippingInfo.address.toLowerCase().includes("hồ chí minh"))}
                    className="mt-1 accent-primary disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-on-surface">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    {paymentOption === "deposit" ? (
                      <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Thanh toán cọc 10% không hỗ trợ COD, vui lòng chọn phương thức trực tuyến.
                      </p>
                    ) : finalTotal >= 10000000 ? (
                      <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Đơn hàng từ 10.000.000đ trở lên bắt buộc phải đặt cọc, không hỗ trợ COD toàn bộ.
                      </p>
                    ) : (shippingInfo.address.toLowerCase().includes("bình dương") ||
                         shippingInfo.address.toLowerCase().includes("cần giờ") ||
                         shippingInfo.address.toLowerCase().includes("vũng tàu") ||
                         !shippingInfo.address.toLowerCase().includes("hồ chí minh")) ? (
                      <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Khu vực của bạn không hỗ trợ COD, vui lòng chuyển khoản.
                      </p>
                    ) : null}
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm sticky top-28">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-4">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                  Đơn hàng của bạn
                </h2>
              </div>
              <div className="divide-y divide-outline-variant/30 max-h-[320px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 items-center">
                    <img
                      src={item.image || defaultProductImg}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded-lg border border-outline-variant/40 bg-surface-container/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">
                        {item.product_name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-on-surface-variant font-medium">
                          SL: x{item.quantity}
                        </span>
                        <span className="text-xs font-bold text-on-surface">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}
                          đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-outline-variant/50 pt-4 mt-2 space-y-2.5 text-sm font-semibold">
                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Tạm tính linh kiện</span>
                  <span>{tempTotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-on-surface-variant/80">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Phí vận chuyển
                  </span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
                {needInstallation && (
                  <div className="flex justify-between text-on-surface-variant/80 text-primary">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" /> Phí lắp đặt
                    </span>
                    <span>{installationFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="border-t border-dashed border-outline-variant/60 pt-3 mt-1 flex justify-between text-base font-black text-on-surface">
                  <span>TỔNG TIỀN</span>
                  <span className="text-primary text-lg">
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLocked}
                className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt đơn"}
              </button>
            </div>
          </div>
        </form>
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
              Quét mã thanh toán
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
                <span className="text-on-surface-variant font-medium">
                  Số tiền:
                </span>
                <span className="text-primary font-black text-lg">
                  {qrData.qr_amount.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">
                  Nội dung:
                </span>
                <span className="font-bold text-on-surface">
                  {qrData.description}
                </span>
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

export default Checkout;
