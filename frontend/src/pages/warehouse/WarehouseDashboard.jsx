import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WarehouseSidebar from "../../components/warehouse/WarehouseSidebar";
import WarehouseTopbar from "../../components/warehouse/WarehouseTopbar";
import ManageMaterials from "../admin/ManageMaterials"; // Dùng lại view vật tư có sẵn
import ManageMaterialTypes from "../../components/admin/ManageMaterialTypes";
import ManageMaterialUnits from "../../components/admin/ManageMaterialUnits";
import ExportRequestsPanel from "../../components/warehouse/ExportRequestsPanel"; // UI duyệt xuất lệnh sx riêng
import { authService } from "../../services/auth.service";
import warehouseService from "../../services/warehouse.service";
import { AlertCircle, CheckCircle2, Loader2, Boxes, X } from "lucide-react"; // Đã thêm icon X để tắt thông báo

const WarehouseDashboard = () => {
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

    useEffect(() => {
        authService.getMe().then(res => {
            setCurrentUser(res.data?.data?.user);
        }).catch(console.error);
    }, []);

    // Reset lại toàn bộ thông báo lỗi/thành công khi chuyển đổi tab qua lại
    useEffect(() => {
        handleClearAlert();
    }, [activePanel]);

    // Hàm xóa nhanh thông báo trạng thái kiểm kho
    const handleClearAlert = () => {
        setWarehouseSuccess("");
        setWarehouseError("");
        setMissingMaterials([]);
        setProcessingOrderId(null);
    };

    // =========================================================
    // 2. HÀM XỬ LÝ GỌI API XÁC NHẬN XUẤT KHO (CONNECT TO BE)
    // =========================================================
    const handleConfirmWarehouseExport = async (orderId, callBackSuccess) => {
        setWarehouseLoading(true);
        setWarehouseSuccess("");
        setWarehouseError("");
        setMissingMaterials([]);
        setProcessingOrderId(orderId);
        try {
            // Gọi đến API: POST /api/warehouse/confirm-order/:orderId
            const response = await warehouseService.confirmOrderMaterials(orderId);
            if (response.data?.success) {
                setWarehouseSuccess(response.data.message || "Xuất kho thành công! Đơn hàng đã được chuyển sang chế độ sản xuất.");

                // Nếu component danh sách đơn hàng có truyền hàm reload, kích hoạt để cập nhật lại UI
                if (callBackSuccess) {
                    callBackSuccess();
                }
            }
        } catch (e) {
            const errResponse = e.response;
            if (errResponse?.status === 400 && errResponse.data?.missing_list) {
                setWarehouseError(errResponse.data.message || "Kho hiện tại không đủ số lượng vật tư yêu cầu!");
                // Lưu mảng vật tư thiếu để vẽ bảng đỏ
                setMissingMaterials(errResponse.data.missing_list);
            }
            else {
                setWarehouseError(errResponse.data?.message || "Đã xảy ra sai sót khi kết nối đến hệ thống xử lý kho!");
            }
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
                                activePanel === 'materials' ? "Quản lý mã vật tư" : "Danh mục phân loại"
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
                                onConfirmOrderExport={handleConfirmWarehouseExport}
                                isWarehouseActionLoading={warehouseLoading}
                            />
                        </section>
                    )}

                    {/* 3. Tái sử dụng các module cấu hình vật tư đã viết cho Admin tổng */}
                    {activePanel === "materials" && <ManageMaterials />}
                    {activePanel === "material_types" && <ManageMaterialTypes />}
                    {activePanel === "material_units" && <ManageMaterialUnits />}
                </main>
            </div>
        </div>
    );
};

export default WarehouseDashboard;