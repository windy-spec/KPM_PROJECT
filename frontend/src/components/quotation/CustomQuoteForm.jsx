import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Plus, Trash2, Send, Copy, RefreshCw, ImageIcon,
    FileText, Sparkles, Layers, Box, FilePlus
} from 'lucide-react';
import { productService } from '../../services/product.service';
import adminService from '../../services/admin.service';
import { quotationService } from '../../services/quotation.service';
import { showError, showSuccess } from '../../utils/notify';

export default function CustomQuoteForm() {
    // 1. Quản lý Panel/Tab: 'template' (Tùy chỉnh từ mẫu) hoặc 'create' (Tạo mới hoàn toàn)
    const [activePanel, setActivePanel] = useState('template');

    // Lookups dữ liệu hệ thống
    const [systemProducts, setSystemProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [thicknessList, setThicknessList] = useState([]);
    const [paints, setPaints] = useState([]);

    // Trạng thái Form chung
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedProductData, setSelectedProductData] = useState(null);
    const [productName, setProductName] = useState('');
    const [components, setComponents] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingTemplate, setFetchingTemplate] = useState(false);

    // Trạng thái thiết lập nhanh (Bulk Actions)
    const [bulkMaterialId, setBulkMaterialId] = useState('');
    const [bulkPaintId, setBulkPaintId] = useState('');

    // Theo dõi Auto-focus linh kiện mới
    const lastComponentRef = useRef(null);
    const [shouldFocusLast, setShouldFocusLast] = useState(false);

    useEffect(() => {
        loadLookups();
        setComponents([createEmptyComponent()]);
    }, []);

    useEffect(() => {
        if (shouldFocusLast && lastComponentRef.current) {
            lastComponentRef.current.focus();
            setShouldFocusLast(false);
        }
    }, [components, shouldFocusLast]);

    async function loadLookups() {
        try {
            const [prodRes, matRes, thRes, paintRes] = await Promise.all([
                productService.getProducts({ page: 1, limit: 200 }),
                adminService.getMaterials({ page: 1, limit: 500 }),
                adminService.getMaterialThickness(),
                adminService.getPaintTypes(),
            ]);

            setSystemProducts(prodRes.data?.data || prodRes.data || []);
            setMaterials((matRes.data?.data || matRes.data || []).map(m => ({ id: m.id, material_name: m.material_name })));
            setThicknessList(thRes.data?.data || thRes.data || []);
            setPaints(paintRes.data?.data || paintRes.data || []);
        } catch (e) {
            showError('Không tải được danh sách vật tư hoặc dữ liệu hệ thống');
        }
    }

    function createEmptyComponent() {
        return {
            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            component_name: '',
            material_id: '',
            thickness_id: '',
            length: '',
            width: '',
            height: '',
            paint_id: '',
            quantity_per_item: 1
        };
    }

    // Xử lý đổi Panel/Tab chuyển đổi chế độ
    function handlePanelChange(panelType) {
        setActivePanel(panelType);
        handleResetForm(); // Xóa sạch dữ liệu cũ để tránh xung đột
    }

    // Xử lý khi chọn sản phẩm mẫu (Chỉ chạy ở Panel 'template')
    async function handleSelectTemplate(templateId) {
        setSelectedTemplateId(templateId);
        if (!templateId) {
            setSelectedProductData(null);
            setProductName('');
            setComponents([createEmptyComponent()]);
            return;
        }

        setFetchingTemplate(true);
        try {
            const res = await productService.getProductById(templateId);
            const templateData = res.data?.data || res.data;

            if (templateData) {
                setSelectedProductData(templateData);
                setProductName(`${templateData.product_name || templateData.name} (Tùy chỉnh)`);

                if (templateData.product_components && templateData.product_components.length > 0) {
                    const mappedComponents = templateData.product_components.map(c => ({
                        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${c.id}`,
                        component_name: c.component_name || '',
                        material_id: c.material_id || '',
                        thickness_id: c.thickness_id || '',
                        length: c.length || '',
                        width: c.width || '',
                        height: c.height || '',
                        paint_id: c.paint_id || '',
                        quantity_per_item: c.quantity_per_item || 1
                    }));
                    setComponents(mappedComponents);
                } else {
                    setComponents([createEmptyComponent()]);
                }
                showSuccess('Đã đồng bộ thông tin và cấu trúc linh kiện mẫu!');
            }
        } catch (error) {
            showError('Không lấy được thông tin chi tiết cấu trúc sản phẩm mẫu.');
        } finally {
            setFetchingTemplate(false);
        }
    }

    function handleApplyBulkSettings() {
        if (!bulkMaterialId && !bulkPaintId) {
            showError('Vui lòng chọn ít nhất một thông số để áp dụng nhanh.');
            return;
        }
        setComponents(prev => prev.map(c => {
            const updated = { ...c };
            if (bulkMaterialId) {
                if (String(updated.material_id) !== String(bulkMaterialId)) {
                    updated.material_id = bulkMaterialId;
                    updated.thickness_id = '';
                }
            }
            if (bulkPaintId) updated.paint_id = bulkPaintId;
            return updated;
        }));
        showSuccess('Đã đồng bộ thông số cấu hình nhanh cho toàn bộ linh kiện!');
    }

    function addComponent() {
        setComponents(prev => [...prev, createEmptyComponent()]);
        setShouldFocusLast(true);
    }

    function handleDuplicateComponent(originComponent) {
        const cloned = {
            ...originComponent,
            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_copy`,
            component_name: originComponent.component_name ? `${originComponent.component_name} (Bản sao)` : ''
        };
        const index = components.findIndex(c => c.id === originComponent.id);
        const updatedComponents = [...components];
        updatedComponents.splice(index + 1, 0, cloned);
        setComponents(updatedComponents);
        showSuccess(`Đã nhân bản linh kiện!`);
    }

    function removeComponent(id) {
        if (components.length === 1) return showError('Sản phẩm phải có ít nhất 1 linh kiện cấu thành.');
        setComponents(prev => prev.filter(c => c.id !== id));
    }

    function updateComponent(id, patch) {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    }

    function handleResetForm() {
        setSelectedTemplateId('');
        setSelectedProductData(null);
        setProductName('');
        setIsChecked(false);
        setBulkMaterialId('');
        setBulkPaintId('');
        setComponents([createEmptyComponent()]);
    }

    function thicknessOptionsFor(materialId) {
        return thicknessList.filter(t => String(t.material_id) === String(materialId));
    }

    const isFormValid = useMemo(() => {
        if (!productName || !productName.trim()) return false;
        if (components.length === 0) return false;
        for (const c of components) {
            if (!c.component_name || !c.component_name.trim() || !c.material_id || !c.thickness_id || !c.paint_id) return false;
            if (isNaN(c.length) || Number(c.length) <= 0) return false;
            if (isNaN(c.width) || Number(c.width) <= 0) return false;
            if (isNaN(c.height) || Number(c.height) <= 0) return false;
            if (isNaN(c.quantity_per_item) || Number(c.quantity_per_item) <= 0) return false;
        }
        return true;
    }, [productName, components]);

    async function handleSubmitQuote() {
        if (!isFormValid || !isChecked) return;
        const payload = {
            title: productName,
            product_id: activePanel === 'template' ? (selectedTemplateId || null) : null,
            components: components.map(c => ({
                component_name: c.component_name,
                material_id: c.material_id,
                thickness_id: c.thickness_id,
                length: Number(c.length),
                width: Number(c.width),
                height: Number(c.height),
                paint_id: c.paint_id,
                quantity_per_item: Number(c.quantity_per_item)
            }))
        };

        setLoading(true);
        try {
            await quotationService.requestCustomQuote(payload);
            showSuccess('Gửi yêu cầu báo giá sản phẩm tùy chỉnh thành công!');
            handleResetForm();
        } catch (e) {
            showError(e?.response?.data?.message || 'Gửi yêu cầu báo giá thất bại.');
        } finally {
            setLoading(false);
        }
    }

    const productImageUrl = useMemo(() => {
        if (!selectedProductData) return null;
        if (selectedProductData.product_images && selectedProductData.product_images.length > 0) {
            return selectedProductData.product_images[0].image_url || selectedProductData.product_images[0];
        }
        return selectedProductData.image_url || null;
    }, [selectedProductData]);

    return (
        <div className="max-w-[1280px] mx-auto p-4 md:p-6 space-y-6">

            {/* HỆ THỐNG NAVIGATION PANEL (TABS) - UX CHIA ĐÔI TIỆN LỢI */}
            <div className="flex border-b border-outline-variant/60 bg-surface-container/10 p-1.5 rounded-2xl gap-2">
                <button
                    type="button"
                    onClick={() => handlePanelChange('template')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activePanel === 'template'
                        ? 'bg-white text-primary shadow-xs border border-outline-variant/30'
                        : 'text-on-surface-variant/70 hover:bg-white/50 hover:text-on-surface'
                        }`}
                >
                    <Box className="w-4 h-4" />
                    Panel 1: Tùy chỉnh từ sản phẩm mẫu
                </button>
                <button
                    type="button"
                    onClick={() => handlePanelChange('create')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${activePanel === 'create'
                        ? 'bg-white text-primary shadow-xs border border-outline-variant/30'
                        : 'text-on-surface-variant/70 hover:bg-white/50 hover:text-on-surface'
                        }`}
                >
                    <FilePlus className="w-4 h-4" />
                    Panel 2: Thiết kế sản phẩm mới hoàn toàn
                </button>
            </div>

            {/* KHU VỰC BANNER THÔNG TIN ĐẦU VÀO (CHUYỂN ĐỔI THEO PANEL CHỌN) */}
            <div className="border border-outline-variant/60 rounded-2xl bg-white p-5 md:p-6 shadow-2xs">
                <h3 className="text-base md:text-lg font-black uppercase tracking-[0.12em] text-on-surface">
                    {activePanel === 'template' ? 'Tùy biến dựa trên sản phẩm mẫu xưởng' : 'Khởi tạo cấu trúc sản phẩm độc lập'}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant/65">
                    {activePanel === 'template'
                        ? 'Chọn một sản phẩm cơ sở từ hệ thống, chúng tôi sẽ hiển thị chi tiết hình ảnh và linh kiện gốc để bạn dễ dàng chỉnh sửa.'
                        : 'Điền tên sản phẩm thiết kế và tự thiết lập các linh kiện cơ khí theo yêu cầu kỹ thuật riêng biệt.'
                    }
                </p>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* CỘT ĐIỀN THÔNG TIN (Co giãn linh hoạt dựa trên Tab đang mở) */}
                    <div className={`${activePanel === 'template' && selectedProductData ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5 w-full`}>

                        {/* CHỈ HIỂN THỊ CHỌN MẪU KHI Ở PANEL TEMPLATE */}
                        {activePanel === 'template' && (
                            <div>
                                <label className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-1.5">
                                    <Layers className="w-3 h-3" /> Lựa chọn mẫu sản phẩm gốc *
                                </label>
                                <select
                                    className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                    value={selectedTemplateId}
                                    onChange={(e) => handleSelectTemplate(e.target.value)}
                                    disabled={fetchingTemplate}
                                >
                                    <option value="">-- Vui lòng chọn sản phẩm mẫu trong danh sách --</option>
                                    {systemProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.product_name || p.name} ({p.product_code || p.code || 'Mã SP'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* TÊN SẢN PHẨM THIẾT KẾ */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                                {activePanel === 'template' ? 'Tên sản phẩm tùy chỉnh (Gợi ý từ mẫu) *' : 'Tên sản phẩm thiết kế mới *'}
                            </label>
                            <input
                                type="text"
                                placeholder={activePanel === 'template' ? "Chọn sản phẩm mẫu phía trên..." : "Ví dụ: Hệ thống khung vỏ tủ trạm kiosk đặc chủng"}
                                className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                disabled={fetchingTemplate}
                            />
                        </div>
                    </div>

                    {/* HIỂN THỊ KHUNG ẢNH CHUẨN PRODUCTDETAIL (CHỈ XUẤT HIỆN Ở PANEL TEMPLATE) */}
                    {activePanel === 'template' && selectedProductData && (
                        <div className="lg:col-span-5 border border-outline-variant/50 rounded-2xl bg-surface-container/10 p-4 flex gap-4 items-center animate-fadeIn w-full">
                            <div className="w-24 h-24 rounded-xl bg-white border border-outline-variant/40 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                {productImageUrl ? (
                                    <img src={productImageUrl} alt="Product Template" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <div className="flex flex-col items-center text-on-surface-variant/40">
                                        <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                                        <span className="text-[9px] mt-1 font-medium">Không có ảnh</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                                <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    ProductDetail Preview
                                </span>
                                <h4 className="text-sm font-bold text-on-surface truncate">{selectedProductData.product_name || selectedProductData.name}</h4>
                                <p className="text-xs text-on-surface-variant/70 font-mono">Mã: {selectedProductData.product_code || selectedProductData.code || 'N/A'}</p>
                                {selectedProductData.product_categories && (
                                    <p className="text-[11px] text-on-surface-variant/60 truncate flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Mục: {selectedProductData.product_categories?.category_name || selectedProductData.category?.name || '-'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {fetchingTemplate && (
                    <div className="mt-4 text-xs text-primary animate-pulse font-semibold flex items-center gap-2">
                        Đang tải dữ liệu hình ảnh và bóc tách linh kiện từ ProductDetail mẫu...
                    </div>
                )}
            </div>

            {/* THANH THIẾT LẬP NHANH HÀNG LOẠT (ĐỒNG BỘ DÙNG CHUNG CHO CẢ KHỞI TẠO VÀ TÙY CHỈNH) */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-3xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Thanh công cụ điền nhanh: Áp dụng hàng loạt vật tư/loại sơn chung cho tất cả linh kiện.</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                    <select
                        className="rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                        value={bulkMaterialId}
                        onChange={(e) => setBulkMaterialId(e.target.value)}
                    >
                        <option value="">-- Vật Tư chung --</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
                    </select>

                    <select
                        className="rounded-xl border border-outline-variant/60 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-amber-500 cursor-pointer"
                        value={bulkPaintId}
                        onChange={(e) => setBulkPaintId(e.target.value)}
                    >
                        <option value="">-- Loại Sơn chung --</option>
                        {paints.map(p => <option key={p.id} value={p.id}>{p.paint_name}</option>)}
                    </select>

                    <button
                        type="button"
                        onClick={handleApplyBulkSettings}
                        className="bg-amber-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-amber-600 transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                        Áp Dụng Đồng Loạt
                    </button>
                </div>
            </div>

            {/* DANH SÁCH LINH KIỆN CẤU THÀNH (HOÀN TOÀN ĐỒNG BỘ CẤU TRÚC CHO CẢ 2 CHẾ ĐỘ) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-[0.15em] text-on-surface-variant/80">
                        Cấu trúc chi tiết linh kiện cấu thành sản phẩm
                    </h4>
                    <button
                        onClick={addComponent}
                        disabled={fetchingTemplate}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Plus className="h-3.5 w-3.5" /> Thêm Dòng Linh Kiện
                    </button>
                </div>

                {components.map((c, idx) => {
                    const isLast = idx === components.length - 1;
                    return (
                        <div key={c.id} className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-2xs relative group hover:border-primary/30 transition-all animate-fadeIn">
                            <div className="flex flex-col md:flex-row items-start gap-4">
                                <div className="w-8 text-xs font-mono font-black text-primary bg-primary/5 rounded-lg h-8 flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                    {/* Tên linh kiện */}
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Tên linh kiện *</label>
                                        <input
                                            type="text"
                                            ref={isLast ? lastComponentRef : null}
                                            placeholder="Ví dụ: Mặt cửa tủ trước"
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all"
                                            value={c.component_name}
                                            onChange={(e) => updateComponent(c.id, { component_name: e.target.value })}
                                        />
                                    </div>

                                    {/* Số lượng linh kiện */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Số lượng / 1 SP *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all"
                                            value={c.quantity_per_item}
                                            onChange={(e) => updateComponent(c.id, { quantity_per_item: e.target.value })}
                                        />
                                    </div>

                                    {/* Cách sơn & xử lý */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Cách sơn & xử lý *</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                            value={c.paint_id}
                                            onChange={(e) => updateComponent(c.id, { paint_id: e.target.value })}
                                        >
                                            <option value="">Chọn loại sơn</option>
                                            {paints.map(p => <option key={p.id} value={p.id}>{p.paint_name}</option>)}
                                        </select>
                                    </div>

                                    {/* Loại Vật Tư */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Loại Vật Tư *</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                                            value={c.material_id}
                                            onChange={(e) => updateComponent(c.id, { material_id: e.target.value, thickness_id: '' })}
                                        >
                                            <option value="">Chọn vật tư</option>
                                            {materials.map(m => <option key={m.id} value={m.id}>{m.material_name}</option>)}
                                        </select>
                                    </div>

                                    {/* Độ dày */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Độ dày vật tư *</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all cursor-pointer disabled:opacity-40"
                                            disabled={!c.material_id}
                                            value={c.thickness_id}
                                            onChange={(e) => updateComponent(c.id, { thickness_id: e.target.value })}
                                        >
                                            <option value="">Chọn độ dày</option>
                                            {thicknessOptionsFor(c.material_id).map(t => (
                                                <option key={t.id} value={t.id}>{t.thickness_value} mm</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Kích thước 3 chiều */}
                                    <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Dài (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.length} onChange={(e) => updateComponent(c.id, { length: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Rộng (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.width} onChange={(e) => updateComponent(c.id, { width: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Cao (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.height} onChange={(e) => updateComponent(c.id, { height: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* NÚT HÀNH ĐỘNG DÒNG (NHÂN BẢN & XÓA) */}
                                <div className="pt-5 md:pt-4 self-end md:self-start flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleDuplicateComponent(c)}
                                        className="rounded-xl border border-outline-variant/60 p-2.5 text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                                        title="Nhân bản linh kiện"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeComponent(c.id)}
                                        className="rounded-xl border border-outline-variant/60 p-2.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Xóa linh kiện"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BOX SUBMIT & XÁC NHẬN */}
            <div className="border border-outline-variant/60 rounded-2xl bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
                <label className="flex items-start gap-3 cursor-pointer select-none max-w-2xl">
                    <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded-md border-outline-variant/60 text-primary focus:ring-primary cursor-pointer"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                    />
                    <div className="text-xs font-medium text-on-surface-variant/80">
                        <span className="font-black text-on-surface uppercase tracking-wide block mb-0.5">Xác nhận thông số kỹ thuật</span>
                        Tôi xác nhận cấu trúc linh kiện và định mức kỹ thuật trên đã được kiểm tra, khớp với yêu cầu gia công thực tế tại xưởng.
                    </div>
                </label>

                <button
                    onClick={handleSubmitQuote}
                    disabled={!isFormValid || !isChecked || loading || fetchingTemplate}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xs transition-all w-full sm:w-auto cursor-pointer ${isFormValid && isChecked && !loading && !fetchingTemplate
                        ? 'bg-amber-500 hover:bg-amber-600 active:scale-98'
                        : 'bg-on-surface-variant/20 text-on-surface-variant/50 cursor-not-allowed'
                        }`}
                >
                    {loading ? 'Đang gửi yêu cầu...' : (
                        <>
                            <Send className="h-4 w-4" /> Gửi Yêu Cầu Báo Giá
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}