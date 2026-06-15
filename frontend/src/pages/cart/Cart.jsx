import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import cartService from '../../services/cart.service';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCart = async () => {
        try {
            setLoading(true);
            const res = await cartService.getCart();
            // Transform data or just set it
            // Backend returns cart = { id, user_id, cart_items: [...] }
            if (res.success && res.data && res.data.cart_items) {
                const formattedItems = res.data.cart_items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quotation_id: item.quotation_id,
                    product_name: item.products ? item.products.product_name : item.quotations?.title || "Báo giá tùy chỉnh",
                    product_code: item.products ? item.products.product_code : "CUSTOM",
                    image: item.products?.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200",
                    material_name: item.products?.materials?.material_name || "Vật liệu tùy chỉnh",
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0,
                }));
                setCartItems(formattedItems);
            } else {
                setCartItems([]);
            }
        } catch (e) {
            console.error("Failed to load cart", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    // 2. Hàm xử lý thay đổi số lượng (Tăng / Giảm)
    const handleUpdateQuantity = async (id, delta) => {
        const item = cartItems.find(i => i.id === id);
        if (!item) return;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return;

        // Optimistic UI update
        setCartItems(prevItems =>
            prevItems.map(i => i.id === id ? { ...i, quantity: newQty } : i)
        );

        try {
            await cartService.updateQuantity(id, newQty);
        } catch (e) {
            console.error(e);
            loadCart(); // Rollback on error
        }
    };

    // 3. Hàm xử lý xóa sản phẩm khỏi giỏ hàng
    const handleRemoveItem = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== id));
            try {
                await cartService.removeItem(id);
            } catch (e) {
                console.error(e);
                loadCart();
            }
        }
    };

    // 4. Tính toán tiền nong
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = totalAmount > 5000000 || totalAmount === 0 ? 0 : 150000;
    const finalAmount = totalAmount + shippingFee;

    // 5. Hàm điều hướng sang trang Thanh toán kèm dữ liệu thật
    const handleProceedToCheckout = async () => {
        if (cartItems.length === 0) return;

        try {
            const res = await cartService.submitCart();
            // res returns { message, order_id } if normal items exist
            if (res.data && res.data.order_id) {
                navigate('/checkout', {
                    state: { checkoutItems: cartItems, order_id: res.data.order_id }
                });
            } else {
                alert(res.message || "Gửi yêu cầu thành công!");
                navigate('/profile'); // Chuyển về profile xem báo giá
            }
        } catch (e) {
            alert(e.response?.data?.message || "Lỗi khi xử lý giỏ hàng");
        }
    };

    if (loading) return <div className="text-center py-20">Đang tải giỏ hàng...</div>;

    // Trường hợp Giỏ hàng trống
    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] bg-surface-container/10 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant/40 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-black text-on-surface uppercase tracking-wide">Giỏ hàng của bạn đang trống</h2>
                <p className="text-sm text-on-surface-variant/70 mt-1 mb-6">Hãy lựa chọn các linh kiện cơ khí và vật tư cần thiết nhé.</p>
                <Link to="/products" className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    Quay lại danh sách sản phẩm
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-container/20 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1280px] mx-auto">

                <h1 className="text-2xl font-black uppercase tracking-wider text-on-surface mb-8">
                    Giỏ hàng của bạn ({cartItems.length})
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM (8 Columns) */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="bg-white border border-outline-variant/60 rounded-2xl overflow-hidden shadow-sm">

                            {/* Tiêu đề bảng ẩn trên Mobile */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 bg-surface-container/30 px-6 py-3 border-b border-outline-variant/50 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                                <div className="col-span-6">Sản phẩm vật tư</div>
                                <div className="col-span-2 text-center">Đơn giá</div>
                                <div className="col-span-2 text-center">Số lượng</div>
                                <div className="col-span-2 text-right">Thành tiền</div>
                            </div>

                            {/* Danh sách các dòng sản phẩm */}
                            <div className="divide-y divide-outline-variant/30">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-6 items-center">

                                        {/* Cột thông tin ảnh + tên */}
                                        <div className="col-span-1 sm:col-span-6 flex gap-4 items-center">
                                            <img
                                                src={item.image}
                                                alt={item.product_name}
                                                className="w-20 h-20 object-cover rounded-xl border border-outline-variant/40 bg-surface-container/30 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-on-surface hover:text-primary transition-colors truncate">
                                                    {item.product_name}
                                                </h3>
                                                <p className="text-xs text-on-surface-variant/80 mt-1">Mã: <span className="font-semibold">{item.product_code}</span></p>
                                                <p className="text-[11px] text-on-surface-variant/60 mt-0.5">Vật liệu: {item.material_name}</p>

                                                {/* Nút xóa trên màn hình nhỏ */}
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="sm:hidden mt-2 inline-flex items-center gap-1 text-xs font-bold text-error/80 hover:text-error transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Xóa món này
                                                </button>
                                            </div>
                                        </div>

                                        {/* Đơn giá */}
                                        <div className="col-span-1 sm:col-span-2 text-left sm:text-center">
                                            <span className="sm:hidden text-xs text-on-surface-variant/60 font-semibold mr-2">Đơn giá:</span>
                                            <span className="text-sm font-bold text-on-surface">{item.price.toLocaleString('vi-VN')}đ</span>
                                        </div>

                                        {/* Bộ tăng giảm số lượng */}
                                        <div className="col-span-1 sm:col-span-2 flex justify-start sm:justify-center">
                                            <div className="inline-flex items-center border border-outline-variant rounded-xl p-1 bg-surface-container/10">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 active:scale-95 transition-all"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-10 text-center text-xs font-black text-on-surface">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Thành tiền + Nút xóa trên desktop */}
                                        <div className="col-span-1 sm:col-span-2 text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                            <div>
                                                <span className="sm:hidden text-xs text-on-surface-variant/60 font-semibold mr-2">Thành tiền:</span>
                                                <span className="text-sm font-black text-primary">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="hidden sm:block p-1.5 text-on-surface-variant/50 hover:text-error hover:bg-red-50 rounded-lg transition-all"
                                                title="Xóa khỏi giỏ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nút quay lại mua thêm */}
                        <Link to="/products" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors pt-2">
                            <ArrowLeft className="w-4 h-4" /> Tiếp tục lựa chọn sản phẩm
                        </Link>
                    </div>

                    {/* CỘT PHẢI: TỔNG KẾT HÓA ĐƠN (4 Columns) */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm sticky top-28">
                            <h2 className="text-base font-black uppercase tracking-wide text-on-surface border-b border-outline-variant/40 pb-4 mb-5">
                                Thông tin đơn hàng
                            </h2>

                            <div className="space-y-3 text-sm font-semibold">
                                <div className="flex justify-between text-on-surface-variant/80">
                                    <span>Tạm tính ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} sản phẩm)</span>
                                    <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-on-surface-variant/80">
                                    <span>Phí vận chuyển dự kiến</span>
                                    <span>{shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
                                </div>

                                {totalAmount < 5000000 && (
                                    <p className="text-[11px] text-primary bg-primary/5 rounded-lg p-2.5 font-medium leading-relaxed">
                                        💡 Mua thêm <b>{(5000000 - totalAmount).toLocaleString('vi-VN')}đ</b> để nhận ưu đãi Miễn phí vận chuyển vật tư cơ khí nội thành!
                                    </p>
                                )}

                                <div className="border-t border-dashed border-outline-variant/60 pt-4 mt-2 flex justify-between text-base font-black text-on-surface">
                                    <span>TỔNG TIỀN</span>
                                    <span className="text-primary text-xl">{finalAmount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>

                            {/* Nút thanh toán */}
                            <button
                                onClick={handleProceedToCheckout}
                                className="w-full mt-6 bg-primary text-white py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Tiến hành thanh toán <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;