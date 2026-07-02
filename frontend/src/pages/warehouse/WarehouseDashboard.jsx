import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WarehouseSidebar from "../../components/warehouse/WarehouseSidebar";
import WarehouseTopbar from "../../components/warehouse/WarehouseTopbar";
import ManageMaterials from "../admin/ManageMaterials";
import ManageMaterialTypes from "../../components/admin/ManageMaterialTypes";
import ManageMaterialUnits from "../../components/admin/ManageMaterialUnits";
import ExportRequestsPanel from "../../components/warehouse/ExportRequestsPanel";
import WarehouseInventory from "./WarehouseInventory";
import WarehouseRequest from "./WarehouseRequest";
import WarehouseExportHistory from "./WarehouseExportHistory";
import WarehouseMaterialRequestReceive from "../../components/warehouse/WarehouseMaterialRequestReceive";
import { authService } from "../../services/auth.service";
import warehouseService from "../../services/warehouse.service";
import { AlertCircle, CheckCircle2, Loader2, Boxes, X } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { showSuccess, showInfo } from "../../utils/notify";
import ConfirmModal from "../../components/common/ConfirmModal";

const WarehouseDashboard = () => {
    const socket = useSocket();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);

    const queryParams = new URLSearchParams(location.search);
    const activePanel = queryParams.get("panel") || "overview";

    // =========================================================
    // 1. KHỞI TẠO CÁC STATE QUẢN LÝ LOGIC KẾT NỐI BACKEND KHO
    // =========================================================
    const [warehouseLoading, setWarehouseLoading] = useState(false);
    const [warehouseSuccess, setWarehouseSuccess] = useState("");
    const [warehouseError, setWarehouseError] = useState("");
    const [missingMaterials, setMissingMaterials] = useState([]);
    const [processingOrderId, setProcessingOrderId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, callback: null });

    useEffect(() => {
        authService.getMe().then(res => {
            setCurrentUser(res.data?.data?.user);
        }).catch(console.error);
    }, []);

    // Reset lại toàn bộ thông báo lỗi/thành công khi chuyển đổi tab qua lại
    useEffect(() => {
        handleClearAlert();
    }, [activePanel]);

    useEffect(() => {
        if (!socket) return;
        const handleImportApproved = (data) => {
            showSuccess("Admin đã duyệt mua vật tư, chuẩn bị nhập kho!");
            // Kích hoạt re-render để các component con fetch lại dữ liệu nếu cần
            window.dispatchEvent(new Event('warehouse-refresh'));
        };
        const handleNewWarehouseRequest = (data) => {
            showInfo("Có yêu cầu xuất/nhập kho mới được chuyển xuống!");
            window.dispatchEvent(new Event('warehouse-refresh'));
        };

        socket.on("import_request_approved", handleImportApproved);
        socket.on("new_warehouse_request", handleNewWarehouseRequest);
        socket.on("orderStatusUpdated", () => window.dispatchEvent(new Event('warehouse-refresh')));

        return () => {
            socket.off("import_request_approved", handleImportApproved);
            socket.off("new_warehouse_request", handleNewWarehouseRequest);
            socket.off("orderStatusUpdated");
        };
    }, [socket]);

    // Hàm xóa nhanh thông báo trạng thái kiểm kho
    const handleClearAlert = () => {
        setWarehouseSuccess("");
        setWarehouseError("");
        setMissingMaterials([]);
        setProcessingOrderId(null);
    };

    // =========================================================
    // 2. CÁC HÀM XỬ LÝ ĐIỀU HƯỚNG TRẠNG THÁI ĐƠN HÀNG PHÍA KHO
    // =========================================================

    // Nút 1: Tiếp nhận đơn (admin_approved -> warehouse_received)
    const handleReceiveOrder = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.receiveOrder(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Tiếp nhận đơn hàng thành công! Đã chuyển trạng thái sang Chờ kiểm kho.");
                if (callBackSuccess) callBackSuccess();
            }
        } catch (e) {
            setWarehouseError(e.response?.data?.message || "Lỗi khi tiếp nhận đơn hàng.");
        } finally {
            setWarehouseLoading(false);
        }
    };

    // Nút 2: Đủ hàng -> Bắt đầu sản xuất (warehouse_received -> production_ready)
    const handleConfirmSufficientStock = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.confirmSufficientStock(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Xác nhận đủ vật tư! Đơn hàng đã chuyển sang Sẵn sàng sản xuất.");
                if (callBackSuccess) callBackSuccess();
            }
        } catch (e) {
            const errResponse = e.response;
            if (errResponse?.status === 400 && errResponse.data?.missing_list) {
                setWarehouseError(errResponse.data.message || "Hệ thống đối soát thấy vật tư hiện tại không đủ!");
                setMissingMaterials(errResponse.data.missing_list);
            } else {
                setWarehouseError(errResponse.data?.message || "Lỗi khi xác nhận đủ hàng.");
            }
        } finally {
            setWarehouseLoading(false);
        }
    };

    // Nút 3: Thiếu hàng -> Yêu cầu nhập (warehouse_received -> out_of_stock)
    const handleReportOutOfStock = (orderId, callBackSuccess) => {
        setConfirmModal({ isOpen: true, orderId, callback: callBackSuccess });
    };

    const executeReportOutOfStock = async () => {
        const { orderId, callback } = confirmModal;
        setConfirmModal({ isOpen: false, orderId: null, callback: null });
        if (!orderId) return;

        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.reportOutOfStock(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Đã ghi nhận trạng thái thiếu hàng! Hệ thống đã tạo yêu cầu nhập kho chờ duyệt.");
                if (callback) callback();
            }
        } catch (e) {
            setWarehouseError(e.response?.data?.message || "Lỗi khi gửi báo cáo thiếu hàng.");
        } finally {
            setWarehouseLoading(false);
        }
    };

    // Nút 4: Đã nhập hàng & Cập nhật tồn kho (import_approved -> production_ready)
    const handleCompleteImportAndReady = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.completeImportAndReady(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Cập nhật tồn kho thành công! Đơn hàng đã tự động chuyển sang Sẵn sàng sản xuất.");
                if (callBackSuccess) callBackSuccess();
            }
        } catch (e) {
            setWarehouseError(e.response?.data?.message || "Lỗi khi cập nhật nhập kho và chuyển trạng thái sản xuất.");
        } finally {
            setWarehouseLoading(false);
        }
    };

    // Nút 4.5: Bắt đầu sản xuất (production_ready -> producing)
    const handleStartProduction = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.startProduction(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Đã chuyển đơn hàng vào quá trình sản xuất!");
                if (callBackSuccess) callBackSuccess();
            }
        } catch (e) {
            setWarehouseError(e.response?.data?.message || "Lỗi khi bắt đầu sản xuất.");
        } finally {
            setWarehouseLoading(false);
        }
    };

    // Nút 5: Gia công xong (Gửi báo cáo Admin) (producing -> production_completed)
    const handleCompleteProduction = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        handleClearAlert();
        setProcessingOrderId(orderId);
        try {
            const response = await warehouseService.completeProduction(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Xác nhận gia công xong! Đã gửi báo cáo nghiệm thu tới Admin.");
                if (callBackSuccess) callBackSuccess();
            }
        } catch (e) {
            setWarehouseError(e.response?.data?.message || "Lỗi khi hoàn tất gia công đơn hàng.");
        } finally {
            setWarehouseLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#f6f8f8] flex flex-col lg:flex-row">
            {/* Sidebar riêng biệt cho Thủ kho */}
            <WarehouseSidebar />

            <div className="flex-1 min-w-0 flex flex-col">
                {/* Topbar hiển thị trạng thái động */}
                <WarehouseTopbar
                    currentUser={currentUser}
                    title={
                        activePanel === 'overview' ? 'Tổng Quan Tồn Kho' :
                            activePanel === 'export_requests' ? 'Yêu Cầu Xuất Kho' :
                                activePanel === 'export_history' ? 'Lịch Sử Phiếu Xuất' :
                                    activePanel === 'request' ? 'Lập Phiếu Đề Xuất Nhập' :
                                    activePanel === 'material_requests' ? 'Quản Lý Đề Xuất Nhập' :
                                        activePanel === 'materials' ? "Quản lý mã vật tư" :
                                            activePanel === 'inventory' ? "Quản lý Tồn Kho Thực" : "Danh mục phân loại"
                    }
                    subTitle="Phân hệ Thủ Kho KPM"
                />

                {/* Nội dung thay đổi động dựa trên Sidebar */}
                <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">

                    {/* =========================================================
                        3. ĐẶT VÙNG HIỂN THỊ THÔNG BÁO CHUNG Ở ĐÂY (NẰM TRÊN CÁC PANEL)
                       ========================================================= */}
                    {processingOrderId && (
                        <div className="mb-6 bg-white border border-outline-variant/80 p-5 rounded-2xl shadow-sm relative">
                            {/* Nút đóng vùng thông báo kết quả */}
                            <button
                                onClick={handleClearAlert}
                                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                title="Đóng thông báo"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <p className="text-xs font-black uppercase text-teal-600 tracking-wider flex items-center gap-1.5 mb-3">
                                <Boxes className="w-4 h-4" /> Kết quả kiểm tra Đơn hàng #{processingOrderId}
                            </p>

                            {/* Trạng thái đang tải */}
                            {warehouseLoading && (
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 p-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> Phần mềm đang đối chiếu dữ liệu với kho dữ liệu tồn thực tế...
                                </div>
                            )}

                            {/* Thông báo Thành công (Đủ hàng) */}
                            {warehouseSuccess && (
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold">Cấp phát thành công</p>
                                        <p className="text-xs mt-0.5 opacity-90">{warehouseSuccess}</p>
                                    </div>
                                </div>
                            )}

                            {/* Thông báo Lỗi tổng quan */}
                            {warehouseError && (
                                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold">Xuất kho thất bại</p>
                                        <p className="text-xs mt-0.5 opacity-90">{warehouseError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Bảng đỏ hiển thị chi tiết danh sách vật tư bị thiếu hụt */}
                            {missingMaterials.length > 0 && (
                                <div className="mt-4 border border-rose-100 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-rose-50/70 px-4 py-2.5 border-b border-rose-100">
                                        <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-wider">
                                            Danh sách chi tiết các mã vật tư không đủ đáp ứng sản xuất
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-on-surface-variant uppercase tracking-wider font-black border-b border-outline-variant/60 text-[10px]">
                                                    <th className="p-3 pl-4">Mã vật tư</th>
                                                    <th className="p-3">Tên quy cách vật tư</th>
                                                    <th className="p-3 text-center">Yêu cầu của đơn</th>
                                                    <th className="p-3 text-center">Tồn kho hiện có</th>
                                                    <th className="p-3 text-center text-rose-700">Lượng thiếu hụt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/40 font-medium">
                                                {missingMaterials.map((mat, index) => (
                                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 pl-4 font-bold text-slate-700">{mat.material_code}</td>
                                                        <td className="p-3 text-slate-600">{mat.material_name}</td>
                                                        <td className="p-3 text-center font-semibold">{mat.required}</td>
                                                        <td className="p-3 text-center text-slate-500">{mat.current_stock}</td>
                                                        <td className="p-3 text-center bg-rose-50/40 text-rose-700 font-bold">
                                                            -{mat.missing}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 1. Trang tổng quan mặc định */}
                    {activePanel === "overview" && (
                        <div className="bg-white p-6 rounded-2xl border border-outline-variant/70">
                            <h2 className="text-sm font-black uppercase tracking-wider mb-4">Danh sách tồn kho thực tế</h2>
                            <ManageMaterials hideActions={true} />
                        </div>
                    )}

                    {/* =========================================================
                        4. KHỐI HIỂN THỊ DANH SÁCH LỆNH XUẤT VẬT TƯ CHỜ DUYỆT
                       ========================================================= */}
                    {activePanel === "export_requests" && (
                        <section>
                            <ExportRequestsPanel
                                onReceiveOrder={handleReceiveOrder}
                                onConfirmSufficientStock={handleConfirmSufficientStock}
                                onReportOutOfStock={handleReportOutOfStock}
                                onCompleteImportAndReady={handleCompleteImportAndReady}
                                onStartProduction={handleStartProduction}
                                onCompleteProduction={handleCompleteProduction}
                                isWarehouseActionLoading={warehouseLoading}
                            />
                        </section>
                    )}

                    {activePanel === "export_history" && (
                        <section>
                            <WarehouseExportHistory />
                        </section>
                    )}

                    {activePanel === "request" && (
                        <section>
                            <WarehouseRequest />
                        </section>
                    )}

                    {activePanel === "material_requests" && (
                        <section className="h-[calc(100vh-100px)]">
                            <WarehouseMaterialRequestReceive />
                        </section>
                    )}


                    {activePanel === "inventory" && (
                        <section>
                            <WarehouseInventory />
                        </section>
                    )}

                    {/* 3. Tái sử dụng các module cấu hình vật tư đã viết cho Admin tổng */}
                    {activePanel === "materials" && <ManageMaterials />}
                    {activePanel === "material_types" && <ManageMaterialTypes />}
                    {activePanel === "material_units" && <ManageMaterialUnits />}
                </main>
            </div>
            
            <ConfirmModal
                open={confirmModal.isOpen}
                title="Báo cáo thiếu hàng"
                message="Xác nhận báo thiếu hàng và gửi yêu cầu nhập vật tư bổ sung lên hệ thống?"
                onConfirm={executeReportOutOfStock}
                onCancel={() => setConfirmModal({ isOpen: false, orderId: null, callback: null })}
            />
        </div>
    );
};

export default WarehouseDashboard;