import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash, Trash2, Maximize, X, Save, Image as ImageIcon, Lock, Unlock, Loader2 } from "lucide-react";
import adminService from "../../services/admin.service";
import apiClient from "../../services/apiClient";
import { toast } from "react-toastify";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";

const ManageDrawings = () => {
  const [products, setProducts] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [editingDrawingId, setEditingDrawingId] = useState(null);
  const [drawingName, setDrawingName] = useState("");
  const [scaleRatio, setScaleRatio] = useState("1:100");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [blueprintImageUrl, setBlueprintImageUrl] = useState("");
  const [parts, setParts] = useState([]);

  // Canvas State
  const [canvasItems, setCanvasItems] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [activeCanvasItemId, setActiveCanvasItemId] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await apiClient.get('/component-templates');
      setTemplates(res.data?.data || []);
    } catch (e) {
      console.warn("Lỗi tải templates", e);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      loadDrawings(selectedProduct);
    } else {
      setDrawings([]);
      setShowForm(false);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getProducts({ page: 1, limit: 100 });
      setProducts(res.data?.data || []);
    } catch (e) {
      console.warn("Lỗi tải sản phẩm", e);
    } finally {
      setLoading(false);
    }
  };

  const loadDrawings = async (productId) => {
    try {
      const res = await adminService.getDrawingsByProduct(productId);
      setDrawings(res.data?.data || []);
    } catch (e) {
      console.warn("Lỗi tải bản vẽ", e);
    }
  };

  const handleOpenAddForm = () => {
    const product = products.find((p) => p.id === selectedProduct);
    setEditingDrawingId(null);
    setCanvasItems([]);
    setMainImageUrl("");
    setBlueprintImageUrl("");

    if (product) {
      setDrawingName(`Bản vẽ ${product.product_name || ""}`);
      let autoMappedParts = [];
      if (product.components) {
        let compArray = [];
        try {
          compArray = typeof product.components === "string" ? JSON.parse(product.components) : product.components;
        } catch (error) {
          console.error("Lỗi parse components:", error);
        }

        if (Array.isArray(compArray)) {
          autoMappedParts = compArray.map((comp) => {
            const tmpl = templates.find(t => t.component_name === (comp.component_name || comp.name));
            return {
              component_name: comp.component_name || comp.name || "",
              material_category: tmpl?.category_code || comp.category_code || comp.component_name || comp.name || "Khung/Vỏ",
              part_image_url: comp.drawing_image_url || tmpl?.drawing_image_url || "", 
            };
          });
        }
      }
      setParts(autoMappedParts);
    } else {
      setParts([]);
    }

    setShowForm(true);
  };

  const handleEditDrawing = (drawing) => {
    setEditingDrawingId(drawing.id);
    setDrawingName(drawing.drawing_name || "");
    setScaleRatio(drawing.scale_ratio || "1:100");
    setMainImageUrl(drawing.main_image_url || "");
    setBlueprintImageUrl(drawing.blueprint_image_url || "");
    
    const loadedParts = drawing.drawing_parts?.map(part => ({
      ...part,
      part_image_url: part.part_image_url || ""
    })) || [];
    setParts(loadedParts);
    setCanvasItems([]); // Reset canvas for new editing session
    setShowForm(true);
  };

  const handleDeleteDrawing = async (drawingId) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá bản vẽ này không?")) {
      try {
        await adminService.deleteDrawing(drawingId);
        toast.success("Xoá bản vẽ thành công!");
        loadDrawings(selectedProduct);
      } catch (e) {
        toast.error("Lỗi khi xoá bản vẽ.");
      }
    }
  };

  const handleUploadImage = async (e, setUrlCallback) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await apiClient.post("/ai/upload-drawing", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.imageUrl || res.data?.imageUrl || res.data;
      if (url && typeof url === 'string') {
        setUrlCallback(url);
      }
    } catch (error) {
      toast.error("Upload ảnh thất bại");
    }
  };

  const handleAddPart = () => {
    setParts([...parts, { component_name: "", material_category: "", part_image_url: "" }]);
  };

  const handleRemovePart = (index) => {
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
  };

  // Canvas Logic
  const bringToFront = (id) => {
    setActiveCanvasItemId(id);
    setCanvasItems(prev => {
      const currentMaxZ = Math.max(0, ...prev.map(i => i.zIndex || 0));
      return prev.map(item => 
        item.id === id ? { ...item, zIndex: currentMaxZ + 1 } : item
      );
    });
  };

  const handleAddToCanvas = (part) => {
    if (!part.part_image_url) {
      toast.warning("Vui lòng upload ảnh cho linh kiện này trước khi đưa vào Canvas!");
      return;
    }

    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const MAX_SIZE = 300;
      
      if (w > MAX_SIZE || h > MAX_SIZE) {
        if (w > h) {
          h = (h / w) * MAX_SIZE;
          w = MAX_SIZE;
        } else {
          w = (w / h) * MAX_SIZE;
          h = MAX_SIZE;
        }
      } else if (w < 50 && h < 50) {
        w = 100;
        h = 100;
      }

      setCanvasItems(prev => {
        const offset = (prev.length % 10) * 30;
        const currentMaxZ = Math.max(0, ...prev.map(i => i.zIndex || 0));
        
        const newItem = {
          id: Date.now().toString() + Math.random().toString(),
          part_image_url: part.part_image_url,
          x: 50 + offset,
          y: 50 + offset,
          width: w,
          height: h,
          zIndex: currentMaxZ + 1,
        };
        return [...prev, newItem];
      });
    };
    img.onerror = () => {
        setCanvasItems(prev => {
            const offset = (prev.length % 10) * 30;
            const currentMaxZ = Math.max(0, ...prev.map(i => i.zIndex || 0));
            return [...prev, {
                id: Date.now().toString() + Math.random().toString(),
                part_image_url: part.part_image_url,
                x: 50 + offset, y: 50 + offset, width: 150, height: 150, zIndex: currentMaxZ + 1,
            }];
        });
    };
    img.src = part.part_image_url;
  };

  const handleRemoveCanvasItem = (id) => {
    setCanvasItems(canvasItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.warning("Vui lòng chọn sản phẩm trước");
    if (!drawingName) return toast.warning("Vui lòng nhập tên bản vẽ");
    
    setCapturing(true);
    setActiveCanvasItemId(null); // Bỏ focus để ẩn viền resize

    setTimeout(async () => {
      try {
        let finalMainImageUrl = mainImageUrl;
        
        // Nếu có canvas item, ưu tiên chụp canvas làm ảnh chính
        if (canvasRef.current && canvasItems.length > 0) {
          const canvas = await html2canvas(canvasRef.current, { backgroundColor: null });
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          const file = new File([blob], 'master_drawing.png', { type: 'image/png' });
          const formData = new FormData();
          formData.append("image", file);

          const res = await apiClient.post("/ai/upload-drawing", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const url = res.data?.data?.imageUrl || res.data?.imageUrl || res.data;
          if (url && typeof url === 'string') {
            finalMainImageUrl = url;
          }
        }

        if (!finalMainImageUrl) {
           toast.error("Vui lòng xếp linh kiện vào Canvas hoặc upload Ảnh Tổng Thể!");
           setCapturing(false);
           return;
        }

        const payload = {
          product_id: selectedProduct,
          drawing_name: drawingName,
          scale_ratio: scaleRatio,
          main_image_url: finalMainImageUrl,
          blueprint_image_url: blueprintImageUrl,
          parts,
        };

        if (editingDrawingId) {
          await adminService.updateDrawing(editingDrawingId, payload);
          toast.success("Cập nhật bản vẽ thành công!");
        } else {
          await adminService.createDrawing(payload);
          toast.success("Tạo bản vẽ thành công!");
        }

        setShowForm(false);
        resetForm();
        loadDrawings(selectedProduct);
      } catch (error) {
        toast.error("Lỗi lưu bản vẽ: " + error.message);
      } finally {
        setCapturing(false);
      }
    }, 300);
  };

  const resetForm = () => {
    setDrawingName("");
    setScaleRatio("1:100");
    setMainImageUrl("");
    setBlueprintImageUrl("");
    setParts([]);
    setCanvasItems([]);
    setEditingDrawingId(null);
  };

  return (
    <div className="p-6 bg-surface-container/10 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-on-surface">
          Quản lý Bản Vẽ Sản Phẩm
        </h3>
        {selectedProduct && !showForm && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" /> Thêm Bản Vẽ
          </button>
        )}
      </div>

      {!showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/60 p-5 mb-6">
          <label className="block text-sm font-bold text-on-surface mb-2">
            Chọn sản phẩm để quản lý bản vẽ:
          </label>
          <select
            className="w-full md:w-1/2 p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary font-medium"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">-- Chọn Sản Phẩm --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_code} - {p.name || p.product_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!showForm && selectedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drawings.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-outline-variant">
              <p className="text-on-surface-variant font-semibold">
                Chưa có bản vẽ nào cho sản phẩm này.
              </p>
            </div>
          ) : (
            drawings.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col group relative"
              >
                <div className="absolute top-3 right-3 hidden group-hover:flex gap-2">
                  <button onClick={() => handleEditDrawing(d)} className="p-2 bg-white rounded-lg shadow border border-outline-variant hover:text-primary transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteDrawing(d.id)} className="p-2 bg-white rounded-lg shadow border border-outline-variant hover:text-rose-500 transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 border-b bg-surface-container/20 flex justify-between items-center">
                  <h4 className="font-black text-lg text-primary pr-20">
                    {d.drawing_name}
                  </h4>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                    Tỷ lệ: {d.scale_ratio}
                  </span>
                </div>
                <div className="p-4 flex flex-col xl:flex-row gap-4 h-full">
                  <div className="w-full xl:w-2/5 flex items-center justify-center bg-[#f8f9fa] border border-dashed border-outline-variant/60 rounded-lg p-2 min-h-[200px]">
                    <img
                      src={d.main_image_url}
                      alt="Main"
                      className="w-full h-full object-contain max-h-[250px] rounded"
                    />
                  </div>
                  <div className="w-full xl:w-3/5">
                    <h5 className="font-bold text-sm mb-3 text-on-surface flex items-center gap-2 border-b pb-2">
                      <ImageIcon className="w-4 h-4 text-primary" /> Bóc tách
                      linh kiện ({d.drawing_parts?.length || 0})
                    </h5>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {d.drawing_parts?.map((part) => (
                        <div
                          key={part.id}
                          className="flex items-center gap-3 p-2 bg-surface-container/20 rounded-lg border border-outline-variant/40 hover:border-primary/50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded overflow-hidden border bg-white flex shrink-0 items-center justify-center">
                            <img
                              src={part.part_image_url || "/placeholder.png"}
                              className="w-full h-full object-contain"
                              alt="part"
                            />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-on-surface">
                              {part.component_name}
                            </p>
                            <span className="inline-block mt-1 bg-white border border-primary/20 text-[10px] text-primary font-bold px-2 py-0.5 rounded shadow-sm">
                              {part.material_category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FORM TẠO/SỬA BẢN VẼ (CANVAS BUILDER) */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-outline-variant flex flex-col animate-in fade-in duration-200 min-h-[90vh]">
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h4 className="text-xl font-black text-on-surface">
                {editingDrawingId ? "Sửa Bản Vẽ" : "Tạo Bản Vẽ Mới"}
              </h4>
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={capturing}
                className="px-6 py-2 rounded-lg font-black uppercase text-sm tracking-wide text-white bg-primary hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {capturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {capturing ? "Đang xử lý..." : "Lưu Bản Vẽ"}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* CỘT TRÁI: DANH SÁCH LINH KIỆN */}
            <div className="w-full lg:w-1/3 flex flex-col border-r border-outline-variant/60 bg-surface-container/5 overflow-hidden">
              <div className="p-4 border-b bg-white space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">Tên Bản Vẽ</label>
                    <input
                      type="text"
                      required
                      value={drawingName}
                      onChange={(e) => setDrawingName(e.target.value)}
                      className="w-full p-2 border border-outline-variant rounded-md text-sm outline-none focus:border-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1">Tỷ lệ</label>
                    <input
                      type="text"
                      value={scaleRatio}
                      onChange={(e) => setScaleRatio(e.target.value)}
                      className="w-full p-2 border border-outline-variant rounded-md text-sm outline-none focus:border-primary font-bold"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-3">
                  <div className="bg-surface-container/20 p-2 border border-outline-variant/50 rounded-lg">
                    <label className="block text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant/80 mb-1">Ảnh Tổng Thể 3D</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, setMainImageUrl)}
                      className="block w-full text-[10px] text-on-surface-variant file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors"
                    />
                    {mainImageUrl && (
                      <div className="mt-2 relative w-full h-20 rounded-lg overflow-hidden border border-outline-variant/60">
                        <img src={mainImageUrl} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                        <button type="button" onClick={() => setMainImageUrl("")} className="absolute top-1 right-1 bg-rose-500/90 text-white p-1 rounded-md hover:bg-rose-600 transition-colors shadow-sm">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container/20 p-2 border border-outline-variant/50 rounded-lg">
                    <label className="block text-[9px] font-black uppercase tracking-[0.1em] text-on-surface-variant/80 mb-1">Bản Vẽ Nét Đứt</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, setBlueprintImageUrl)}
                      className="block w-full text-[10px] text-on-surface-variant file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors"
                    />
                    {blueprintImageUrl && (
                      <div className="mt-2 relative w-full h-20 rounded-lg overflow-hidden border border-outline-variant/60">
                        <img src={blueprintImageUrl} alt="Blueprint Preview" className="w-full h-full object-contain bg-slate-50" />
                        <button type="button" onClick={() => setBlueprintImageUrl("")} className="absolute top-1 right-1 bg-rose-500/90 text-white p-1 rounded-md hover:bg-rose-600 transition-colors shadow-sm">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <h5 className="font-black text-sm uppercase text-primary">
                    Bóc tách Linh Kiện
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="flex items-center gap-1 text-xs font-bold bg-white border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-container transition-all"
                  >
                    <Plus className="w-3 h-3" /> Thêm
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {parts.map((part, index) => (
                  <div key={index} className="bg-white border border-outline-variant/80 rounded-lg p-3 shadow-sm relative group">
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="absolute top-2 right-2 text-on-surface-variant hover:text-rose-500 bg-surface-container/50 hover:bg-rose-50 p-1 rounded transition-colors"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="grid grid-cols-1 gap-2 mb-3 pr-6">
                      <input
                        type="text"
                        value={part.component_name}
                        onChange={(e) => handlePartChange(index, "component_name", e.target.value)}
                        className="w-full p-1.5 border-b border-outline-variant/40 bg-transparent text-sm focus:border-primary outline-none font-bold"
                        placeholder="Tên linh kiện"
                      />
                      <input
                        type="text"
                        value={part.material_category}
                        onChange={(e) => handlePartChange(index, "material_category", e.target.value)}
                        className="w-full p-1.5 border-b border-outline-variant/40 bg-transparent text-xs focus:border-primary outline-none text-on-surface-variant"
                        placeholder="Hạng mục vật tư"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 shrink-0 bg-surface-container/20 border border-dashed border-outline-variant rounded flex items-center justify-center overflow-hidden">
                        {part.part_image_url ? (
                          <img src={part.part_image_url} alt="part" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="text-outline-variant/50 w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="file"
                          onChange={(e) => handleUploadImage(e, (url) => handlePartChange(index, "part_image_url", url))}
                          className="block w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer"
                          accept="image/*"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleAddToCanvas(part)}
                          className="text-xs font-bold bg-primary text-white py-1.5 rounded hover:bg-primary/90 flex justify-center items-center gap-1 shadow-sm"
                        >
                          Đưa vào Canvas
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {parts.length === 0 && (
                  <div className="text-center p-6 text-sm text-on-surface-variant/70 border-2 border-dashed border-outline-variant rounded-lg">
                    Chưa có linh kiện. Hãy "Thêm" linh kiện.
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI: CANVAS BUILDER */}
            <div className="w-full lg:w-2/3 flex flex-col bg-[#f0f2f5] relative overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                 <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-outline-variant/50 shadow-sm text-xs font-bold text-on-surface">
                   Canvas Builder
                 </div>
                 {canvasItems.length === 0 && (
                    <div className="bg-amber-50/80 backdrop-blur text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm text-xs font-semibold">
                      Kéo thả, thay đổi kích thước linh kiện để tạo ảnh ghép.
                    </div>
                 )}
              </div>
              
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm border border-outline-variant/50">
                 <div className="text-[11px] font-bold text-on-surface-variant px-2">Ảnh tải lên tự do (Nền):</div>
                 <input
                  type="file"
                  onChange={(e) => handleUploadImage(e, setMainImageUrl)}
                  className="block w-48 text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer"
                  accept="image/*"
                />
              </div>

              {/* VÙNG CANVAS */}
              <div 
                className="flex-1 w-full h-full overflow-auto p-12 flex justify-center items-center bg-surface-container/5"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setActiveCanvasItemId(null);
                }}
              >
                <div 
                  ref={canvasRef}
                  className="relative bg-white shadow-xl border border-outline-variant/30"
                  style={{ width: '800px', height: '600px', backgroundImage: mainImageUrl ? `url(${mainImageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setActiveCanvasItemId(null);
                  }}
                >
                  {!mainImageUrl && canvasItems.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 border-2 border-dashed border-outline-variant/30 m-4 rounded-xl pointer-events-none">
                      Vùng thiết kế bản vẽ tổng thể (800x600)
                    </div>
                  )}

                  {canvasItems.map((item) => (
                    <Rnd
                      key={item.id}
                      size={{ width: item.width, height: item.height }}
                      position={{ x: item.x, y: item.y }}
                      onDragStop={(e, d) => {
                        setCanvasItems(prev => prev.map(i => i.id === item.id ? { ...i, x: d.x, y: d.y } : i));
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        setCanvasItems(prev => prev.map(i => i.id === item.id ? { 
                          ...i, 
                          width: ref.offsetWidth, 
                          height: ref.offsetHeight, 
                          ...position 
                        } : i));
                      }}
                      bounds="parent"
                      lockAspectRatio={item.aspectLocked !== false}
                      onDragStart={() => bringToFront(item.id)}
                      onResizeStart={() => bringToFront(item.id)}
                      onMouseDown={() => bringToFront(item.id)}
                      style={{ zIndex: item.zIndex || 1 }}
                      className={activeCanvasItemId === item.id && !capturing ? "border-2 border-primary border-dashed !z-[9999]" : ""}
                    >
                      <div className="w-full h-full relative group">
                        <img src={item.part_image_url} className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm" alt="part in canvas" />
                        
                        {activeCanvasItemId === item.id && !capturing && (
                          <>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveCanvasItem(item.id); }}
                              className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-lg hover:bg-rose-600 z-50 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCanvasItems(prev => prev.map(i => i.id === item.id ? { ...i, aspectLocked: i.aspectLocked === false ? true : false } : i));
                              }}
                              className="absolute -bottom-3 -right-3 bg-slate-800 text-white rounded-full p-1.5 shadow-lg hover:bg-slate-900 z-50 cursor-pointer"
                              title={item.aspectLocked === false ? "Đang Mở khóa (Kéo tự do) - Bấm để Khóa" : "Đang Khóa tỷ lệ - Bấm để Mở"}
                            >
                              {item.aspectLocked === false ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-white" />}
                            </button>
                          </>
                        )}
                      </div>
                    </Rnd>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrawings;
