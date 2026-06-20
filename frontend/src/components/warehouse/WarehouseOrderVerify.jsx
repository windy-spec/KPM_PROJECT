import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Boxes, Loader2, ArrowRight } from "lucide-react";
import warehouseService from "../../services/warehouse.service";

const WarehouseOrderVerify = ({ orderId = "12345", onStatusSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [missingMaterials, setMissingMaterials] = useState([]);

    const handleConfirmExport = async () => {
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");
        setMissingMaterials([]); // Reset danh sách thiếu cũ

        try {
            const response = await warehouseService.confirmOrderMaterials(orderId);

            if (response.data?.success) {
                setSuccessMsg(response.data.message || "Xuất kho vật tư thành công! Đơn hàng đã chuyển sang chế độ sản xuất.");
                if (onStatusSuccess) onStatusSuccess(); // Callback để load lại danh sách đơn hàng
            }
        } catch (error) {
            const errResponse = error.response;

            // Kiểm tra cấu hình trả về lỗi thiếu vật tư (mã 400) từ warehouse.controller.js
            if (errResponse?.status === 400 && errResponse.data?.missing_list) {
                setErrorMsg(errResponse.data.message || "Kho không đủ vật tư sản xuất!");
                setMissingMaterials(errResponse.data.missing_list); // Nhét mảng thiếu vào state để vẽ bảng
            } else {
                // Các lỗi hệ thống khác
                setErrorMsg(errResponse.data?.message || "Đã xảy ra lỗi khi kết nối đến hệ thống kho!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4 mb-6">
                <div>
                    <h2 className="text-lg font-black text-on-surface uppercase tracking-tight flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-teal-600" /> Xác thực cấp phát vật tư
                    </h2>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Mã đơn hàng xử lý: <span className="font-bold text-teal-700">#{orderId}</span></p>
                </div>

                {/* Nút bấm Kích hoạt Gọi API */}
                <button
                    onClick={handleConfirmExport}
                    disabled={loading}
                    className="px-5 py-2.5 bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-teal-600/10"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm kho...
                        </>
                    ) : (
                        <>
                            Xác nhận xuất kho <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* 1. HIỂN THỊ KHI THÀNH CÔNG (ĐỦ HÀNG) */}
            {successMsg && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold">Thao tác hoàn tất</p>
                        <p className="text-xs mt-0.5 opacity-90">{successMsg}</p>
                    </div>
                </div>
            )}

            {/* 2. HIỂN THỊ KHI THẤT BẠI TỔNG QUAN */}
            {errorMsg && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl mb-4">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold">Kiểm kho thất bại</p>
                        <p className="text-xs mt-0.5 opacity-90">{errorMsg}</p>
                    </div>
                </div>
            )}

            {/* 3. VẼ BẢNG DANH SÁCH VẬT TƯ THIẾU (NẾU CÓ) */}
            {missingMaterials.length > 0 && (
                <div className="mt-6 border border-rose-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-rose-50/70 px-4 py-3 border-b border-rose-100">
                        <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider">
                            Báo cáo chi tiết vật tư thiếu hụt trong kho
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-on-surface-variant uppercase tracking-wider font-black border-b border-outline-variant/60 text-[10px]">
                                    <th className="p-3.5 pl-4">Mã vật tư</th>
                                    <th className="p-3.5">Tên vật tư</th>
                                    <th className="p-3.5 text-center">Yêu cầu đơn</th>
                                    <th className="p-3.5 text-center">Tồn kho hiện tại</th>
                                    <th className="p-3.5 text-center text-rose-700">Thiếu hụt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/40 font-medium">
                                {missingMaterials.map((mat, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3.5 pl-4 font-bold text-slate-700">{mat.material_code}</td>
                                        <td className="p-3.5 text-slate-600">{mat.material_name}</td>
                                        <td className="p-3.5 text-center font-semibold">{mat.required}</td>
                                        <td className="p-3.5 text-center text-slate-500">{mat.current_stock}</td>
                                        <td className="p-3.5 text-center bg-rose-50/30 text-rose-700 font-bold">
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
    );
};

export default WarehouseOrderVerify;