import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, AlertTriangle, Check, RefreshCw, Ban } from 'lucide-react';
import { quotationService } from '../../services/quotation.service';
import adminService from '../../services/admin.service';
import { showError, showSuccess } from '../../utils/notify';

export default function AdminQuoteReviewModal({ quoteId, onClose, onRefresh }) {
    const [quote, setQuote] = useState(null);
    const [components, setComponents] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [thicknessList, setThicknessList] = useState([]);
    const [paints, setPaints] = useState([]);

    const [finalPrice, setFinalPrice] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (quoteId) {
            loadQuoteDetail();
            loadLookups();
        }
    }, [quoteId]);

    async function loadQuoteDetail() {
        try {
            const res = await quotationService.getById(quoteId);
            const data = res.data?.data || res.data;
            setQuote(data);
            // Nạp toàn bộ danh sách linh kiện sản phẩm do User gửi về vào trạng thái chỉnh sửa của Admin
            const loadedSpecs = data.quotation_specs || [];
            const mappedComponents = loadedSpecs.map(spec => ({
                id: spec.id || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                component_name: spec.component_name || '',
                material_id: spec.material_id || '',
                thickness_id: spec.thickness_id || '',
                thickness_value: spec.material_thickness?.thickness_value || '1.2',
                paint_id: spec.paint_id || '',
                length: spec.dimensions?.length || 0,
                width: spec.dimensions?.width || 0,
                height: spec.dimensions?.height || 0,
                quantity_per_item: spec.dimensions?.quantity || 1
            }));
            setComponents(mappedComponents);
            setFinalPrice(data.total_quoted_price || '');
        } catch (e) {
            showError('Không lấy được chi tiết báo giá này.');
        }
    }

    async function loadLookups() {
        try {
            const [matRes, thRes, paintRes] = await Promise.all([
                adminService.getMaterials({ page: 1, limit: 500 }),
                adminService.getMaterialThickness(),
                adminService.getPaintTypes(),
            ]);
            setMaterials(matRes.data?.data || matRes.data || []);
            setThicknessList(thRes.data?.data || thRes.data || []);
            setPaints(paintRes.data?.data || paintRes.data || []);
        } catch (e) {
            console.error("Lỗi tải dữ liệu cấu hình", e);
        }
    }

    // Thuật toán tính toán Realtime giá sàn dựa trên toàn bộ thông số hình học hiện tại của các linh kiện
    const calculatedSuggestedCost = () => {
        let totalCost = 0;
        components.forEach(c => {
            const length = Number(c.length || 0);
            const width = Number(c.width || 0);
            const height = Number(c.height || 0);
            const qty = Number(c.quantity_per_item || 1);

            // Tính toán thể tích phôi linh kiện cơ khí (m³)
            const vol = (length * width * height) / 1000000000;

            // Xác định hệ số độ dày thực tế hoặc mặc định 1.2mm
            const thickValue = Number(c.thickness_value || 1.2);

            // Tìm thông tin giá sơn phủ bổ sung nếu được cấu hình chọn
            const selectedPaint = paints.find(p => String(p.id) === String(c.paint_id));
            const paintPrice = Number(selectedPaint?.price || selectedPaint?.cost || 0);

            // Công thức tính toán chi phí gia công cấu kiện bao gồm phôi vật tư + độ dày phôi + lớp phủ bề mặt
            const baseComponentCost = (vol * 45000000) + (thickValue * 15000) + paintPrice;
            totalCost += baseComponentCost * qty;
        });

        // Đảm bảo mức sàn tối thiểu của đơn hàng gia công xưởng là 350.000đ
        return Math.max(Math.round(totalCost), 350000);
    };

    const suggestedCost = calculatedSuggestedCost();

    // Hàm cập nhật động các thông số (Dài, Rộng, Cao, Vật tư, Độ dày) của cấu kiện đang xét
    function updateComponent(id, patch) {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    }

    // Admin chủ động thêm phôi cấu kiện mới vào sản phẩm nếu thấy thiếu bộ phận gia công
    function addComponentAdmin() {
        const firstMaterialId = materials[0]?.id || '';
        const matchingThickness = thicknessList.find(t => String(t.material_id) === String(firstMaterialId));

        setComponents(prev => [
            ...prev,
            {
                id: 'new_' + Date.now() + Math.random().toString(36).substr(2, 5),
                component_name: 'Cấu kiện bổ sung từ Admin',
                material_id: firstMaterialId,
                thickness_id: matchingThickness ? matchingThickness.id : '',
                thickness_value: matchingThickness ? String(matchingThickness.thickness_value) : '1.2',
                length: 100,
                width: 100,
                height: 50,
                paint_id: '',
                quantity_per_item: 1
            }
        ]);
    }

    function removeComponentAdmin(id) {
        setComponents(prev => prev.filter(c => c.id !== id));
    }

    // 1. Duyệt và gửi báo giá chính thức sau khi sửa đổi thông số hình học sản phẩm
    async function handleSendQuote() {
        if (!finalPrice || Number(finalPrice) < suggestedCost) {
            return showError(`Giá chốt báo khách hàng không được thấp hơn mức giá sàn sản xuất của xưởng (${new Intl.NumberFormat('vi-VN').format(suggestedCost)} đ)`);
        }

        setLoading(true);
        const payload = {
            final_price: Number(finalPrice),
            components: components.map(c => ({
                component_name: c.component_name,
                material_id: c.material_id,
                thickness_id: c.thickness_id,
                length: Number(c.length) || 0,
                width: Number(c.width) || 0,
                height: Number(c.height) || 0,
                paint_id: c.paint_id || null,
                quantity_per_item: Number(c.quantity_per_item) || 1
            }))
        };

        try {
            await quotationService.approveQuoteRequest(quoteId, payload);
            showSuccess('Đã đồng bộ thông số hình học mới và gửi báo giá thành công tới khách hàng.');
            onRefresh?.();
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Xử lý duyệt thông số báo giá thất bại.');
        } finally {
            setLoading(false);
        }
    }

    // 2. Từ chối yêu cầu báo giá sản phẩm
    async function handleRejectQuote() {
        if (!showRejectInput) {
            setShowRejectInput(true);
            return;
        }
        if (!rejectReason.trim()) {
            return showError('Vui lòng cung cấp lý do từ chối cụ thể.');
        }

        setLoading(true);
        try {
            await quotationService.updateStatus(quoteId, 'rejected', { reason: rejectReason.trim() });
            showSuccess('Đã từ chối đơn yêu cầu báo giá thành công.');
            onRefresh?.();
            onClose();
        } catch (e) {
            showError('Không thể cập nhật trạng thái từ chối đơn.');
        } finally {
            setLoading(false);
        }
    }

    // 3. Lưu tiến độ xem xét (Lưu tạm thông số cấu kiện vừa căn chỉnh vào Database)
    async function handleHoldQuote() {
        setLoading(true);
        try {
            await quotationService.updateStatus(quoteId, 'pending_admin', { components });
            showSuccess('Đã lưu cấu trúc thông số hình học vừa chỉnh sửa, trạng thái: Chờ xem xét.');
            loadQuoteDetail();
        } catch (e) {
            showError('Lưu thông số tạm thời thất bại.');
        } finally {
            setLoading(false);
        }
    }

    if (!quote) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[92vh] flex flex-col border border-outline-variant/60 shadow-xl animate-in fade-in zoom-in-95 duration-150">

                {/* MODAL HEADER */}
                <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black uppercase tracking-wide text-on-surface">Thẩm Định & Điều Chỉnh Thông Số Kỹ Thuật</h2>
                            <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-sm">#{quoteId.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant/70 mt-0.5">Sản phẩm yêu cầu: <span className="font-black text-primary">{quote.product_name || quote.productName}</span></p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-surface-container/60 text-on-surface-variant/80 transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
                </div>

                {/* MODAL BODY */}
                <div className="p-5 flex-1 overflow-y-auto space-y-6">

                    {/* KHU VỰC CHỈNH SỬA TOÀN DIỆN THÔNG SỐ CÁC LINH KIỆN SẢN PHẨM */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80">Cấu trúc thông số chi tiết cấu kiện hình học sản phẩm</h4>
                            <button onClick={addComponentAdmin} className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase bg-surface-container border border-outline-variant/60 px-3 py-1.5 rounded-xl hover:border-primary hover:text-primary transition-all cursor-pointer">
                                <Plus className="h-3.5 w-3.5" /> Thêm cấu kiện / phôi rời
                            </button>
                        </div>

                        <div className="border border-outline-variant/50 rounded-xl divide-y divide-outline-variant/40 bg-surface-container/5 overflow-hidden">
                            {/* Table Header cho vùng điền thông số nhằm tối ưu hóa tầm nhìn */}
                            <div className="bg-surface-container/30 px-4 py-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 hidden lg:flex">
                                <div className="w-6">STT</div>
                                <div className="flex-1 min-w-[150px]">Tên Linh Kiện / Bộ Phận</div>
                                <div className="w-16 text-center">Số Lượng</div>
                                <div className="w-28">Loại Vật Tư</div>
                                <div className="w-24">Độ Dày</div>
                                <div className="w-32">Xử Lý Bề Mặt</div>
                                <div className="w-48 text-center">Kích Thước Phôi (Dài x Rộng x Cao) (mm)</div>
                                <div className="w-10 ml-auto"></div>
                            </div>

                            <div className="max-h-[380px] overflow-y-auto divide-y divide-outline-variant/30">
                                {components.map((c, i) => {
                                    const availableThicknesses = thicknessList.filter(t => String(t.material_id) === String(c.material_id));

                                    return (
                                        <div key={c.id || i} className="p-3 bg-white flex flex-col lg:flex-row flex-wrap lg:items-center gap-3 text-xs">
                                            <div className="font-mono font-bold text-on-surface-variant/60 w-6 lg:text-left">#{i + 1}</div>

                                            {/* Tên bộ phận linh kiện */}
                                            <div className="flex-1 min-w-[150px]">
                                                <input
                                                    type="text"
                                                    className="w-full border-b border-outline-variant/50 focus:border-primary outline-none font-bold py-1 px-1 text-on-surface"
                                                    value={c.component_name || ''}
                                                    onChange={(e) => updateComponent(c.id, { component_name: e.target.value })}
                                                    placeholder="Ví dụ: Khung đỡ chịu lực chính..."
                                                />
                                            </div>

                                            {/* Số lượng của bộ phận cấu kiện này */}
                                            <div className="w-full lg:w-16">
                                                <label className="block text-[8px] uppercase font-black text-on-surface-variant/50 mb-0.5 lg:hidden">Số lượng</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border border-outline-variant/60 rounded px-1.5 py-1 font-bold text-center bg-white"
                                                    value={c.quantity_per_item || 1}
                                                    onChange={(e) => updateComponent(c.id, { quantity_per_item: Number(e.target.value) || 1 })}
                                                />
                                            </div>

                                            {/* Vật tư cấu thành */}
                                            <div className="w-full lg:w-28">
                                                <label className="block text-[8px] uppercase font-black text-on-surface-variant/50 mb-0.5 lg:hidden">Vật tư</label>
                                                <select
                                                    className="w-full border border-outline-variant/60 rounded px-1.5 py-1 font-semibold outline-none bg-white"
                                                    value={c.material_id || ''}
                                                    onChange={(e) => {
                                                        const newMatId = e.target.value;
                                                        const defaults = thicknessList.find(t => String(t.material_id) === String(newMatId));
                                                        updateComponent(c.id, {
                                                            material_id: newMatId,
                                                            thickness_id: defaults ? defaults.id : '',
                                                            thickness_value: defaults ? String(defaults.thickness_value) : '1.2'
                                                        });
                                                    }}
                                                >
                                                    <option value="">-- Chọn vật tư --</option>
                                                    {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
                                                </select>
                                            </div>

                                            {/* Độ dày phôi cơ khí */}
                                            <div className="w-full lg:w-24">
                                                <label className="block text-[8px] uppercase font-black text-on-surface-variant/50 mb-0.5 lg:hidden">Độ dày</label>
                                                <select
                                                    className="w-full border border-outline-variant/60 rounded px-1.5 py-1 font-semibold outline-none bg-white"
                                                    value={c.thickness_id || ''}
                                                    onChange={(e) => {
                                                        const tId = e.target.value;
                                                        const tObj = availableThicknesses.find(t => String(t.id) === String(tId));
                                                        updateComponent(c.id, {
                                                            thickness_id: tId,
                                                            thickness_value: tObj ? tObj.thickness_value : c.thickness_value
                                                        });
                                                    }}
                                                >
                                                    <option value="">-- Chọn độ dày --</option>
                                                    {availableThicknesses.length > 0 ? (
                                                        availableThicknesses.map((t, idx) => (
                                                            <option key={idx} value={t.id}>{t.thickness_value} mm</option>
                                                        ))
                                                    ) : (
                                                        <option value={c.thickness_id}>{c.thickness_value || '1.2'} mm</option>
                                                    )}
                                                </select>
                                            </div>

                                            {/* Công nghệ xử lý bề mặt phủ sơn */}
                                            <div className="w-full lg:w-32">
                                                <label className="block text-[8px] uppercase font-black text-on-surface-variant/50 mb-0.5 lg:hidden">Bề mặt</label>
                                                <select
                                                    className="w-full border border-outline-variant/60 rounded px-1.5 py-1 font-semibold outline-none bg-white"
                                                    value={c.paint_id || ''}
                                                    onChange={(e) => updateComponent(c.id, { paint_id: e.target.value })}
                                                >
                                                    <option value="">-- Mộc (Không sơn) --</option>
                                                    {paints.map(p => <option key={p.id} value={p.id}>{p.paint_name || p.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Bộ ba thông số kích thước hình học quan trọng: Dài x Rộng x Cao */}
                                            <div className="w-full lg:w-48 flex items-center gap-1.5 bg-surface-container/20 p-1 rounded-lg border border-outline-variant/30">
                                                <div className="flex-1">
                                                    <span className="block text-[7px] uppercase font-black text-center text-on-surface-variant/60">Dài</span>
                                                    <input type="number" className="w-full text-center bg-white border border-outline-variant/40 rounded py-0.5 font-bold" value={c.length || 0} onChange={(e) => updateComponent(c.id, { length: Number(e.target.value) || 0 })} />
                                                </div>
                                                <span className="text-[9px] text-on-surface-variant/40 font-bold mt-3">x</span>
                                                <div className="flex-1">
                                                    <span className="block text-[7px] uppercase font-black text-center text-on-surface-variant/60">Rộng</span>
                                                    <input type="number" className="w-full text-center bg-white border border-outline-variant/40 rounded py-0.5 font-bold" value={c.width || 0} onChange={(e) => updateComponent(c.id, { width: Number(e.target.value) || 0 })} />
                                                </div>
                                                <span className="text-[9px] text-on-surface-variant/40 font-bold mt-3">x</span>
                                                <div className="flex-1">
                                                    <span className="block text-[7px] uppercase font-black text-center text-on-surface-variant/60">Cao</span>
                                                    <input type="number" className="w-full text-center bg-white border border-outline-variant/40 rounded py-0.5 font-bold" value={c.height || 0} onChange={(e) => updateComponent(c.id, { height: Number(e.target.value) || 0 })} />
                                                </div>
                                            </div>

                                            {/* Nút loại bỏ cấu kiện linh kiện */}
                                            <button onClick={() => removeComponentAdmin(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg lg:ml-auto cursor-pointer self-end lg:self-center" title="Xóa linh kiện">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* VÙNG ĐỊNH MỨC VÀ ÁP ĐƠN GIÁ BÁO GIÁ ĐƠN HÀNG */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">

                        {/* Cơ chế định mức giá sàn nội bộ dựa theo thông số hình học vừa sửa */}
                        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-black uppercase tracking-wide text-amber-800">Hệ thống định mức giá sàn tự động</h5>
                                <p className="text-xs text-amber-900/70 mt-1">Hệ thống tự tính toán tổng khối lượng phôi cơ khí và lớp sơn bề mặt theo các thông số hình học vừa thay đổi phía trên:</p>
                                <div className="mt-2 text-base font-mono font-black text-amber-700 bg-white border border-amber-200/60 rounded-lg px-3 py-1.5 inline-block shadow-2xs">
                                    {new Intl.NumberFormat('vi-VN').format(suggestedCost)} đ
                                </div>
                            </div>
                        </div>

                        {/* Ô nhập đơn giá chốt để gửi sang cho Khách hàng xác nhận */}
                        <div className="rounded-xl border border-outline-variant/70 bg-white p-4 flex flex-col justify-center space-y-3 shadow-2xs">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/80 block">Đơn giá chốt cuối cùng gửi tới khách hàng (VNĐ) *</label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        placeholder="Nhập mức giá chính thức sau thẩm định"
                                        className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm font-black outline-none focus:border-primary focus:bg-white transition-all text-on-surface"
                                        value={finalPrice}
                                        onChange={(e) => setFinalPrice(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant/60">VNĐ</span>
                                </div>
                                {finalPrice && Number(finalPrice) < suggestedCost && (
                                    <p className="text-[11px] text-rose-600 font-bold mt-1.5 animate-pulse flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Cảnh báo: Đơn giá đang thấp hơn mức chi phí sàn sản xuất tối thiểu của xưởng cơ khí!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vùng điền lý do từ chối nếu kích hoạt nút Từ chối */}
                    {showRejectInput && (
                        <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl animate-in slide-in-from-top-2 duration-150">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">Lý do từ chối đơn yêu cầu báo giá *</label>
                                <button type="button" onClick={() => setShowRejectInput(false)} className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">Hủy từ chối</button>
                            </div>
                            <textarea
                                className="w-full rounded-xl border border-rose-300 bg-white p-3 text-xs font-medium outline-none focus:border-rose-500 text-on-surface shadow-2xs"
                                rows="2"
                                placeholder="Nhập lý do gửi đến khách hàng (Ví dụ: Thông số kỹ thuật của bản vẽ cơ khí cung cấp bị mâu thuẫn hoặc xưởng tạm thời thiếu phôi inox dày trên 5mm...)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    )}

                </div>

                {/* MODAL FOOTER */}
                <div className="px-5 py-4 border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container/5">
                    {/* Nút hành động Từ Chối */}
                    <button
                        onClick={handleRejectQuote}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-rose-700 hover:bg-rose-100 transition-all w-full sm:w-auto cursor-pointer disabled:opacity-50"
                    >
                        <Ban className="h-3.5 w-3.5" />
                        {showRejectInput ? 'Xác nhận hủy đơn' : 'Từ Chối Báo Giá'}
                    </button>

                    {/* Nhóm nút tác vụ Lưu nháp / Gửi báo giá chốt */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleHoldQuote}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-on-surface-variant hover:bg-surface-container transition-all w-full sm:w-auto cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Lưu Thay Đổi / Chờ Xem Xét
                        </button>

                        <button
                            onClick={handleSendQuote}
                            disabled={loading || !finalPrice || Number(finalPrice) < suggestedCost}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-all w-full sm:w-auto cursor-pointer ${finalPrice && Number(finalPrice) >= suggestedCost && !loading
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-97'
                                : 'bg-on-surface-variant/20 text-on-surface-variant/40 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <Check className="h-3.5 w-3.5" /> Phê Duyệt & Gửi Cho KH
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}