import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, Boxes, Calendar, User, CheckCircle2, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import orderService from '../../services/order.service';
import warehouseService from '../../services/warehouse.service';
import { materialService } from '../../services/material.service';

const ExportRequestsPanel = ({
    onReceiveOrder,
    onConfirmSufficientStock,
    onReportOutOfStock,
    onCompleteImportAndReady,
    onStartProduction,
    onCompleteProduction,
    isWarehouseActionLoading
}) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [inventoryMap, setInventoryMap] = useState({});
    const [materialNameMap, setMaterialNameMap] = useState({});
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const [ordersRes, invRes, matRes] = await Promise.all([
                orderService.getAllOrders(),
                warehouseService.getAllInventory(),
                materialService.getMaterials()
            ]);

            const allOrders = ordersRes?.data?.orders || ordersRes?.orders || ordersRes?.data || [];

            if (Array.isArray(allOrders)) {
                // Theo yêu cầu: hiển thị danh sách đơn hàng đang chờ kiểm kho và đang sản xuất
                const validStatuses = ['WAITING_WAREHOUSE', 'warehouse_received', 'out_of_stock', 'import_approved', 'production_ready', 'producing'];
                setOrders(allOrders.filter(o => validStatuses.includes(o.production_status)));
            }

            // Xây dựng map tên vật tư gốc để dự phòng nếu trong kho chưa có
            const matData = matRes?.data?.data || matRes?.data || matRes || [];
            const mNameMap = {};
            if (Array.isArray(matData)) {
                matData.forEach(m => {
                    mNameMap[m.id] = m.material_name;
                });
            }
            setMaterialNameMap(mNameMap);

            const invData = invRes?.data?.data || invRes?.data || invRes || [];
            const map = {};
            if (Array.isArray(invData)) {
                invData.forEach(item => {
                    const reqKey = item.thickness_id ? `${item.material_id}_${item.thickness_id}` : item.material_id;
                    let name = item.materials?.material_name || mNameMap[item.material_id] || 'Vật tư chưa xác định';
                    if (item.material_thickness?.thickness_value) name += ` (${item.material_thickness.thickness_value})`;
                    map[reqKey] = {
                        name: name,
                        stock: parseFloat(item.quantity || 0)
                    };
                });
            }
            setInventoryMap(map);

        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
            setError("Không thể tải dữ liệu từ máy chủ.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchOrders();
        
        const handleRefresh = () => {
            fetchOrders();
        };
        window.addEventListener('warehouse-refresh', handleRefresh);
        
        return () => {
            window.removeEventListener('warehouse-refresh', handleRefresh);
        };
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
        // Chúng ta sẽ render nút trong phần dropdown checklist, nên ở đây chỉ trả về nút toggle dropdown nếu cần
        const isExpanded = expandedOrderId === order.id;
        return (
            <button
                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all"
            >
                {isExpanded ? "Đóng chi tiết" : "Xem vật tư & Thao tác"}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            'WAITING_WAREHOUSE': <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ tiếp nhận</span>,
            'admin_approved': <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ tiếp nhận</span>,
            'warehouse_received': <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Đang kiểm kho</span>,
            'out_of_stock': <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Thiếu vật tư</span>,
            'import_approved': <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Chờ nhập bù kho</span>,
            'production_ready': <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Sẵn sàng sản xuất</span>,
            'producing': <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase animate-pulse">Đang sản xuất</span>,
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
                                Đơn Hàng Đang Chờ Kiểm Kho
                            </h3>
                            <p className="text-xs text-on-surface-variant font-medium mt-1">
                                Danh sách các đơn hàng cần xác nhận xuất vật tư để đưa vào sản xuất.
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
                                    <div key={order.id} className="border border-outline-variant/80 hover:border-teal-300 rounded-xl bg-white transition-all overflow-hidden">
                                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-black text-slate-800">Mã đơn hàng: <span className="text-teal-700">#{order.id}</span></span>
                                                    {getStatusBadge(order.production_status)}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-on-surface-variant font-medium">
                                                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(order.createdAt || order.created_at)}</p>
                                                    <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {order.users?.username || order.user_id || order.userId || "Khách vãng lai"}</p>
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

                                        {/* Bảng Dropdown Checklist Vật Tư */}
                                        {expandedOrderId === order.id && (
                                            <div className="border-t border-outline-variant/50 bg-slate-50/50 p-5">
                                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                                    Danh sách vật tư cần dùng
                                                </h4>
                                                <div className="overflow-x-auto border border-outline-variant/60 rounded-xl bg-white shadow-sm">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-black border-b border-outline-variant/60 text-[10px]">
                                                                <th className="p-3 pl-4">Tên vật tư</th>
                                                                <th className="p-3 text-center">Cần dùng</th>
                                                                <th className="p-3 text-center">Tồn kho hiện tại</th>
                                                                <th className="p-3 text-center">Trạng thái</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-outline-variant/40 font-medium">
                                                            {Object.entries(order.material_requirements || {}).map(([matId, qty]) => {
                                                                const requiredQty = parseFloat(qty);
                                                                let invData = inventoryMap[matId];
                                                                if (!invData) {
                                                                    const baseMatId = matId.split('_')[0];
                                                                    if (inventoryMap[baseMatId]) {
                                                                        invData = inventoryMap[baseMatId];
                                                                    } else {
                                                                        invData = { 
                                                                            name: materialNameMap[baseMatId] || 'Vật tư chưa xác định', 
                                                                            stock: 0 
                                                                        };
                                                                    }
                                                                }
                                                                const isEnough = invData.stock >= requiredQty;
                                                                return (
                                                                    <tr key={matId} className="hover:bg-slate-50/50 transition-colors">
                                                                        <td className="p-3 pl-4 font-bold text-slate-700">{invData.name}</td>
                                                                        <td className="p-3 text-center font-semibold text-slate-800">{requiredQty}</td>
                                                                        <td className="p-3 text-center text-slate-600">{invData.stock}</td>
                                                                        <td className="p-3 text-center">
                                                                            {isEnough ? (
                                                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold text-[10px] uppercase">Đủ hàng</span>
                                                                            ) : (
                                                                                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-bold text-[10px] uppercase">Thiếu hàng</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {totalMaterialTypes === 0 && (
                                                                <tr>
                                                                    <td colSpan="4" className="p-4 text-center text-slate-500 font-semibold italic">Không có vật tư nào được yêu cầu cho đơn hàng này.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Các nút hành động */}
                                                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
                                                    {(() => {
                                                        const reqs = Object.entries(order.material_requirements || {});
                                                        let hasEnoughStock = true;
                                                        if (reqs.length > 0) {
                                                            hasEnoughStock = reqs.every(([matId, qty]) => {
                                                                const reqQty = parseFloat(qty);
                                                                let stock = inventoryMap[matId]?.stock;
                                                                if (stock === undefined) {
                                                                    const baseMatId = matId.split('_')[0];
                                                                    stock = inventoryMap[baseMatId]?.stock || 0;
                                                                }
                                                                return stock >= reqQty;
                                                            });
                                                        }

                                                        if (['WAITING_WAREHOUSE', 'warehouse_received', 'out_of_stock', 'import_approved'].includes(order.production_status)) {
                                                            return (
                                                                <>
                                                                    {!['out_of_stock', 'import_approved'].includes(order.production_status) && (
                                                                        <button
                                                                            onClick={() => onReportOutOfStock(order.id, fetchOrders)}
                                                                            disabled={isWarehouseActionLoading}
                                                                            className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
                                                                        >
                                                                            <AlertCircle className="w-4 h-4" /> Thiếu hàng - Yêu cầu nhập
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => onConfirmSufficientStock(order.id, fetchOrders)}
                                                                        disabled={isWarehouseActionLoading || !hasEnoughStock || totalMaterialTypes === 0}
                                                                        className={`px-5 py-2 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all ${hasEnoughStock && totalMaterialTypes > 0 ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" /> Đủ hàng - Đưa vào sản xuất
                                                                    </button>
                                                                </>
                                                            );
                                                        }

                                                        if (order.production_status === 'production_ready') {
                                                            return (
                                                                <button
                                                                    onClick={() => onStartProduction(order.id, fetchOrders)}
                                                                    disabled={isWarehouseActionLoading}
                                                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" /> Bắt đầu sản xuất
                                                                </button>
                                                            );
                                                        }

                                                        if (order.production_status === 'producing') {
                                                            return (
                                                                <button
                                                                    onClick={() => onCompleteProduction(order.id, fetchOrders)}
                                                                    disabled={isWarehouseActionLoading}
                                                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" /> Hoàn tất sản xuất (Gửi báo cáo)
                                                                </button>
                                                            );
                                                        }

                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        )}
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