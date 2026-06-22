import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, Boxes, Calendar, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import orderService from '../../services/order.service';

const ExportRequestsPanel = ({
    onReceiveOrder,
    onConfirmSufficientStock,
    onReportOutOfStock,
    onCompleteImportAndReady,
    onCompleteProduction,
    isWarehouseActionLoading
}) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await orderService.getAllOrders();
            const allOrders = response?.data?.orders || response?.orders || response?.data || [];

            if (Array.isArray(allOrders)) {
                const validStatuses = ['WAITING_WAREHOUSE', 'admin_approved', 'warehouse_received', 'out_of_stock', 'import_approved', 'production_ready'];
                setOrders(allOrders.filter(o => validStatuses.includes(o.production_status)));
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách đơn hàng:", err);
            setError("Không thể tải danh sách đơn hàng từ máy chủ.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const renderActionButtons = (order) => {
        switch (order.production_status) {
            case 'WAITING_WAREHOUSE':
            case 'admin_approved':
                return (
                    <button
                        onClick={() => onReceiveOrder(order.id, fetchOrders)}
                        disabled={isWarehouseActionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        Tiếp nhận đơn
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                );
            case 'warehouse_received':
                return (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => onConfirmSufficientStock(order.id, fetchOrders)}
                            disabled={isWarehouseActionLoading}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                            Đủ hàng -&gt; Sản xuất
                        </button>
                        <button
                            onClick={() => onReportOutOfStock(order.id, fetchOrders)}
                            disabled={isWarehouseActionLoading}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                            Thiếu hàng -&gt; Yêu cầu nhập
                        </button>
                    </div>
                );
            case 'import_approved':
                return (
                    <button
                        onClick={() => onCompleteImportAndReady(order.id, fetchOrders)}
                        disabled={isWarehouseActionLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        Đã nhập hàng & Cập nhật tồn kho
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                );
            case 'production_ready':
                return (
                    <button
                        onClick={() => onCompleteProduction(order.id, fetchOrders)}
                        disabled={isWarehouseActionLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50"
                    >
                        Gia công xong (Báo cáo Admin)
                        <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                );
            case 'out_of_stock':
                return (
                    <span className="text-rose-600 font-bold text-xs uppercase flex items-center gap-1 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                        <AlertCircle className="w-4 h-4" /> Đang chờ duyệt nhập hàng
                    </span>
                );
            default:
                return null;
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'WAITING_WAREHOUSE': <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ tiếp nhận</span>,
            'admin_approved': <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ tiếp nhận</span>,
            'warehouse_received': <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Đang kiểm kho</span>,
            'out_of_stock': <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Thiếu vật tư</span>,
            'import_approved': <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ nhập bù kho</span>,
            'production_ready': <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Đang sản xuất</span>,
        };
        return badges[status] || <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">{status}</span>;
    };

    return (
        <div className="w-full bg-white border border-outline-variant/70 rounded-2xl p-6 shadow-sm space-y-8">
            {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    Đang tải dữ liệu đơn hàng...
                </div>
            )}

            {error && !loading && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4">
                    {error}
                </div>
            )}

            {!loading && (
                <div>
                    <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-6">
                        <div>
                            <h3 className="text-base font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-teal-600" />
                                Bảng Điều Khiển Sản Xuất
                            </h3>
                            <p className="text-xs text-on-surface-variant font-medium mt-1">
                                Danh sách đơn hàng đang trong quy trình xử lý tại kho.
                            </p>
                        </div>
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            {orders.length} Đơn hàng
                        </span>
                    </div>

                    {orders.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-outline-variant rounded-xl bg-slate-50/50">
                            <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-slate-700">Không có đơn hàng nào cần xử lý</h4>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {orders.map((order) => {
                                const totalMaterialTypes = order.material_requirements ? Object.keys(order.material_requirements).length : 0;
                                return (
                                    <div key={order.id} className="border border-outline-variant/80 hover:border-teal-300 hover:shadow-md rounded-xl p-5 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-black text-slate-800">Mã đơn hàng: <span className="text-teal-700">#{order.id}</span></span>
                                                {getStatusBadge(order.production_status)}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-medium">
                                                <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(order.createdAt || order.created_at)}</p>
                                                <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {order.user_id || order.userId || "Khách vãng lai"}</p>
                                                <p className="flex items-center gap-1.5 sm:col-span-2 mt-1 font-semibold text-slate-700">
                                                    <Boxes className="w-3.5 h-3.5 text-teal-600" />
                                                    <span className="text-teal-700 font-bold px-1.5 bg-teal-50 rounded border border-teal-100">
                                                        {totalMaterialTypes} mã vật tư yêu cầu
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/40">
                                            {renderActionButtons(order)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExportRequestsPanel;