const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/admin/ManageMaterials.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update normalizeMaterial
content = content.replace(
  /const normalizeMaterial = \(item\) => \(\{[\s\S]*?\}\);/,
  `const normalizeMaterial = (item) => ({
  id: item.id,
  type_id: item.type_id || "",
  unit_id: item.unit_id || "",
  material_code: item.material_code || "",
  material_name: item.material_name || "",
  base_price: Number(item.base_price ?? 0),
  type_name: item.material_types?.type_name || "-",
  unit_name: item.material_units?.unit_name || "-",
  thicknesses: item.material_thickness || [],
});`
);

// 2. Replace MaterialModal
const modalReplacement = `function MaterialModal({
  initial,
  materialTypes,
  materialUnits,
  loading,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState({
    type_id: initial?.type_id || "",
    unit_id: initial?.unit_id || "",
    material_code: initial?.material_code || "",
    material_name: initial?.material_name || "",
    base_price: initial?.base_price ?? "",
  });
  const [thicknesses, setThicknesses] = useState(initial?.thicknesses || []);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setForm({
      type_id: initial?.type_id || "",
      unit_id: initial?.unit_id || "",
      material_code: initial?.material_code || "",
      material_name: initial?.material_name || "",
      base_price: initial?.base_price ?? "",
    });
    setThicknesses(initial?.thicknesses || []);
    setTouched(false);
  }, [initial]);

  const priceValue = form.base_price === "" ? "" : Number(form.base_price);
  const hasNegativePrice =
    form.base_price !== "" && !Number.isNaN(priceValue) && priceValue < 0;
  const hasInvalidPrice = form.base_price !== "" && Number.isNaN(priceValue);
  
  const hasInvalidThickness = thicknesses.some(t => !t.thickness_value.trim() || Number.isNaN(Number(t.price_multiplier)) || Number(t.price_multiplier) < 0);

  const canSubmit =
    !!form.type_id &&
    !!form.unit_id &&
    form.material_code.trim() &&
    form.material_name.trim() &&
    form.base_price !== "" &&
    !hasNegativePrice &&
    !hasInvalidPrice &&
    !hasInvalidThickness &&
    !loading;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSave({
      ...form,
      material_code: form.material_code.trim(),
      material_name: form.material_name.trim(),
      base_price: Number(form.base_price),
      thicknesses: thicknesses
    });
  };

  const addThickness = () => {
    setThicknesses([...thicknesses, { thickness_value: "", price_multiplier: 1.00 }]);
  };

  const updateThickness = (idx, field, value) => {
    const newT = [...thicknesses];
    newT[idx][field] = value;
    setThicknesses(newT);
  };

  const removeThickness = (idx) => {
    const newT = [...thicknesses];
    newT.splice(idx, 1);
    setThicknesses(newT);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] max-h-[90vh] flex flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5 shrink-0">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                {initial?.id ? "Sửa vật tư" : "Thêm vật tư mới"}
              </h3>
              <p className="mt-2 text-xs text-on-surface-variant/70">
                Quản lý master data vật tư thô và cấu hình độ dày.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5 shrink">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Loại vật tư
                </label>
                <select
                  value={form.type_id}
                  onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">Chọn loại vật tư</option>
                  {materialTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.type_name}
                    </option>
                  ))}
                </select>
                {touched && !form.type_id ? (
                  <p className="text-xs text-rose-600">
                    Bắt buộc chọn loại vật tư.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Đơn vị tính
                </label>
                <select
                  value={form.unit_id}
                  onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">Chọn đơn vị tính</option>
                  {materialUnits.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.unit_name}
                    </option>
                  ))}
                </select>
                {touched && !form.unit_id ? (
                  <p className="text-xs text-rose-600">
                    Bắt buộc chọn đơn vị tính.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Mã vật tư
                </label>
                <input
                  value={form.material_code}
                  onChange={(e) =>
                    setForm({ ...form, material_code: e.target.value })
                  }
                  placeholder="VD: VT-THEP-4080"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
                {touched && !form.material_code.trim() ? (
                  <p className="text-xs text-rose-600">
                    Mã vật tư không được để trống.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Tên vật tư
                </label>
                <input
                  value={form.material_name}
                  onChange={(e) =>
                    setForm({ ...form, material_name: e.target.value })
                  }
                  placeholder="VD: Thép hộp mạ kẽm"
                  className="w-full rounded-xl border border-outline-variant/60 bg-surface-container/20 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
                {touched && !form.material_name.trim() ? (
                  <p className="text-xs text-rose-600">
                    Tên vật tư không được để trống.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Giá gốc / Đơn vị (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.base_price}
                  onChange={(e) =>
                    setForm({ ...form, base_price: e.target.value })
                  }
                  placeholder="VD: 125000"
                  className={\`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors \${hasNegativePrice
                      ? "border-rose-500 bg-rose-50 focus:border-rose-500"
                      : "border-outline-variant/60 bg-surface-container/20 focus:border-primary"
                    }\`}
                />
                {hasNegativePrice ? (
                  <p className="text-xs text-rose-600">Giá gốc không được âm.</p>
                ) : touched && hasInvalidPrice ? (
                  <p className="text-xs text-rose-600">
                    Vui lòng nhập giá hợp lệ.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Thickness Config */}
            <div className="mt-6 pt-6 border-t border-outline-variant/50">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                  Cấu hình Độ Dày (Tuỳ chọn)
                </label>
                <button type="button" onClick={addThickness} className="text-xs font-bold text-primary hover:underline">
                  + Thêm độ dày
                </button>
              </div>

              {thicknesses.length === 0 ? (
                <div className="text-sm text-on-surface-variant/50 italic text-center py-4 bg-surface-container/10 rounded-xl border border-dashed border-outline-variant/60">
                  Vật tư này không quản lý theo độ dày.
                </div>
              ) : (
                <div className="space-y-3">
                  {thicknesses.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-surface-container/20 p-3 rounded-xl border border-outline-variant/60">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-on-surface-variant/70 uppercase">Độ dày (VD: 0.4)</label>
                        <input
                          value={t.thickness_value}
                          onChange={(e) => updateThickness(idx, 'thickness_value', e.target.value)}
                          placeholder="0.4"
                          className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-on-surface-variant/70 uppercase">Hệ số giá (x)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={t.price_multiplier}
                          onChange={(e) => updateThickness(idx, 'price_multiplier', e.target.value)}
                          placeholder="1.00"
                          className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="mt-5">
                        <button type="button" onClick={() => removeThickness(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {touched && hasInvalidThickness && (
                    <p className="text-xs text-rose-600">Vui lòng điền đầy đủ độ dày và hệ số giá hợp lệ.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-outline-variant/60 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-busy={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading
                ? "Đang lưu..."
                : initial?.id
                  ? "Cập nhật vật tư"
                  : "Lưu vật tư"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}`;

content = content.replace(/function MaterialModal\(\{[\s\S]*?\}\s*\{[\s\S]*?\}\s*\n\s*\n\s*const ManageMaterials/m, modalReplacement + '\n\nconst ManageMaterials');

// 3. Update the handleSave in ManageMaterials to pass thicknesses
content = content.replace(
  /const payload = \{\n\s*type_id: form\.type_id,\n\s*unit_id: form\.unit_id,\n\s*material_code: form\.material_code,\n\s*material_name: form\.material_name,\n\s*base_price: form\.base_price,\n\s*\};/,
  `const payload = {
        type_id: form.type_id,
        unit_id: form.unit_id,
        material_code: form.material_code,
        material_name: form.material_name,
        base_price: form.base_price,
        thicknesses: form.thicknesses,
      };`
);

// 4. Update the table to show thickness count
content = content.replace(
  /<td className="p-4 text-on-surface-variant\/80">\s*\{item\.unit_name\}\s*<\/td>/,
  `<td className="p-4 text-on-surface-variant/80">
                    {item.unit_name}
                  </td>
                  <td className="p-4 text-on-surface-variant/80 text-xs font-semibold">
                    {item.thicknesses?.length > 0 ? (
                       <span className="text-primary">{item.thicknesses.length} loại</span>
                    ) : "-"}
                  </td>`
);

content = content.replace(
  /<th className="p-4">Đơn vị tính<\/th>/,
  `<th className="p-4">Đơn vị tính</th>
                <th className="p-4 w-[100px]">Độ dày</th>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated ManageMaterials.jsx successfully.");
