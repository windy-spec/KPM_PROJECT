import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Settings, Info } from 'lucide-react';
import { CATEGORY_BLUEPRINTS } from '../../config/categoryBlueprints';
import { materialService } from '../../services/material.service';

const ProductComponentsEditor = ({ value, onChange, categoryId, categories, basePrice, setBasePrice }) => {
  const [components, setComponents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [laborRates, setLaborRates] = useState([]);
  const [suggestedPrice, setSuggestedPrice] = useState(0);

  // Initialize components from value
  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setComponents(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error("Error parsing components JSON", e);
      }
    }
  }, [value]);

  // Fetch materials and labor rates to calculate suggested price
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, laborRes] = await Promise.all([
          materialService.getMaterials(),
          materialService.getLaborRates()
        ]);
        setMaterials(matRes.data?.data || matRes.data || []);
        setLaborRates(laborRes.data?.data || laborRes.data || []);
      } catch (error) {
        console.error("Error fetching pricing data", error);
      }
    };
    fetchData();
  }, []);

  // Determine blueprints based on selected category
  const availableBlueprints = useMemo(() => {
    if (!categoryId || !categories) return [];
    
    // Find the current category
    const currentCat = categories.find(c => (c.id || c._id) === categoryId);
    if (!currentCat) return [];

    // Find root category to get blueprint key (e.g., HangRao, Cua)
    let rootCat = currentCat;
    while (rootCat.parent_id) {
      const parent = categories.find(c => (c.id || c._id) === rootCat.parent_id);
      if (parent) rootCat = parent;
      else break;
    }

    // Attempt to match blueprint key. Typically format is "RootCode-category-code" or similar.
    // For simplicity, let's just check all blueprint keys that include the root code or category code
    const keys = Object.keys(CATEGORY_BLUEPRINTS);
    const matchedKey = keys.find(k => 
      k.toLowerCase().includes(currentCat.category_code?.toLowerCase()) ||
      k.toLowerCase().includes(rootCat.category_code?.toLowerCase())
    );

    if (matchedKey) return CATEGORY_BLUEPRINTS[matchedKey];
    
    // Fallback: If no exact blueprint, extract all unique components to suggest
    const allComponentsMap = new Map();
    Object.values(CATEGORY_BLUEPRINTS).forEach(bpArray => {
      bpArray.forEach(bp => {
        allComponentsMap.set(bp.name, bp);
      });
    });
    return Array.from(allComponentsMap.values());
  }, [categoryId, categories]);

  // Calculate suggested price whenever components change
  useEffect(() => {
    let totalMaterialCost = 0;
    
    components.forEach(comp => {
      if (!comp.length || !comp.width || !comp.default_material) return;
      
      const mat = materials.find(m => m.material_code === comp.default_material);
      if (mat && mat.base_price) {
        // Convert dimension to meters for m2 calculation
        const lM = comp.unit === 'mm' ? comp.length / 1000 : comp.unit === 'cm' ? comp.length / 100 : comp.length;
        const wM = comp.unit === 'mm' ? comp.width / 1000 : comp.unit === 'cm' ? comp.width / 100 : comp.width;
        
        // Approximate area (m2)
        const area = lM * wM;
        totalMaterialCost += area * parseFloat(mat.base_price);
      }
    });

    // Add some basic labor cost estimation (e.g. 30% of material cost)
    const totalLaborCost = totalMaterialCost * 0.3;
    
    setSuggestedPrice(totalMaterialCost + totalLaborCost);
    
    // Notify parent
    onChange(JSON.stringify(components));
  }, [components, materials]);

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        id: Date.now().toString(),
        name: '',
        length: '',
        width: '',
        height: '',
        unit: 'mm',
        default_material: ''
      }
    ]);
  };

  const handleRemoveComponent = (index) => {
    const newComps = [...components];
    newComps.splice(index, 1);
    setComponents(newComps);
  };

  const handleChange = (index, field, val) => {
    const newComps = [...components];
    newComps[index][field] = val;
    setComponents(newComps);
  };

  return (
    <div className="space-y-4">
      {/* Base Price Section */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
        <label className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
          Giá bán gốc (Base Price)
        </label>
        <div className="mt-2">
          <input
            type="number"
            value={basePrice || ""}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="VD: 5000000"
            className="w-full rounded-xl border border-outline-variant/60 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary font-bold text-primary"
          />
        </div>
        {suggestedPrice > 0 && (
          <div className="mt-2 flex items-start gap-2 text-xs text-on-surface-variant/80 bg-white p-3 rounded-lg border border-outline-variant/40">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Giá vốn ước tính:</strong> {suggestedPrice.toLocaleString()} đ (Bao gồm vật tư và nhân công ước lượng). 
              Bạn nên đặt <span className="font-semibold text-primary">Giá bán gốc</span> cao hơn mức này để có lãi.
            </p>
          </div>
        )}
      </div>

      {/* Components Config */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
          Cấu hình linh kiện ({components.length})
        </label>
        <button
          type="button"
          onClick={handleAddComponent}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm linh kiện
        </button>
      </div>

      {components.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded-xl border-outline-variant/60 text-on-surface-variant/60 text-sm">
          Chưa có linh kiện nào được cấu hình.
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((comp, idx) => (
            <div key={comp.id || idx} className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Linh kiện {idx + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(idx)}
                  className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Tên linh kiện</label>
                  <select
                    value={comp.name}
                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">-- Chọn linh kiện --</option>
                    {availableBlueprints.map((bp, i) => (
                      <option key={i} value={bp.name}>{bp.name}</option>
                    ))}
                    {/* Allow fallback to custom name if not in blueprint */}
                    {!availableBlueprints.find(bp => bp.name === comp.name) && comp.name && (
                      <option value={comp.name}>{comp.name}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant">Vật tư mặc định</label>
                  <select
                    value={comp.default_material || ""}
                    onChange={(e) => handleChange(idx, 'default_material', e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">-- Chọn loại vật tư --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.material_code}>
                        {m.material_name} ({m.material_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-on-surface-variant">Dài (L)</label>
                    <input
                      type="number"
                      value={comp.length || ""}
                      onChange={(e) => handleChange(idx, 'length', e.target.value)}
                      placeholder="VD: 2000"
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-on-surface-variant">Rộng (W)</label>
                    <input
                      type="number"
                      value={comp.width || ""}
                      onChange={(e) => handleChange(idx, 'width', e.target.value)}
                      placeholder="VD: 1000"
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-on-surface-variant">Cao (H)</label>
                    <input
                      type="number"
                      value={comp.height || ""}
                      onChange={(e) => handleChange(idx, 'height', e.target.value)}
                      placeholder="VD: 750"
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-on-surface-variant">Đơn vị</label>
                    <select
                      value={comp.unit || "mm"}
                      onChange={(e) => handleChange(idx, 'unit', e.target.value)}
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductComponentsEditor;
