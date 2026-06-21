import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, Boxes, Calendar, ArrowRight, User } from 'lucide-react';
import orderService from '../../services/order.service';

const ExportRequestsPanel = ({ onConfirmOrderExport, isWarehouseActionLoading }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await orderService.getAllOrders();
            // Đọc mảng đơn hàng dựa trên cấu trúc trả về thường thấy của API (.data hoặc .data.orders)
            const allOrders = response?.data?.orders || response?.orders || response?.data || [];

            // Lọc ra đúng các đơn hàng đang chờ duyệt kho (WAITING_WAREHOUSE)
            const waitingOrders = Array.isArray(allOrders)
                ? allOrders.filter(order => order.production_status === "WAITING_WAREHOUSE")
                : [];
                
            // Sửa lỗi: Cập nhật state bằng danh sách đã lọc
            setOrders(waitingOrders);
        } catch (err) {
            console.error("Lỗi lấy danh sách lệnh xuất kho:", err);
            setError("Không thể tải danh sách lệnh xuất kho từ máy chủ.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    // Định dạng ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Định dạng giá tiền (VND)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="w-full bg-white border border-outline-variant/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-6">
                <div>
                    <h3 className="text-base font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-teal-600" />
                        Danh Sách Lệnh Xuất Kho Chờ Duyệt
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                        Hiển thị các đơn hàng đã được chốt và đang chờ phân tách cấp phát vật tư sang khu vực sản xuất.
                    </p>
                </div>
                <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {orders.length} đơn chờ xử lý
                </span>
            </div>

            {/* TRẠNG THÁI ĐANG TẢI */}
            {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    Đang tải danh sách lệnh xuất kho từ hệ thống KPM...
                </div>
            )}

            {/* TRẠNG THÁI LỖI */}
            {error && !loading && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4">
                    {error}
                </div>
            )}

            {/* TRẠNG THÁI TRỐNG */}
            {!loading && orders.length === 0 && (
                <div className="py-12 text-center border border-dashed border-outline-variant rounded-xl bg-slate-50/50">
                    <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700 uppercase">Kho hiện tại đã sạch dữ liệu chờ!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Tất cả các đơn hàng cơ khí đã được xuất kho vật tư đầy đủ hoặc chưa có đơn hàng mới chuyển giao từ bộ phận kinh doanh.
                    </p>
                </div>
            )}

            {/* DANH SÁCH ĐƠN ĐANG CHỜ XUẤT KHO */}
            {!loading && orders.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => {
                        // Tính số loại vật tư yêu cầu từ JSON snapshot
                        const totalMaterialTypes = order.material_requirements
                            ? Object.keys(order.material_requirements).length
                            : 0;

                        return (
                            <div
                                key={order.id}
                                className="border border-outline-variant/80 hover:border-teal-300 hover:shadow-md rounded-xl p-5 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-black text-slate-800">
                                            Mã đơn hàng: <span className="text-teal-700">#{order.id}</span>
                                        </span>
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            Chờ cấp vật tư
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-medium">
                                        <p className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            Ngày tạo đơn: {formatDate(order.createdAt || order.created_at)}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            Mã khách hàng: {order.user_id || order.userId || "Khách vãng lai"}
                                        </p>
                                        <p className="flex items-center gap-1.5 sm:col-span-2 mt-1 font-semibold text-slate-700">
                                            <Boxes className="w-3.5 h-3.5 text-teal-600" />
                                            Yêu cầu kỹ thuật: <span className="text-teal-700 font-bold px-1.5 bg-teal-50 rounded border border-teal-100">{totalMaterialTypes} mã vật tư cơ khí</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/40">
                                    <div className="text-left md:text-right">
                                        <span className="text-[10px] uppercase font-black tracking-wider text-on-surface-variant/70 block">Tổng giá trị</span>
                                        <span className="text-sm font-black text-slate-800">{formatCurrency(order.total_price || order.totalPrice || 0)}</span>
                                    </div>

                                    {/* Khi bấm nút, gọi hàm xử lý từ Dashboard truyền xuống và truyền kèm fetchOrders để làm mới danh sách sau khi xong */}
                                    <button
                                        onClick={() => onConfirmOrderExport(order.id, fetchOrders)}
                                        disabled={isWarehouseActionLoading}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-teal-600/10"
                                    >
                                        Kiểm & Xuất Kho
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExportRequestsPanel;