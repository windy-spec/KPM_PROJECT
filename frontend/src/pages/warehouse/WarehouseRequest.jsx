import React, { useState, useEffect } from "react";
import warehouseService from "../../services/warehouse.service";
import orderService from "../../services/order.service";
import { Send, ClipboardList, Loader2, CheckCircle, AlertCircle, PackageSearch } from "lucide-react";

const WarehouseRequest = () => {
    const [orders, setOrders] = useState([]);
    const [inventoryMap, setInventoryMap] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [missingMaterials, setMissingMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [note, setNote] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setErrorMsg(""); // Clear previous errors when fetching
        try {
            const [ordersRes, invRes] = await Promise.all([
                orderService.getAllOrders(),
                warehouseService.getAllInventory()
            ]);
            
            const allOrders = ordersRes?.data || ordersRes || [];
            // Lọc các đơn hàng đang chờ nhập vật tư
            const outOfStockOrders = allOrders.filter(o => o.production_status === "out_of_stock");
            setOrders(outOfStockOrders);

            const invData = invRes?.data?.data || invRes?.data || [];
            if (Array.isArray(invData)) {
                setInventoryMap(invData);
            }
        } catch (err) {
            console.error("fetchData error:", err);
            setErrorMsg(`Lỗi làm mới dữ liệu: ${err.message}`);
        } finally {
            setFetching(false);
        }
    };

    // Khi chọn 1 đơn hàng, tính toán ra danh sách vật tư thiếu
    useEffect(() => {
        if (!selectedOrderId) {
            setMissingMaterials([]);
            setSelectedMaterials([]);
            return;
        }

        const order = orders.find(o => o.id === selectedOrderId);
        if (!order || !order.material_requirements) return;

        const reqs = order.material_requirements;
        const missingList = [];

        for (const [matId, reqQtyStr] of Object.entries(reqs)) {
            const requiredQty = parseFloat(reqQtyStr);
            const inv = inventoryMap.find(i => i.material_id === matId);
            const currentStock = inv ? parseFloat(inv.quantity) : 0;
            const matName = inv ? `${inv.materials?.material_code} - ${inv.materials?.material_name}` : "Vật tư không xác định";

            if (currentStock < requiredQty) {
                missingList.push({
                    material_id: matId,
                    material_name: matName,
                    required_quantity: requiredQty,
                    current_stock: currentStock,
                    missing_quantity: requiredQty - currentStock
                });
            }
        }
        
        setMissingMaterials(missingList);
        // Chọn sẵn tất cả theo mặc định
        setSelectedMaterials(missingList.map(m => m.material_id));
    }, [selectedOrderId, orders, inventoryMap]);

    const handleToggleMaterial = (matId) => {
        if (selectedMaterials.includes(matId)) {
            setSelectedMaterials(selectedMaterials.filter(id => id !== matId));
        } else {
            setSelectedMaterials([...selectedMaterials, matId]);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccess(false);

        if (!selectedOrderId) {
            setErrorMsg("Vui lòng chọn đơn hàng cần báo thiếu!");
            return;
        }

        if (selectedMaterials.length === 0) {
            setErrorMsg("Vui lòng tích chọn ít nhất 1 loại vật tư cần nhập!");
            return;
        }

        // Tạo mảng items để gửi lên
        const itemsToRequest = missingMaterials
            .filter(m => selectedMaterials.includes(m.material_id))
            .map(m => ({
                material_id: m.material_id,
                requested_quantity: m.missing_quantity,
                order_id: selectedOrderId
            }));

        setLoading(true);
        try {
            await warehouseService.requestImportMaterials({
                items: itemsToRequest,
                note: `[Đơn hàng: ${orders.find(o=>o.id === selectedOrderId)?.order_code}] ${note.trim()}`
            });
            setSuccess(true);
            setNote(""); 
            setSelectedOrderId(""); // Reset
            // Refresh data
            await fetchData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Đã xảy ra lỗi trong quá trình gửi phiếu đề xuất.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-outline-variant/70 shadow-sm mt-4">
            <div className="mb-5 border-b pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" /> Lập Phiếu Yêu Cầu Nhập Vật Tư
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Chọn đơn hàng đang thiếu vật tư, hệ thống sẽ tự động đối chiếu tồn kho và tạo danh sách yêu cầu nhập.</p>
            </div>

            {success && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> 
                    <span>Đã gửi phiếu yêu cầu nhập vật tư cho Admin thành công!</span>
                </div>
            )}

            {errorMsg && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> 
                    <span>{errorMsg}</span>
                </div>
            )}

            {fetching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    Đang tải dữ liệu...
                </div>
            ) : (
                <form onSubmit={handleSendRequest} className="space-y-6 text-xs">
                    
                    {/* BƯỚC 1: CHỌN ĐƠN HÀNG */}
                    <div>
                        <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wide">1. Chọn Đơn hàng đang báo thiếu</label>
                        <select
                            required
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-primary bg-slate-50/50"
                        >
                            <option value="">-- Chọn đơn hàng cần nhập thêm vật tư --</option>
                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    Đơn: {order.order_code} (Ngày tạo: {new Date(order.created_at).toLocaleDateString("vi-VN")})
                                </option>
                            ))}
                        </select>
                        {orders.length === 0 && (
                            <p className="text-[10px] text-amber-600 font-bold mt-2">Hiện không có đơn hàng nào đang báo thiếu vật tư.</p>
                        )}
                    </div>

                    {/* BƯỚC 2: CHECKLIST VẬT TƯ */}
                    {selectedOrderId && (
                        <div className="border border-outline-variant/60 rounded-xl overflow-hidden bg-white">
                            <div className="p-3 bg-slate-100 border-b border-outline-variant/60 font-black text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <PackageSearch className="w-4 h-4 text-slate-500" /> 2. Checklist Vật tư cần nhập
                            </div>
                            
                            {missingMaterials.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 font-bold">
                                    Đơn hàng này hiện đã có ĐỦ vật tư trong kho. Không cần nhập thêm!
                                </div>
                            ) : (
                                <div className="divide-y divide-outline-variant/40">
                                    {missingMaterials.map((mat) => (
                                        <label key={mat.material_id} className="flex items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedMaterials.includes(mat.material_id)}
                                                onChange={() => handleToggleMaterial(mat.material_id)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="font-bold text-slate-800">{mat.material_name}</div>
                                                <div className="flex gap-4 mt-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                                    <span>Cần: <span className="text-slate-700">{mat.required_quantity}</span></span>
                                                    <span>Tồn kho: <span className="text-rose-600">{mat.current_stock}</span></span>
                                                    <span>Phải nhập: <span className="text-primary">{mat.missing_quantity}</span></span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* GHI CHÚ */}
                    <div>
                        <label className="block font-black text-slate-700 mb-1.5 uppercase tracking-wide">3. Ghi chú gửi Admin (Tùy chọn)</label>
                        <textarea
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-primary bg-slate-50/30"
                            placeholder="Mô tả mức độ khẩn cấp..."
                        />
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={loading || !selectedOrderId || missingMaterials.length === 0 || selectedMaterials.length === 0}
                        className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 transition-all active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Gửi Phiếu Yêu Cầu Nhập Hàng
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default WarehouseRequest;