import React, { useState, useEffect } from "react";
import materialRequestService from "../../services/material_request.service";
import { Loader2, CheckCircle2, Clock, AlertCircle, Boxes, RefreshCcw, Truck, PackagePlus } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";

const WarehouseMaterialRequestReceive = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState("");
    const [receiveModal, setReceiveModal] = useState({ isOpen: false, id: null, quantity: "" });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await materialRequestService.getAllRequests();
            setRequests(res.data?.data || []);
        } catch (err) {
            setError("Lỗi khi tải danh sách yêu cầu nhập vật tư.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReceiveModal = (reqId) => {
        const req = requests.find(r => r.id === reqId);
        setReceiveModal({
            isOpen: true,
            id: reqId,
            quantity: req?.requested_quantity ?? ""
        });
    };

    const executeReceive = async () => {
        const id = receiveModal.id;
        const actualQuantity = parseFloat(receiveModal.quantity);

        if (isNaN(actualQuantity) || actualQuantity <= 0) {
            toast.warning("Vui lòng nhập số lượng hợp lệ lớn hơn 0!");
            return;
        }

        setReceiveModal({ isOpen: false, id: null, quantity: "" });
        setActionLoadingId(id);
        try {
            const res = await materialRequestService.receiveImport(id, actualQuantity);
            toast.success(res.data?.message || "Nhập kho thành công!");
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi nhập kho.");
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-outline-variant/70 shadow-sm flex flex-col h-full min-h-[500px] relative">
            <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container/20">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-primary" /> Nhập Kho Yêu cầu Vật tư
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                        Kho nhập số lượng thực tế sau khi admin duyệt mua
                    </p>
                </div>
                <button
                    onClick={fetchRequests}
                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="p-5 flex-1 overflow-auto">
                {error && (
                    <div className="mb-4 flex items-center gap-2 text-error bg-error/10 p-3 rounded-lg text-sm font-semibold">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-bold uppercase tracking-wider">Đang tải dữ liệu...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant/70">
                        <Boxes className="w-12 h-12 opacity-20" />
                        <span className="text-sm font-bold">Chưa có yêu cầu nhập vật tư nào.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-surface-container/40 border-b border-outline-variant/40 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/80">
                                    <th className="p-4 rounded-tl-xl">Mã Vật Tư / Tên</th>
                                    <th className="p-4 text-center">SL Yêu cầu</th>
                                    <th className="p-4 text-center">Tồn trước</th>
                                    <th className="p-4 text-center">Thực nhập</th>
                                    <th className="p-4 text-center">Tồn sau</th>
                                    <th className="p-4">Lý do / Mã Đơn</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                    <th className="p-4">Ngày tạo</th>
                                    <th className="p-4 text-center rounded-tr-xl">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30 text-xs font-semibold text-on-surface-variant">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-surface-container/10 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-on-surface">{req.materials?.material_code}</div>
                                            <div className="text-[11px] opacity-80 mt-0.5">{req.materials?.material_name}</div>
                                        </td>
                                        <td className="p-4 text-center font-black text-rose-600 text-sm">
                                            {Number(req.requested_quantity).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium">
                                            {req.inventory_before != null ? Number(req.inventory_before).toLocaleString("vi-VN") : "-"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-primary">
                                                {req.actual_quantity != null ? Number(req.actual_quantity).toLocaleString("vi-VN") : "Chờ nhập kho"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-sm font-medium">
                                            {req.inventory_after != null ? Number(req.inventory_after).toLocaleString("vi-VN") : "-"}
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            {req.orders ? (
                                                <div className="inline-block px-2 py-0.5 bg-primary/10 text-primary font-bold rounded text-[10px] mb-1">
                                                    ĐH: {req.orders.order_code || req.orders.id.substring(0, 8)}
                                                </div>
                                            ) : null}
                                            <div className="line-clamp-2 text-[11px] leading-relaxed" title={req.note}>
                                                {req.note || "Không có ghi chú"}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.status === "APPROVED" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                    <Truck className="w-3 h-3" /> Đang Giao Hàng
                                                </span>
                                            )}
                                            {req.status === "IMPORTED" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3" /> Đã Nhập Kho
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-[11px] opacity-75">
                                            {new Date(req.created_at).toLocaleString("vi-VN")}
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.status === "APPROVED" && (
                                                <button
                                                    onClick={() => handleOpenReceiveModal(req.id)}
                                                    disabled={actionLoadingId === req.id}
                                                    className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto shadow-sm"
                                                >
                                                    {actionLoadingId === req.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <PackagePlus className="w-3.5 h-3.5" />
                                                    )}
                                                    Nhập Kho
                                                </button>
                                            )}
                                            {req.status === "IMPORTED" && (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Hoàn tất</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmModal
                open={receiveModal.isOpen}
                title="Nhập số lượng thực tế"
                message="Nhập số lượng vật tư đã nhận về kho để hoàn tất việc nhập kho."
                confirmText="Xác nhận nhập kho"
                cancelText="Hủy"
                onConfirm={executeReceive}
                onCancel={() => setReceiveModal({ isOpen: false, id: null, quantity: "" })}
            >
                <div className="mt-4">
                    <label className="block text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant mb-2">
                        Số lượng thực nhập
                    </label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={receiveModal.quantity}
                        onChange={(e) => setReceiveModal(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary"
                        placeholder="Nhập số lượng"
                    />
                </div>
            </ConfirmModal>
        </div>
    );
};

export default WarehouseMaterialRequestReceive;
