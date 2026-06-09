import React, { useState } from 'react';
import {
    CreditCard,
    MapPin,
    Phone,
    User,
    Truck,
    FileText,
    ShoppingBag,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Checkout = () => {
    const navigate = useNavigate();

    // 1. Giả lập danh sách sản phẩm trong giỏ hàng được chọn để thanh toán
    // (Sau này bạn sẽ lấy từ Context hoặc Redux tùy theo cấu trúc dự án)
    const [cartItems] = useState([
        {
            id: 1,
            product_name: "Cổng sắt mỹ thuật CNC 4 cánh",
            product_code: "GATE-CNC-04",
            image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200",
            material_name: "Sắt tấm dày 5mm",
            quantity: 1,
            price: 15500000,
        },
        {
            id: 2,
            product_name: "Bản mã thép vuông đục lỗ",
            product_code: "BM-200-10",
            image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?q=80&w=200",
            material_name: "Thép SS400 dày 10mm",
            quantity: 50,
            price: 45000,
        }
    ]);

    // 2. State quản lý thông tin khách hàng & vận chuyển
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    // 3. State quản lý phương thức thanh toán (COD hoặc Chuyển khoản ngân hàng)
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

    // Tính toán tổng tiền
    const tempTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingFee = tempTotal > 5000000 ? 0 : 150000; // Đơn trên 5tr miễn phí vận chuyển nội thành
    const finalTotal = tempTotal + shippingFee;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitOrder = (e) => {
        e.preventDefault();

        // Validate cơ bản
        if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
            alert("Vui lòng điền đầy đủ các thông tin giao hàng bắt buộc!");
            return;
        }

        const orderPayload = {
            shipping_info: shippingInfo,
            payment_method: paymentMethod,
            items: cartItems,
            total_price: finalTotal,
            status: 'pending'
        };

        console.log("Payload đơn hàng gửi lên Backend:", orderPayload);

        // Xử lý gọi API ở đây (ví dụ: orderService.createOrder(orderPayload))
        // Sau đó điều hướng qua trang thành công hoặc trang quét mã QR MoMo/VNPAY/VietQR
        alert("Đặt hàng thành công! (Xem log để biết chi tiết payload)");
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-surface-container/20 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1280px] mx-auto">

                {/* Nút quay lại */}
                <div className="mb-6">
                    <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
                    </Link>
                </div>

                <h1 className="text-2xl font-black uppercase tracking-wider text-on-surface mb-8">
                    Thanh toán đơn hàng
                </h1>

                <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG & PHƯƠNG THỨC THANH TOÁN (8 Columns) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Khối 1: Thông tin giao hàng */}
                        <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-4 mb-5">
                                <MapPin className="w-5 h-5 text-primary" />
                                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">Thông tin giao hàng</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-on-surface-variant">Họ và tên *</label>
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
                                        <label className="text-xs font-bold text-on-surface-variant">Số điện thoại *</label>
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
                                    <label className="text-xs font-bold text-on-surface-variant">Địa chỉ Email</label>
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
                                    <label className="text-xs font-bold text-on-surface-variant">Địa chỉ nhận hàng *</label>
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
                                    <label className="text-xs font-bold text-on-surface-variant">Ghi chú đơn hàng</label>
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
                                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">Phương thức thanh toán</h2>
                            </div>

                            <div className="space-y-3">
                                {/* Lựa chọn 1: Chuyển khoản */}
                                <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'bank_transfer'
                                        ? 'border-primary bg-primary/[0.02]'
                                        : 'border-outline-variant/60 hover:bg-surface-container/10'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bank_transfer"
                                        checked={paymentMethod === 'bank_transfer'}
                                        onChange={() => setPaymentMethod('bank_transfer')}
                                        className="mt-1 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-on-surface">Chuyển khoản Ngân hàng (VietQR)</div>
                                        <p className="text-xs text-on-surface-variant/70 mt-1">
                                            Hệ thống sẽ tạo mã QR kèm nội dung chuyển khoản tự động. Đơn hàng gia công sẽ được triển khai ngay sau khi nhận cọc.
                                        </p>
                                    </div>
                                </label>

                                {/* Lựa chọn 2: COD */}
                                <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod'
                                        ? 'border-primary bg-primary/[0.02]'
                                        : 'border-outline-variant/60 hover:bg-surface-container/10'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="mt-1 accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-on-surface">Thanh toán khi nhận hàng (COD)</div>
                                        <p className="text-xs text-on-surface-variant/70 mt-1">
                                            Thanh toán bằng tiền mặt cho đơn vị vận chuyển khi nhận hàng. (Chỉ áp dụng với linh kiện có sẵn, không áp dụng cho hàng cắt CNC theo yêu cầu).
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
                                <h2 className="text-base font-black uppercase tracking-wide text-on-surface">Đơn hàng của bạn</h2>
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
                                            <h4 className="text-sm font-bold text-on-surface truncate">{item.product_name}</h4>
                                            <p className="text-[11px] text-on-surface-variant/75 mt-0.5">Vật tư: {item.material_name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-on-surface-variant font-medium">SL: x{item.quantity}</span>
                                                <span className="text-xs font-bold text-on-surface">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tính toán tiền nong */}
                            <div className="border-t border-outline-variant/50 pt-4 mt-2 space-y-2.5 text-sm font-semibold">
                                <div className="flex justify-between text-on-surface-variant/80">
                                    <span>Tạm tính</span>
                                    <span>{tempTotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-on-surface-variant/80">
                                    <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> Vận chuyển</span>
                                    <span>{shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
                                </div>

                                <div className="border-t border-dashed border-outline-variant/60 pt-3 mt-1 flex justify-between text-base font-black text-on-surface">
                                    <span>TỔNG TIỀN</span>
                                    <span className="text-primary text-lg">{finalTotal.toLocaleString('vi-VN')}đ</span>
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
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Cam kết bảo mật thông tin đơn hàng tuyệt đối
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Checkout;