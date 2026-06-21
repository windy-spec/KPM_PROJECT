import React, { useState } from "react";
import warehouseService from "../../services/warehouse.service";
import { Send, ClipboardList, Loader2, CheckCircle } from "lucide-react";

const WarehouseRequest = () => {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!note.trim()) return alert("Vui lòng nhập nội dung yêu cầu!");

        setLoading(true);
        setSuccess(false);
        try {
            // Gọi chính xác API POST /warehouse/request-import
            await warehouseService.requestImportMaterials({ note: note.trim() });
            setSuccess(true);
            setNote(""); // Clear form
        } catch (err) {
            alert("Đã xảy ra lỗi trong quá trình gửi phiếu đề xuất.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-outline-variant/70 shadow-sm mt-4">
            <div className="mb-5 border-b pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Lập Phiếu Đề Xuất Nhập Thêm Vật Tư
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Gửi thông tin đề xuất mua sắm bổ sung nguyên vật liệu kỹ thuật khi kho chạm ngưỡng báo động.</p>
            </div>

            {success && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Đã gửi phiếu đề xuất lên Ban Giám Đốc phê duyệt mua hàng!
                </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
                <div>
                    <label className="block font-black text-slate-700 mb-1 uppercase tracking-wide">Chi tiết nội dung yêu cầu kỹ thuật</label>
                    <textarea
                        rows={4}
                        required
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-primary bg-slate-50/30"
                        placeholder="VD: Vật tư Thép góc L50 hiện chỉ còn dưới 10 cây, đề xuất nhập gấp bổ sung 100 cây phục vụ dây chuyền sản xuất đơn hàng tuần tới..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-[0.99] disabled:bg-slate-300"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang đẩy dữ liệu lên hệ thống...
                        </>
                    ) : (
                        <>
                            <Send className="w-3.5 h-3.5" />
                            Gửi Đề Xuất Nhập Hàng
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default WarehouseRequest;