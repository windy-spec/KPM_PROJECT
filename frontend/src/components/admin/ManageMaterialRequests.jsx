import React, { useState, useEffect } from "react";
import materialRequestService from "../../services/material_request.service";
import { authService } from "../../services/auth.service";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Boxes, Check, RefreshCcw, Truck, PackagePlus, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";

const ManageMaterialRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    // Modal state for receiving items
    const [receiveModal, setReceiveModal] = useState({
        isOpen: false,
        requestId: null,
        materialCode: "",
        materialName: "",
        requestedQty: 0,
        actualQty: ""
    });

    useEffect(() => {
        authService.getMe()
            .then(res => setCurrentUser(res.data?.data?.user))
            .catch(console.error);
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

    const handleApprove = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const executeApprove = async () => {
        const id = confirmModal.id;
        setConfirmModal({ isOpen: false, id: null });
        if (!id) return;

        setActionLoadingId(id);
        try {
            await materialRequestService.approveRequest(id);
            fetchRequests(); // Reload data
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi duyệt yêu cầu.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const openReceiveModal = (req) => {
        setReceiveModal({
            isOpen: true,
            requestId: req.id,
            materialCode: req.materials?.material_code || "N/A",
            materialName: req.materials?.material_name || "Vật tư không xác định",
            requestedQty: req.requested_quantity,
            actualQty: req.requested_quantity // Default to requested
        });
    };

    const closeReceiveModal = () => {
        setReceiveModal({ isOpen: false, requestId: null, materialCode: "", materialName: "", requestedQty: 0, actualQty: "" });
    };

    const submitReceive = async (e) => {
        e.preventDefault();

        const actualQuantity = parseFloat(receiveModal.actualQty);
        if (isNaN(actualQuantity) || actualQuantity <= 0) {
            toast.warning("Vui lòng nhập số lượng hợp lệ lớn hơn 0!");
            return;
        }

        setActionLoadingId(receiveModal.requestId);
        const reqId = receiveModal.requestId;
        closeReceiveModal();

        try {
            const res = await materialRequestService.receiveImport(reqId, actualQuantity);
            toast.success(res.data?.message || "Nhập kho thành công!");
            fetchRequests(); // Reload data
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi nhập kho.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const isAdmin = currentUser?.role === "ADMIN";

    return (
        <div className="bg-white rounded-2xl border border-outline-variant/70 shadow-sm flex flex-col h-full min-h-[500px] relative">
            <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container/20">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-primary" /> Quản lý Yêu cầu Nhập Vật tư
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                        Theo dõi tiến độ duyệt mua và nhập hàng về kho
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
                                            {req.status === "PENDING" && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Clock className="w-3 h-3" /> Chờ Duyệt Mua
                                                </span>
                                            )}
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
                                            {isAdmin && req.status === "PENDING" && (
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={actionLoadingId === req.id}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto shadow-sm"
                                                >
                                                    {actionLoadingId === req.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5" />
                                                    )}
                                                    Xác nhận Mua
                                                </button>
                                            )}
                                            {!isAdmin && req.status === "APPROVED" && (
                                                <button
                                                    onClick={() => openReceiveModal(req)}
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

            {/* RECEIVE MODAL */}
            {receiveModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <PackagePlus className="w-5 h-5 text-primary" />
                                Xác nhận Nhập Kho
                            </h3>
                            <button
                                onClick={closeReceiveModal}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitReceive} className="p-5 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Thông tin vật tư</div>
                                <div className="font-black text-slate-800 text-sm">{receiveModal.materialCode}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{receiveModal.materialName}</div>

                                <div className="mt-3 flex items-center justify-between text-xs font-bold border-t border-slate-200 pt-3">
                                    <span className="text-slate-500">Số lượng ban đầu yêu cầu:</span>
                                    <span className="text-primary text-sm">{receiveModal.requestedQty}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                    Số lượng thực tế nhập kho
                                </label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    required
                                    autoFocus
                                    value={receiveModal.actualQty}
                                    onChange={(e) => setReceiveModal({ ...receiveModal, actualQty: e.target.value })}
                                    className="w-full p-3.5 border border-slate-300 rounded-xl font-black text-slate-800 focus:outline-primary focus:ring-2 focus:ring-primary/20 text-center text-lg"
                                    placeholder="Ví dụ: 100"
                                />
                                <p className="text-[10px] text-slate-500 font-medium mt-2 text-center">
                                    Vui lòng đếm số lượng hàng vật lý thực tế trước khi nhập.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeReceiveModal}
                                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md shadow-primary/20"
                                >
                                    Xác nhận Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <ConfirmModal
                open={confirmModal.isOpen}
                title="Xác nhận mua hàng"
                message="Xác nhận đã mua hàng cho yêu cầu này? Trạng thái sẽ chuyển thành 'Đang giao'."
                onConfirm={executeApprove}
                onCancel={() => setConfirmModal({ isOpen: false, id: null })}
            />
        </div>
    );
};

export default ManageMaterialRequests;
