import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, Boxes, Calendar, ArrowRight, User, PackageCheck, CheckCircle2 } from 'lucide-react';
import orderService from '../../services/order.service';

const ExportRequestsPanel = ({ onConfirmOrderExport, onCompleteOrderExport, isWarehouseActionLoading }) => {
    const [waitingOrders, setWaitingOrders] = useState([]);
    const [exportingOrders, setExportingOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await orderService.getAllOrders();
            const allOrders = response?.data?.orders || response?.orders || response?.data || [];

            if (Array.isArray(allOrders)) {
                setWaitingOrders(allOrders.filter(o => o.production_status === "WAITING_WAREHOUSE"));
                setExportingOrders(allOrders.filter(o => o.production_status === "EXPORTING_WAREHOUSE"));
            }
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

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="w-full bg-white border border-outline-variant/70 rounded-2xl p-6 shadow-sm space-y-8">
            {/* TRẠNG THÁI ĐANG TẢI */}
            {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    Đang tải dữ liệu đơn hàng...
                </div>
            )}

            {/* TRẠNG THÁI LỖI */}
            {error && !loading && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4">
                    {error}
                </div>
            )}

            {!loading && (
                <>
                    {/* SECTION: ĐƠN CHỜ KIỂM & XUẤT */}
                    <div>
                        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-6">
                            <div>
                                <h3 className="text-base font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-amber-600" />
                                    1. Chờ Kiểm & Xuất Kho
                                </h3>
                                <p className="text-xs text-on-surface-variant font-medium mt-1">
                                    Đơn hàng chờ nhận yêu cầu và bắt đầu quá trình lấy vật tư.
                                </p>
                            </div>
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                {waitingOrders.length} chờ xử lý
                            </span>
                        </div>

                        {waitingOrders.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-outline-variant rounded-xl bg-slate-50/50">
                                <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-sm font-bold text-slate-700">Không có đơn chờ duyệt</h4>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {waitingOrders.map((order) => {
                                    const totalMaterialTypes = order.material_requirements ? Object.keys(order.material_requirements).length : 0;
                                    return (
                                        <div key={order.id} className="border border-outline-variant/80 hover:border-amber-300 hover:shadow-md rounded-xl p-5 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-slate-800">Mã đơn hàng: <span className="text-teal-700">#{order.id}</span></span>
                                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Chờ nhận đơn</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-medium">
                                                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(order.createdAt || order.created_at)}</p>
                                                    <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {order.user_id || order.userId || "Khách vãng lai"}</p>
                                                    <p className="flex items-center gap-1.5 sm:col-span-2 mt-1 font-semibold text-slate-700"><Boxes className="w-3.5 h-3.5 text-amber-600" /> <span className="text-amber-700 font-bold px-1.5 bg-amber-50 rounded border border-amber-100">{totalMaterialTypes} mã vật tư cơ khí</span></p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/40">
                                                <button
                                                    onClick={() => onConfirmOrderExport(order.id, fetchOrders)}
                                                    disabled={isWarehouseActionLoading}
                                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-600/20"
                                                >
                                                    Nhận yêu cầu
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* SECTION: ĐƠN ĐANG KIỂM & XUẤT (EXPORTING_WAREHOUSE) */}
                    <div>
                        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-6 mt-8">
                            <div>
                                <h3 className="text-base font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                                    <PackageCheck className="w-5 h-5 text-teal-600" />
                                    2. Đang Kiểm & Xuất Kho
                                </h3>
                                <p className="text-xs text-on-surface-variant font-medium mt-1">
                                    Đơn hàng thủ kho đang soạn vật tư và chuẩn bị hoàn tất.
                                </p>
                            </div>
                            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                {exportingOrders.length} đang thực hiện
                            </span>
                        </div>

                        {exportingOrders.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-outline-variant rounded-xl bg-slate-50/50">
                                <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-sm font-bold text-slate-700">Không có đơn đang kiểm xuất</h4>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {exportingOrders.map((order) => {
                                    const totalMaterialTypes = order.material_requirements ? Object.keys(order.material_requirements).length : 0;
                                    return (
                                        <div key={order.id} className="border border-teal-200 hover:border-teal-400 hover:shadow-md rounded-xl p-5 bg-teal-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-slate-800">Mã đơn hàng: <span className="text-teal-700">#{order.id}</span></span>
                                                    <span className="bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Đang gom hàng</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-medium">
                                                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(order.createdAt || order.created_at)}</p>
                                                    <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {order.user_id || order.userId || "Khách vãng lai"}</p>
                                                    <p className="flex items-center gap-1.5 sm:col-span-2 mt-1 font-semibold text-slate-700"><Boxes className="w-3.5 h-3.5 text-teal-600" /> <span className="text-teal-700 font-bold px-1.5 bg-teal-100 rounded border border-teal-200">{totalMaterialTypes} mã vật tư cơ khí</span></p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/40">
                                                <button
                                                    onClick={() => onCompleteOrderExport(order.id, fetchOrders)}
                                                    disabled={isWarehouseActionLoading}
                                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-teal-600/20"
                                                >
                                                    Hoàn thành xuất
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportRequestsPanel;