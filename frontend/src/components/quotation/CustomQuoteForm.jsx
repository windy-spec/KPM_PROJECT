import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Layers, ImageIcon, Info, Send } from 'lucide-react';
import { productService } from '../../services/product.service';
import adminService from '../../services/admin.service';
import { quotationService } from '../../services/quotation.service';
import { CATEGORY_BLUEPRINTS } from "../../config/categoryBlueprints"; // Import bộ luật blueprint ràng buộc hệ thống
import { showError, showSuccess } from '../../utils/notify';

export default function CustomQuoteForm() {
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

    // Theo dõi Auto-focus linh kiện
    const firstComponentRef = useRef(null);

    useEffect(() => {
        loadLookups();
        setComponents([createEmptyComponent()]);
    }, []);

    async function loadLookups() {
        try {
            const [prodRes, matRes, thRes, paintRes] = await Promise.all([
                productService.getProducts({ page: 1, limit: 200 }),
                adminService.getMaterials({ page: 1, limit: 500 }),
                adminService.getMaterialThickness(),
                adminService.getPaintTypes(),
            ]);

            setSystemProducts(prodRes.data?.data || prodRes.data || []);
            setMaterials(matRes.data?.data || matRes.data || []);
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
            paint_id: ''
        };
    }

    // 1. LẤY BLUEPRINT CỦA DANH MỤC
    const currentBlueprint = useMemo(() => {
        if (!selectedProductData) return null;
        const categoryCode = selectedProductData.product_categories?.category_code ||
            selectedProductData.category?.category_code ||
            selectedProductData.category_code;

        if (!categoryCode) return null;
        return CATEGORY_BLUEPRINTS[categoryCode] || null;
    }, [selectedProductData]);

    // 2. HÀM TỰ ĐỘNG LỌC VẬT TƯ CHO PHÉP THEO TÊN LINH KIỆN
    const getAllowedMaterialsForComponent = (componentName) => {
        if (!materials || materials.length === 0) return [];
        if (!currentBlueprint || !Array.isArray(currentBlueprint)) return materials;

        const nameKey = (componentName || '').toLowerCase().trim();

        const bpMatch = currentBlueprint.find(b =>
            nameKey === (b.name || '').toLowerCase().trim() ||
            nameKey.includes((b.name || '').toLowerCase().trim())
        );

        if (bpMatch && Array.isArray(bpMatch.allowed_materials)) {
            return materials.filter(m => bpMatch.allowed_materials.includes(m.material_code));
        }

        return materials;
    };

    // Lọc danh sách độ dày theo vật tư được chọn
    function thicknessOptionsFor(materialId) {
        if (!materialId) return [];
        return thicknessList.filter(t => String(t.material_id) === String(materialId));
    }

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

                // 1. BIẾN ĐƯỢC KHAI BÁO Ở ĐÂY
                const originalComponents = templateData.product_components || templateData.components || [];

                if (originalComponents.length > 0) {
                    // 2. LOGIC MAPPING PHẢI NẰM TRONG KHỐI IF NÀY ĐỂ TRUY CẬP ĐƯỢC BIẾN
                    const mappedComponents = originalComponents.map(c => {
                        const options = thicknessList.filter(t => String(t.material_id) === String(c.material_id));
                        return {
                            id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${c.id}`,
                            component_name: c.component_name || c.name || '',
                            material_id: c.material_id || '', // Giữ chuỗi UUID nguyên bản, không ép Number
                            thickness_id: options.length > 0 ? (c.thickness_id || '') : '', // Giữ chuỗi UUID nguyên bản
                            length: c.length || '',
                            width: c.width || '',
                            height: c.height || '',
                            paint_id: c.paint_id || '' // Giữ chuỗi UUID nguyên bản
                        };
                    });
                    setComponents(mappedComponents);
                } else {
                    setComponents([createEmptyComponent()]);
                }
                showSuccess('Đã bóc tách cấu trúc linh kiện gốc thành công!');
            }
        } catch (error) {
            showError('Không lấy được thông tin bóc tách chi tiết của sản phẩm mẫu.');
        } finally {
            setFetchingTemplate(false);
        }
    }

    function updateComponent(id, patch) {
        setComponents(prev => prev.map(c => {
            if (c.id === id) {
                const updated = { ...c, ...patch };
                if (patch.component_name !== undefined) {
                    const allowedForNewName = getAllowedMaterialsForComponent(updated.component_name);
                    const stillValid = allowedForNewName.some(m => String(m.id) === String(updated.material_id));
                    if (!stillValid) {
                        updated.material_id = '';
                        updated.thickness_id = '';
                    }

                    if (currentBlueprint && Array.isArray(currentBlueprint)) {
                        const bpMatch = currentBlueprint.find(b =>
                            (updated.component_name || '').toLowerCase().trim().includes((b.name || '').toLowerCase().trim())
                        );
                        if (bpMatch && bpMatch.allow_paint === false) {
                            updated.paint_id = '';
                        }
                    }
                }
                return updated;
            }
            return c;
        }));
    }

    // LOGIC VALIDATE FORM
    const isFormValid = useMemo(() => {
        if (!productName || !productName.trim()) return false;
        if (components.length === 0) return false;

        for (const c of components) {
            if (!c.component_name || !c.component_name.trim() || !c.material_id) return false;

            const allowedForThisComp = getAllowedMaterialsForComponent(c.component_name);
            const isMaterialValid = allowedForThisComp.some(m => String(m.id) === String(c.material_id));
            if (!isMaterialValid) return false;

            let isPaintAllowed = true;
            if (currentBlueprint && Array.isArray(currentBlueprint)) {
                const bpMatch = currentBlueprint.find(b =>
                    (c.component_name || '').toLowerCase().trim().includes((b.name || '').toLowerCase().trim())
                );
                if (bpMatch && bpMatch.allow_paint === false) {
                    isPaintAllowed = false;
                }
            }
            if (isPaintAllowed && !c.paint_id) return false;

            const validThicknessOptions = thicknessOptionsFor(c.material_id);
            if (validThicknessOptions.length > 0 && !c.thickness_id) return false;

            if (isNaN(c.length) || Number(c.length) <= 0) return false;
            if (isNaN(c.width) || Number(c.width) <= 0) return false;
            if (isNaN(c.height) || Number(c.height) < 0) return false;
        }
        return true;
    }, [productName, components, thicknessList, currentBlueprint, materials]);

    async function handleSubmitQuote() {
        if (!isFormValid || !isChecked) return;

        const payload = {
            title: productName,
            // product_id có thể là Number hoặc String tùy thuộc DB của bạn, 
            // nếu mẫu sản phẩm cũng dùng UUID thì bỏ Number() đi.
            product_id: selectedTemplateId ? selectedTemplateId : null,
            components: components.map(c => {
                const validThicknessOptions = thicknessOptionsFor(c.material_id);
                return {
                    component_name: c.component_name,
                    material_id: c.material_id, // GIỮ NGUYÊN KIỂU CHUỖI UUID
                    thickness_id: validThicknessOptions.length > 0 ? c.thickness_id : null, // GIỮ NGUYÊN KIỂU CHUỖI UUID
                    length: Number(c.length), // Kích thước vẫn phải là Number
                    width: Number(c.width),   // Kích thước vẫn phải là Number
                    height: Number(c.height), // Kích thước vẫn phải là Number
                    paint_id: c.paint_id ? c.paint_id : null // GIỮ NGUYÊN KIỂU CHUỖI UUID
                };
            })
        };

        setLoading(true);
        try {
            await quotationService.requestCustomQuote(payload);
            showSuccess('Gửi yêu cầu báo giá cấu hình tùy chỉnh thành công!');
            handleResetForm();
        } catch (e) {
            showError(e?.response?.data?.message || 'Gửi yêu cầu báo giá thất bại.');
        } finally {
            setLoading(false);
        }
    }

    function handleResetForm() {
        setSelectedTemplateId('');
        setSelectedProductData(null);
        setProductName('');
        setIsChecked(false);
        setComponents([createEmptyComponent()]);
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

            {/* KHU VỰC CHỌN SẢN PHẨM MẪU */}
            <div className="border border-outline-variant/60 rounded-2xl bg-white p-5 md:p-6 shadow-2xs">
                <h3 className="text-base md:text-lg font-black uppercase tracking-[0.12em] text-on-surface">
                    Tùy biến cấu trúc sản phẩm mẫu xưởng
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant/65">
                    Chọn một sản phẩm cơ sở từ hệ thống, chúng tôi sẽ bóc tách toàn bộ cấu trúc linh kiện gốc để bạn dễ dàng căn chỉnh thông số kỹ thuật.
                </p>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className={`${selectedProductData ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5 w-full`}>
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

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">
                                Tên sản phẩm tùy chỉnh (Gợi ý từ mẫu) *
                            </label>
                            <input
                                type="text"
                                placeholder="Chọn sản phẩm mẫu phía trên..."
                                className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                disabled={fetchingTemplate}
                            />
                        </div>
                    </div>

                    {selectedProductData && (
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
                                    Ràng buộc Linh Kiện Active
                                </span>
                                <span className="block text-sm font-bold text-on-surface truncate">
                                    {selectedProductData.product_name || selectedProductData.name}
                                </span>
                                {currentBlueprint && (
                                    <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-1 w-fit">
                                        <Info className="w-3 h-3 shrink-0" />
                                        Vật tư & Sơn đồng bộ với Blueprint danh mục
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DANH SÁCH LINH KIỆN CẤU THÀNH (CHỈ CHO PHÉP SỬA KHÔNG THÊM DÒNG/TÊN) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-[0.15em] text-on-surface-variant/80">
                        Cấu trúc chi tiết linh kiện cấu thành sản phẩm (Chỉ chỉnh sửa thông số)
                    </h4>
                </div>

                {components.map((c, idx) => {
                    const isFirst = idx === 0;
                    const currentThicknessOptions = thicknessOptionsFor(c.material_id);
                    const hasThicknessOptions = currentThicknessOptions.length > 0;

                    const allowedMaterialsForThisRow = getAllowedMaterialsForComponent(c.component_name);

                    // SỬA LỖI SCOPE: Khai báo và tính toán chuẩn xác biến check sơn theo từng dòng `c`
                    let isPaintAllowed = true;
                    if (currentBlueprint && Array.isArray(currentBlueprint)) {
                        const bpMatch = currentBlueprint.find(b =>
                            (c.component_name || '').toLowerCase().trim().includes((b.name || '').toLowerCase().trim())
                        );
                        if (bpMatch && bpMatch.allow_paint === false) {
                            isPaintAllowed = false;
                        }
                    }

                    return (
                        <div key={c.id} className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-2xs relative group hover:border-primary/30 transition-all animate-fadeIn">
                            <div className="flex flex-col md:flex-row items-start gap-4">
                                <div className="w-8 text-xs font-mono font-black text-primary bg-primary/5 rounded-lg h-8 flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                    {/* Tên linh kiện - ĐÃ DISABLE KHÓA KHÔNG CHO SỬA */}
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Tên linh kiện *</label>
                                        <input
                                            type="text"
                                            ref={isFirst ? firstComponentRef : null}
                                            placeholder="Tên linh kiện gốc..."
                                            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-2.5 text-xs font-bold outline-none transition-all disabled:opacity-70 cursor-not-allowed"
                                            value={c.component_name}
                                            disabled={true}
                                        />
                                    </div>

                                    {/* Cách sơn & xử lý */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Cách sơn & xử lý *</label>
                                        <select
                                            className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer ${!isPaintAllowed ? 'bg-surface-container-highest/40 border-outline-variant/40 text-on-surface-variant/50 cursor-not-allowed' : 'bg-surface-container/20 border-outline-variant/60 focus:border-primary focus:bg-white'
                                                }`}
                                            value={isPaintAllowed ? c.paint_id : ''}
                                            disabled={!isPaintAllowed}
                                            onChange={(e) => updateComponent(c.id, { paint_id: e.target.value })}
                                        >
                                            <option value="">{isPaintAllowed ? '-- Chọn loại sơn --' : 'N/A (Cấm sơn)'}</option>
                                            {isPaintAllowed && paints.map(p => (
                                                <option key={p.id} value={p.id}>{p.paint_name}</option>
                                            ))}
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
                                            <option value="">-- Chọn vật tư --</option>
                                            {allowedMaterialsForThisRow.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.material_name} ({m.material_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Độ dày vật tư */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Độ dày vật tư *</label>
                                        <select
                                            className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-xs font-bold outline-none transition-all cursor-pointer ${!c.material_id ? 'bg-surface-container/20 border-outline-variant/60 opacity-40' :
                                                !hasThicknessOptions ? 'bg-amber-500/5 border-amber-500/30 text-amber-800' : 'bg-surface-container/20 border-outline-variant/60 focus:border-primary focus:bg-white'
                                                }`}
                                            disabled={!c.material_id || !hasThicknessOptions}
                                            value={hasThicknessOptions ? c.thickness_id : ''}
                                            onChange={(e) => updateComponent(c.id, { thickness_id: e.target.value })}
                                        >
                                            {!c.material_id ? (
                                                <option value="">Chọn độ dày</option>
                                            ) : !hasThicknessOptions ? (
                                                <option value="">Không có độ dày (N/A)</option>
                                            ) : (
                                                <>
                                                    <option value="">-- Chọn độ dày --</option>
                                                    {currentThicknessOptions.map(t => (
                                                        <option key={t.id} value={t.id}>{t.thickness_value || t.thickness} mm</option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Kích thước 3 chiều */}
                                    <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Dài (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-2 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.length} onChange={(e) => updateComponent(c.id, { length: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Rộng (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-2 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.width} onChange={(e) => updateComponent(c.id, { width: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/70">Cao (mm)</label>
                                            <input type="number" className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-2 py-2.5 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all" value={c.height} onChange={(e) => updateComponent(c.id, { height: e.target.value })} />
                                        </div>
                                    </div>
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
                            <Send className="h-4 w-4" /> Gửi Yêu Cầu Báo Giá Với Admin
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}