import React, { useState } from "react";
import {
  CreditCard,
  MapPin,
  Phone,
  User,
  Truck,
  FileText,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../services/apiClient";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy giỏ hàng và order_id từ Cart truyền sang
  const cartItems = location.state?.checkoutItems || [];
  const orderId = location.state?.order_id || null;

  // Nếu không có item nào, điều hướng về giỏ hàng
  React.useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  // 2. State quản lý thông tin khách hàng & vận chuyển
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // 3. State quản lý phương thức thanh toán (COD hoặc Chuyển khoản ngân hàng)
  const [paymentMethod, setPaymentMethod] = useState("vietqr");
  const [qrData, setQrData] = useState(null);
  // Tính toán tổng tiền
  const tempTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shippingFee = tempTotal > 5000000 ? 0 : 150000; // Đơn trên 5tr miễn phí vận chuyển nội thành
  const finalTotal = tempTotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (
      !shippingInfo.fullName ||
      !shippingInfo.phone ||
      !shippingInfo.address
    ) {
      alert("Vui lòng điền đầy đủ các thông tin giao hàng bắt buộc!");
      return;
    }

    if (!orderId) {
      alert("Không tìm thấy mã đơn hàng. Vui lòng quay lại giỏ hàng.");
      return;
    }

    try {
      if (paymentMethod === "momo") {
        const res = await apiClient.post("/payments/momo", {
          order_id: orderId,
        });
        if (res.data?.data?.payUrl) {
          window.location.href = res.data.data.payUrl;
        }
      } else if (paymentMethod === "vnpay") {
        const res = await apiClient.post("/payments/vnpay", {
          order_id: orderId,
        });
        if (res.data?.data?.payUrl) {
          window.location.href = res.data.data.payUrl;
        }
      } else if (paymentMethod === "vietqr") {
        const res = await apiClient.post("/payments/vietqr", {
          order_id: orderId,
        });
        // Bỏ alert đi, lấy data QR nhét vào state để bung giao diện Popup lên
        if (res.data?.success) {
          setQrData(res.data.data);
        }
      } else if (paymentMethod === "cod") {
        const res = await apiClient.post("/payments/cash", {
          order_id: orderId,
        });
        alert(
          "Đã ghi nhận đặt hàng thành công! Vui lòng thanh toán bằng tiền mặt khi nhận hàng.",
        );
        navigate("/profile?panel=orders");
      }
    } catch (e) {
      alert("Lỗi thanh toán: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="min-h-screen bg-surface-container/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Nút quay lại */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
          </Link>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-wider text-on-surface mb-8">
          Thanh toán đơn hàng
        </h1>

        <form
          onSubmit={handleSubmitOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG & PHƯƠNG THỨC THANH TOÁN (8 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Khối 1: Thông tin giao hàng */}
            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-5">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                  Thông tin giao hàng
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={shippingInfo.fullName}
                        onChange={handleInputChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        placeholder="09xx xxx xxx"
                        className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
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
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Địa chỉ nhận hàng *
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố..."
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={shippingInfo.notes}
                    onChange={handleInputChange}
                    placeholder="Lưu ý về giờ giao hàng, yêu cầu khi bốc dỡ vật tư..."
                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/10 px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Khối 2: Phương thức thanh toán */}
            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-5">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                {/* Lựa chọn 1: Chuyển khoản VietQR */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "vietqr"
                      ? "border-primary bg-primary/[0.02]"
                      : "border-outline-variant/60 hover:bg-surface-container/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vietqr"
                    checked={paymentMethod === "vietqr"}
                    onChange={() => setPaymentMethod("vietqr")}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-on-surface">
                      Chuyển khoản Ngân hàng (VietQR)
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Hệ thống sẽ tạo mã QR kèm nội dung chuyển khoản tự động.
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 2: VNPay */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "vnpay"
                      ? "border-primary bg-primary/[0.02]"
                      : "border-outline-variant/60 hover:bg-surface-container/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface">
                        Thanh toán qua cổng VNPay
                      </span>
                      <span className="bg-[#005BAA] text-white text-[10px] px-1.5 py-0.5 rounded font-black uppercase">
                        VNPAY
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Hệ thống sẽ điều hướng bạn sang cổng thanh toán quốc gia
                      VNPay (Hỗ trợ thẻ ATM nội địa, QR Pay, Visa/Master).
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 3: Ví MoMo */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "momo"
                      ? "border-primary bg-primary/[0.02]"
                      : "border-outline-variant/60 hover:bg-surface-container/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface">
                        Thanh toán qua Ví điện tử MoMo
                      </span>
                      <span className="bg-[#A50064] text-white text-[10px] px-1.5 py-0.5 rounded font-black uppercase">
                        MoMo
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Hệ thống sẽ điều hướng bạn sang trang thanh toán MoMo để
                      quét mã QR hoặc đăng nhập thanh toán an toàn.
                    </p>
                  </div>
                </label>

                {/* Lựa chọn 3: COD */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/[0.02]"
                      : "border-outline-variant/60 hover:bg-surface-container/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-on-surface">
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Thanh toán bằng tiền mặt cho đơn vị vận chuyển khi nhận
                      hàng. (Chỉ áp dụng với linh kiện có sẵn, không áp dụng cho
                      hàng cắt CNC theo yêu cầu).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm sticky top-28">
              <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-4">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">
                  Đơn hàng của bạn
                </h2>
              </div>

              {/* Danh sách sản phẩm thu nhỏ */}
              <div className="divide-y divide-outline-variant/30 max-h-[320px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 items-center">
                    <img
                      src={item.image}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded-lg border border-outline-variant/40 bg-surface-container/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant/75 mt-0.5">
                        Vật tư: {item.material_name}
                      </p>
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

              {/* Tính toán tiền nong */}
              <div className="border-t border-outline-variant/50 pt-4 mt-2 space-y-2.5 text-sm font-semibold">
                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Tạm tính</span>
                  <span>{tempTotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-on-surface-variant/80">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Vận chuyển
                  </span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString("vi-VN")}đ`}
                  </span>
                </div>

                <div className="border-t border-dashed border-outline-variant/60 pt-3 mt-1 flex justify-between text-base font-black text-on-surface">
                  <span>TỔNG TIỀN</span>
                  <span className="text-primary text-lg">
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              {/* Nút đặt hàng cuối cùng */}
              <button
                type="submit"
                className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Xác nhận đặt đơn
              </button>

              <div className="mt-4 flex items-center gap-2 justify-center text-[11px] font-medium text-on-surface-variant/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Cam kết
                bảo mật thông tin đơn hàng tuyệt đối
              </div>
            </div>
          </div>
        </form>
      </div>
      {/* GIAO DIỆN POPUP QUÉT MÃ VIETQR */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            {/* Biểu tượng đóng */}
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
            <p className="text-xs text-on-surface-variant mb-6 font-medium leading-relaxed">
              {qrData.message}
            </p>

            {/* Mã QR */}
            <div className="p-2 border-2 border-primary/20 rounded-2xl bg-white shadow-inner mb-6 mx-auto w-fit">
              <img
                src={qrData.qrCodeUrl}
                alt="Mã VietQR"
                className="w-56 h-56 object-contain rounded-xl"
              />
            </div>

            {/* Thông tin chuyển khoản */}
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

            {/* Nút xác nhận */}
            <button
              onClick={() => {
                setQrData(null);
                navigate("/profile?panel=orders");
              }}
              className="w-full py-3.5 bg-primary text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
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
