import React, { useState, useEffect } from "react";
import warehouseService from "../../services/warehouse.service";
import { materialService } from "../../services/material.service";
import { Boxes, Plus, Edit3, History, FileText, Loader2, Trash2, X,Filter,FileDown } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Portal from "../../components/common/Portal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";

const WarehouseInventory = () => {
    const [inventoryList, setInventoryList] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("CREATE");
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, code: null });

    const [page, setPage] = useState(1);
    const [pageSize] = useState(6);

    const [formData, setFormData] = useState({ material_id: "", quantity: 0, leftover_amount: 0, note: "" });

    const [selectedIds, setSelectedIds] = useState([]); // Lưu mảng các material_id được chọn
    const [filterStock, setFilterStock] = useState("ALL"); // ALL (Tất cả), LOW (Tồn ít < 20), HIGH (Tồn nhiều >= 20)
    const [exportLoading, setExportLoading] = useState(false);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await warehouseService.getAllInventory();
            setInventoryList(res?.data?.data || res?.data || res || []);
        } catch (err) {
            console.error("Lỗi lấy tồn kho:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterialsCatalog = async () => {
        try {
            const res = await materialService.getMaterials();
            setMaterials(res?.data?.data || res?.data || res || []);
        } catch (err) {
            console.error("Lỗi tải danh mục vật tư:", err);
        }
    };

    useEffect(() => {
        fetchInventory();
        fetchMaterialsCatalog();
    }, []);

    // --- 1. LỌC SẢN PHẨM NHIỀU / ÍT THEO ĐỊNH MỨC ---
    const filteredInventory = React.useMemo(() => {
        return inventoryList.filter((item) => {
            const qty = parseFloat(item.quantity) || 0;
            if (filterStock === "LOW") return qty < 20; // Ngưỡng dưới 20 tính là ít hàng
            if (filterStock === "HIGH") return qty >= 20; // Ngưỡng từ 20 trở lên tính là nhiều hàng
            return true;
        });
    }, [inventoryList, filterStock]);

    // Reset lại trang về 1 nếu bộ lọc thay đổi để tránh lỗi rỗng trang
    useEffect(() => {
        setPage(1);
    }, [filterStock]);

    // Đổi nguồn mảng tính toán phân trang từ 'inventoryList' gốc sang 'filteredInventory' đã lọc
    const totalPages = Math.ceil(filteredInventory.length / pageSize);
    const paginatedInventory = React.useMemo(() => {
        const offset = (page - 1) * pageSize;
        return filteredInventory.slice(offset, offset + pageSize);
    }, [filteredInventory, page, pageSize]);

    // Tự động lùi trang nếu trang hiện tại bỗng nhiên không có dữ liệu
    useEffect(() => {
        if (page > 1 && paginatedInventory.length === 0) {
            setPage(Math.max(1, totalPages));
        }
    }, [filteredInventory, paginatedInventory, page, totalPages]);

    // --- 2. XỬ LÝ CHỌN CHECKBOX (TỪNG DÒNG & CHỌN TẤT CẢ) ---
    const handleSelectRow = (id) => {
        if (!materialId) return;
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
        );
    };

    const handleSelectAllPage = () => {
        const currentPageMaterialIds = paginatedInventory
            .map((item) => item.id)
            .filter(Boolean);

        const isAllSelected = currentPageMaterialIds.every((id) => selectedIds.includes(id));

        if (isAllSelected) {
            // Nếu đã chọn hết ở trang hiện tại -> Bỏ chọn các sản phẩm thuộc trang này
            setSelectedIds((prev) => prev.filter((id) => !currentPageMaterialIds.includes(id)));
        } else {
            // Thêm các mã chưa chọn của trang này vào danh sách gom
            setSelectedIds((prev) => {
                const uniqueIds = new Set([...prev, ...currentPageMaterialIds]);
                return Array.from(uniqueIds);
            });
        }
    };

    // --- 3. GỌI SERVICE DOWNLOAD FILE PDF NHỊ PHÂN ---
    const handleExportPDF = async (reportType = "INVENTORY") => {
        setExportLoading(true);
        try {
            // Gửi danh sách các inventory/material_id đã chọn để backend lọc đúng
            const payload = { selectedIds, reportType };
            const res = await warehouseService.exportInventoryPDF(payload);

            // Xử lý chuyển đổi luồng stream Blob nhị phân thành file tải xuống
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            
            const suffix = selectedIds.length > 0 ? "Tu_Chon" : "Toan_Bo";
            const prefix = reportType === "LEFTOVER" ? "Bao_Cao_Ton_Vun" : "Bao_Cao_Ton_Kho";
            link.setAttribute("download", `${prefix}_${suffix}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            
            // Dọn dẹp bộ nhớ RAM sau khi download xong
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success("Xuất báo cáo PDF thành công!");
        } catch (err) {
            console.error("Lỗi xuất PDF tồn kho:", err);
            toast.error("Có lỗi xảy ra khi sinh và tải file báo cáo PDF.");
        } finally {
            setExportLoading(false);
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        try {
            if (modalType === "CREATE") {
                await warehouseService.createInventory({
                    material_id: formData.material_id,
                    quantity: parseFloat(formData.quantity),
                    leftover_amount: parseFloat(formData.leftover_amount)
                });
                toast.success("Khởi tạo mã tồn kho thành công!");
            } else {
                if (!formData.note.trim()) return toast.warning("Bắt buộc phải nhập lý do kiểm kê/điều chỉnh thủ công!");
                await warehouseService.updateInventoryManual(formData.id, {
                    quantity: parseFloat(formData.quantity),
                    leftover_amount: parseFloat(formData.leftover_amount),
                    note: formData.note
                });
                toast.success("Cập nhật số liệu tồn kho thành công!");
            }
            setShowModal(false);
            fetchInventory();

            if (selectedItem && selectedItem.id === formData.id) {
                viewDetailHistory(formData.id);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Thao tác thất bại.");
        }
    };

    const openEditModal = (item) => {
        setModalType("EDIT");
        setFormData({ id: item.id, material_id: item.material_id, quantity: item.quantity, leftover_amount: item.leftover_amount || 0, note: "" });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setModalType("CREATE");
        setFormData({ material_id: "", quantity: 0, leftover_amount: 0, note: "" });
        setShowModal(true);
    };

    const viewDetailHistory = async (id) => {
        try {
            const res = await warehouseService.getInventoryById(id);
            setSelectedItem(res?.data?.data || res?.data || res || null);
        } catch (err) {
            toast.error("Không thể tải thẻ kho lịch sử vật tư.");
        }
    };

    const handleDeleteInventory = (id, materialCode) => {
        setConfirmModal({ isOpen: true, id, code: materialCode });
    };

    const executeDeleteInventory = async () => {
        const { id, code } = confirmModal;
        setConfirmModal({ isOpen: false, id: null, code: null });
        if (!id) return;
        
        try {
            await warehouseService.deleteInventory(id);
            toast.success("Xóa mã tồn kho thành công!");
            fetchInventory();
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
            // Loại bỏ ID khỏi mảng tích chọn nếu lỡ xóa vật tư này
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (e) {
            toast.error(e.response?.data?.message || "Xóa kho thất bại.");
        }
    };

    return (
        // Layout 3 cột chuẩn bọc toàn bộ giao diện điều hướng
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-1">

            {/* KHỐI TRÁI (BẢNG DANH SÁCH + PHÂN TRANG GỘP CHUNG VÀO ĐỂ TRÁNH LỖI GIAO DIỆN) */}
            <div className="xl:col-span-2 flex flex-col justify-between bg-white p-6 rounded-2xl border border-outline-variant/70 shadow-sm min-h-[520px]">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-teal-600" /> Thực Trạng Tồn Kho Vật Tư
                        </h2>

                        {/* THANH THAO TÁC: BỘ LỌC + XUẤT PDF + TẠO MỚI */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* BỘ LỌC SẢN PHẨM NHIỀU ÍT */}
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                                <Filter className="w-3.5 h-3.5 text-slate-500" />
                                <select
                                    value={filterStock}
                                    onChange={(e) => setFilterStock(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    <option value="ALL">Tất cả lượng tồn</option>
                                    <option value="LOW">Cảnh báo: Tồn ít (&lt; 20)</option>
                                    <option value="HIGH">Ổn định: Tồn nhiều (&ge; 20)</option>
                                </select>
                            </div>

                            {/* NÚT EXPORT BÁO CÁO TỒN KHO */}
                            <button
                                type="button"
                                onClick={() => handleExportPDF("INVENTORY")}
                                disabled={exportLoading || filteredInventory.length === 0}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm shadow-slate-800/20"
                            >
                                {exportLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <FileDown className="w-3.5 h-3.5" />
                                )}
                                {selectedIds.length > 0 ? `Tồn Kho (${selectedIds.length})` : "Tồn Kho (Tất cả)"}
                            </button>

                            {/* NÚT EXPORT BÁO CÁO VỤN THỪA */}
                            <button
                                type="button"
                                onClick={() => handleExportPDF("LEFTOVER")}
                                disabled={exportLoading || filteredInventory.length === 0}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm shadow-amber-600/20"
                            >
                                {exportLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <FileDown className="w-3.5 h-3.5" />
                                )}
                                {selectedIds.length > 0 ? `Vụn Thừa (${selectedIds.length})` : "Vụn Thừa (Tất cả)"}
                            </button>

                            <button onClick={openCreateModal} className="px-3 py-1.5 bg-primary text-white font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer hover:bg-primary/90 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> Khởi tạo tồn
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 uppercase font-black border-b border-outline-variant tracking-wider">
                                    <th className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                                            disabled={paginatedInventory.length === 0}
                                            checked={
                                                paginatedInventory.length > 0 &&
                                                paginatedInventory.every((item) => selectedIds.includes(item.id))
                                            }
                                            onChange={handleSelectAllPage}
                                        />
                                    </th>
                                    <th className="p-3">Mã vật tư</th>
                                    <th className="p-3">Số lượng tồn</th>
                                    <th className="p-3">Hàng vụn/Leftover</th>
                                    <th className="p-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/40 font-semibold text-slate-600">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                                            Đang tải dữ liệu tồn kho...
                                        </td>
                                    </tr>
                                ) : inventoryList.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400 italic">Kho trống hoặc chưa có vật tư nào được khởi tạo tồn.</td>
                                    </tr>
                                ) : (
                                    // SỬA LỖI CHÍNH: Thay inventoryList bằng paginatedInventory để giới hạn số dòng hiển thị
                                    paginatedInventory.map((item) => (
                                        <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${selectedItem?.id === item.id ? 'bg-teal-50/30' : ''}`}>
                                            {/* CHECKBOX TỪNG DÒNG VẬT TƯ */}
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded accent-teal-600 cursor-pointer"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleSelectRow(item.id)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="font-mono text-[11px] text-teal-700 font-bold">
                                                    {item.materials?.material_code || "Chưa có mã"}
                                                </div>
                                                <div className="text-slate-800 font-black text-xs mt-0.5">
                                                    {item.materials?.material_name || "Vật tư không xác định"} {item.material_thickness?.thickness_value ? `(${item.material_thickness.thickness_value})` : ""}
                                                </div>
                                            </td>
                                            <td className="p-3 text-teal-700 font-bold text-sm">{item.quantity}</td>
                                            <td className="p-3 text-amber-700 font-medium">{item.leftover_amount || 0}</td>
                                            <td className="p-3 text-right flex items-center justify-end gap-1.5">
                                                <button onClick={() => viewDetailHistory(item.id)} className={`p-1.5 rounded-md cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-teal-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} title="Xem thẻ kho lịch sử">
                                                    <History className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => openEditModal(item)} className="p-1.5 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-md cursor-pointer transition-colors" title="Cân đối kiểm kê thủ công">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteInventory(item.id, item.materials?.material_code)}
                                                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-md cursor-pointer transition-colors"
                                                    title="Xóa mã tồn kho"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SỬA LỖI DESIGN: Thanh điều hướng trang được bọc khép kín bên trong khối bảng */}
                {totalPages > 1 && (
                    <div className="border-t border-outline-variant/40 pt-4 mt-4 flex items-center justify-end">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                )}
            </div>

            {/* KHỐI PHẢI: CHI TIẾT VÀ TRA CỨU LOG THỂ KHO */}
            <div className="bg-white p-6 rounded-2xl border border-outline-variant/70 shadow-sm h-fit">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-3">
                    <FileText className="w-4 h-4 text-blue-600" /> Thẻ Kho & Nhật Ký Lưu Vết
                </h2>
                {selectedItem ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                            <p className="font-black text-slate-800 text-xs">
                                [{selectedItem.materials?.material_code || "N/A"}] - {selectedItem.materials?.material_name}
                            </p>
                            <p className="text-slate-500 font-medium">Mã UUID hệ thống: <span className="font-mono text-slate-400 text-[10px]">{selectedItem.material_id}</span></p>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                                <span className="text-slate-500 font-bold">Tồn khả dụng thực tế:</span>
                                <span className="font-black text-sm text-teal-700">{selectedItem.quantity}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold">Hàng vụn tích lũy:</span>
                                <span className="font-bold text-amber-700">{selectedItem.leftover_amount || 0}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nhật ký biến động kho</p>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {selectedItem.materials?.inventory_logs && selectedItem.materials.inventory_logs.length > 0 ? (
                                    selectedItem.materials.inventory_logs.map((log, idx) => (
                                        <div key={idx} className="p-2.5 rounded-lg border text-[11px] bg-white shadow-xs border-slate-100 hover:border-slate-200 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className={`px-1.5 py-0.5 font-black rounded text-[9px] tracking-wider uppercase ${["EXPORT", "DELETE"].includes(log.action_type)
                                                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                    }`}>{log.action_type}</span>
                                                <span className={`font-black text-xs ${log.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-[10px] mt-1 font-mono">Mã chiếu: {log.reference_code || "Hệ thống"}</p>
                                            <p className="text-slate-700 font-semibold mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                {log.note || "Không có ghi chú"}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-6 text-[11px] text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">Chưa ghi nhận biến động xuất nhập nào cho vật tư này.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 text-xs text-slate-400 italic border border-dashed rounded-xl bg-slate-50/50">
                        Chọn biểu tượng <History className="w-3.5 h-3.5 inline mx-1 text-slate-500" /> ở bảng danh sách để tra cứu thẻ kho biến động chi tiết.
                    </div>
                )}
            </div>

            {/* MODAL PHỤ TRỢ (CREATE / EDIT) */}
            {showModal && (
                <Portal>
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <form onSubmit={handleSubmitForm} className="bg-white rounded-2xl w-full max-w-md border shadow-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    {modalType === "CREATE" ? "Khởi tạo mã tồn kho vật tư" : "Cân đối kiểm kê thủ công"}
                                </h3>
                                <button type="button" className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setShowModal(false)}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Chọn Vật Tư Cần Khởi Tạo</label>
                                    {modalType === "CREATE" ? (
                                        <select
                                            required
                                            value={formData.material_id}
                                            onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                                            className="w-full p-2.5 bg-white border rounded-lg focus:outline-teal-600 font-medium text-slate-800 cursor-pointer"
                                        >
                                            <option value="" disabled>-- Bấm để chọn danh mục vật tư --</option>
                                            {materials.map((mat) => (
                                                <option key={mat.id} value={mat.id}>
                                                    [{mat.material_code || "N/A"}] - {mat.material_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            disabled
                                            value={materials.find(m => m.id === formData.material_id) ? `[${materials.find(m => m.id === formData.material_id).material_code}] - ${materials.find(m => m.id === formData.material_id).material_name}` : formData.material_id}
                                            className="w-full p-2.5 border rounded-lg font-bold text-slate-700 bg-slate-50 border-slate-200"
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Số lượng tồn thực tế</label>
                                        <input type="number" step="1" min="0" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border rounded-lg focus:outline-teal-600 font-semibold" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Hàng vụn dư thừa</label>
                                        <input type="number" step="1" min="0" value={formData.leftover_amount} onChange={(e) => setFormData({ ...formData, leftover_amount: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border rounded-lg focus:outline-teal-600 font-semibold" placeholder="0" />
                                    </div>
                                </div>

                                {modalType === "EDIT" && (
                                    <div>
                                        <label className="block font-bold text-rose-700 mb-1 font-black uppercase tracking-wide text-[10px]">Lý do kiểm kê điều chỉnh (Bắt buộc)</label>
                                        <textarea required rows={2} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="w-full p-2.5 border border-rose-200 rounded-lg focus:outline-rose-600 text-xs font-medium" placeholder="VD: Khợp số liệu thực tế, bù hao hụt tự nhiên..." />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-3 text-xs">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer">Hủy bỏ</button>
                                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-lg uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-teal-600/10">Xác nhận</button>
                            </div>
                        </form>
                    </div>
                </Portal>
            )}
            
            <ConfirmModal
                open={confirmModal.isOpen}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa hoàn toàn mã tồn kho của vật tư [${confirmModal.code || "N/A"}] khỏi hệ thống không? Hành động này sẽ ghi log xóa và không thể hoàn tác!`}
                onConfirm={executeDeleteInventory}
                onCancel={() => setConfirmModal({ isOpen: false, id: null, code: null })}
            />
        </div>
    );
};

export default WarehouseInventory;