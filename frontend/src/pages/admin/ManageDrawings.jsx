import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash, Trash2, Save, Image as ImageIcon, Loader2, Code, Edit } from "lucide-react";
import adminService from "../../services/admin.service";
import apiClient from "../../services/apiClient";
import { toast } from "react-toastify";
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
  const [htmlCode, setHtmlCode] = useState("");
  const [parts, setParts] = useState([]);

  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState({ current: 0, total: 0 });
  const previewRef = useRef(null);

  const cleanHtmlCode = (html) => {
    if (!html) return "";
    return html
      .replace(/bottom:\s*40px;?/g, "bottom: 15px;")
      .replace(/oklab\([^)]+\)/gi, "rgba(0,0,0,0)")
      .replace(/oklch\([^)]+\)/gi, "rgba(0,0,0,0)")
      .replace(/color\([^)]+\)/gi, "rgba(0,0,0,0)");
  };

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

  const handleOpenAddForm = (productParam) => {
    const product = productParam || products.find((p) => p.id === selectedProduct);
    if (product) setSelectedProduct(product.id);
    setEditingDrawingId(null);
    setMainImageUrl("");
    setHtmlCode("");

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
              part_blueprint_image_url: "",
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

  const handleEditDrawing = async (drawing, productId) => {
    if (productId) setSelectedProduct(productId);
    setEditingDrawingId(drawing.id);
    setDrawingName(drawing.drawing_name || "");
    setScaleRatio(drawing.scale_ratio || "1:100");
    setMainImageUrl(drawing.main_image_url || "");
    setHtmlCode(drawing.html_code || "");
    
    // Gọi API để lấy đầy đủ chi tiết bản vẽ (bao gồm drawing_parts)
    try {
      const res = await adminService.getDrawingsByProduct(productId);
      const fullDrawing = res.data?.data?.find(d => d.id === drawing.id) || drawing;
      
      let loadedParts = fullDrawing.drawing_parts?.map(part => ({
        ...part,
        part_image_url: part.part_image_url || "",
        part_blueprint_image_url: part.part_blueprint_image_url || ""
      })) || [];

      // Auto-recover parts from product.components if DB parts were accidentally wiped
      if (loadedParts.length === 0) {
        const product = products.find((p) => p.id === productId);
        if (product && product.components) {
          let compArray = [];
          try {
            compArray = typeof product.components === "string" ? JSON.parse(product.components) : product.components;
          } catch (error) {
            console.error("Lỗi parse components:", error);
          }
          if (Array.isArray(compArray)) {
            loadedParts = compArray.map((comp) => {
              const tmpl = templates.find(t => t.component_name === (comp.component_name || comp.name));
              return {
                component_name: comp.component_name || comp.name || "",
                material_category: tmpl?.category_code || comp.category_code || comp.component_name || comp.name || "Khung/Vỏ",
                part_image_url: comp.drawing_image_url || tmpl?.drawing_image_url || "", 
                part_blueprint_image_url: comp.blueprint_image_url || tmpl?.blueprint_image_url || "",
              };
            });
          }
        }
      }

      setParts(loadedParts);
    } catch (e) {
      console.error(e);
      setParts([]);
    }
    
    setShowForm(true);
  };

  const handleDeleteDrawing = async (drawingId) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá bản vẽ này không?")) {
      try {
        await adminService.deleteDrawing(drawingId);
        toast.success("Xoá bản vẽ thành công!");
        loadDrawings(selectedProduct);
        loadProducts();
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

  const handleHtmlCodeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleAddPart = () => {
    setParts([...parts, { component_name: "", material_category: "", part_image_url: "", part_blueprint_image_url: "" }]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error("Vui lòng chọn sản phẩm");
    if (!drawingName.trim()) return toast.error("Vui lòng nhập tên bản vẽ");
    if (!htmlCode.trim() && !mainImageUrl) return toast.error("Vui lòng cung cấp ảnh 3D tĩnh hoặc mã HTML bản vẽ tổng thể");

    setCapturing(true);

    try {
      let finalMainImageUrl = mainImageUrl;
      
      const payload = {
        product_id: selectedProduct,
        drawing_name: drawingName,
        scale_ratio: scaleRatio,
        main_image_url: finalMainImageUrl,
        html_code: htmlCode,
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
      loadProducts();
    } catch (error) {
      toast.error("Lỗi lưu bản vẽ: " + error.message);
    } finally {
      setCapturing(false);
    }
  };

  const resetForm = () => {
    setDrawingName("");
    setScaleRatio("1:100");
    setMainImageUrl("");
    setHtmlCode("");
    setParts([]);
    setEditingDrawingId(null);
  };

  return (
    <div className="p-6 bg-surface-container/10 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-on-surface flex items-center gap-4">
          Quản lý Bản Vẽ Sản Phẩm
        </h3>
      </div>

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {products.map((p) => {
            const drawing = p.product_drawings?.[0];
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col group relative"
              >
                <div className="p-4 border-b bg-surface-container/10 flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[15px] text-primary truncate" title={`${p.product_code} - ${p.product_name}`}>
                      {p.product_code} - {p.product_name}
                    </h4>
                    {drawing && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
                        Tỷ lệ: {drawing.scale_ratio || "1:100"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {drawing ? (
                      <>
                        <button onClick={() => handleEditDrawing(drawing, p.id)} className="p-2 bg-white rounded-lg border border-outline-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1 text-xs font-bold shadow-sm" title="Sửa bản vẽ">
                          <Edit className="w-3.5 h-3.5" /> Sửa
                        </button>
                        <button onClick={() => handleDeleteDrawing(drawing.id)} className="p-2 bg-white rounded-lg border border-outline-variant hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm" title="Xóa">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleOpenAddForm(p)} className="p-2 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-colors flex items-center gap-1 text-xs font-bold shadow-sm" title="Tạo bản vẽ">
                        <Plus className="w-3.5 h-3.5" /> Tạo mới
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 flex flex-col h-full bg-[#f8f9fa]">
                  <div className="w-full aspect-[5/4] flex items-center justify-center border-2 border-dashed border-outline-variant/60 rounded-xl bg-white relative overflow-hidden group-hover:border-primary/50 transition-colors shadow-2xs">
                    {drawing && drawing.main_image_url ? (
                       <img
                         src={drawing.main_image_url}
                         alt="Main"
                         className="absolute inset-0 w-full h-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                       />
                    ) : drawing && drawing.html_code ? (
                       <div className="w-[800px] h-[600px] absolute origin-center transform scale-[0.4] flex items-center justify-center pointer-events-none transition-transform duration-500 group-hover:scale-[0.45]">
                         <iframe
                           srcDoc={cleanHtmlCode(drawing.html_code)}
                           className="w-full h-full border-none bg-transparent"
                           title="Preview 3D"
                         />
                       </div>
                    ) : (
                       <div className="flex flex-col items-center justify-center text-outline-variant">
                          <ImageIcon className="w-12 h-12 mb-3 text-outline-variant/40" />
                          <p className="font-bold text-sm text-on-surface-variant/50">Chưa có bản vẽ tổng thể</p>
                       </div>
                    )}
                  </div>
                  {drawing && drawing.drawing_parts && drawing.drawing_parts.length > 0 && (
                    <div className="mt-4 text-xs font-bold text-on-surface-variant/70 border-t border-outline-variant/40 pt-3 flex items-center justify-between">
                      <span>Bao gồm linh kiện chi tiết:</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{drawing.drawing_parts.length} mục</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
             <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed border-outline-variant">
               <p className="text-on-surface-variant font-semibold">
                 Không tìm thấy sản phẩm nào.
               </p>
             </div>
          )}
        </div>
      )}

      {/* FORM TẠO/SỬA BẢN VẼ */}
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
            {/* CỘT TRÁI: NHẬP LIỆU */}
            <div className="w-full lg:w-1/3 flex flex-col border-r border-outline-variant/60 bg-surface-container/5 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-4">
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
                
                <div className="border-t border-outline-variant/30 pt-4">
                  <div className="bg-surface-container/20 p-4 border border-outline-variant/50 rounded-lg">
                    <label className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-primary mb-2">
                      <Code className="w-4 h-4" /> Code HTML 3D Tổng Thể
                    </label>
                    <input
                      type="file"
                      accept=".html"
                      onChange={handleHtmlCodeUpload}
                      className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors border border-dashed border-outline-variant p-2 bg-white"
                    />
                    <p className="text-[10px] text-on-surface-variant/70 mt-2 font-medium">Tải lên file HTML (được AI sinh ra) chứa mô hình 3D cho toàn bộ sản phẩm.</p>
                  </div>
                </div>

                <div className="border-t border-outline-variant/30 pt-4">
                  <div className="bg-surface-container/20 p-4 border border-outline-variant/50 rounded-lg">
                     <label className="block text-xs font-black uppercase tracking-[0.1em] text-on-surface-variant/80 mb-2">
                       Ảnh Tĩnh 3D (Tùy chọn)
                     </label>
                     <p className="text-[10px] text-on-surface-variant/70 mb-2 font-medium">
                       Nếu không tải lên, hệ thống sẽ tự động chụp lại từ Code HTML.
                     </p>
                     <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e, setMainImageUrl)}
                      className="block w-full text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer transition-colors"
                    />
                    {mainImageUrl && (
                      <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-outline-variant/60">
                        <img src={mainImageUrl} alt="Preview" className="w-full h-full object-contain bg-slate-50" />
                        <button type="button" onClick={() => setMainImageUrl("")} className="absolute top-1 right-1 bg-rose-500/90 text-white p-1 rounded-md hover:bg-rose-600 transition-colors shadow-sm">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <h5 className="font-black text-sm uppercase text-primary">
                    Danh Sách Ảnh Linh Kiện
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="flex items-center gap-1 text-xs font-bold bg-white border border-outline-variant px-3 py-1.5 rounded hover:bg-surface-container transition-all shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Thêm
                  </button>
                </div>
                
                <div className="space-y-4">
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

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 shrink-0 bg-surface-container/20 border border-dashed border-outline-variant rounded flex items-center justify-center overflow-hidden">
                            {part.part_blueprint_image_url ? (
                              <img src={part.part_blueprint_image_url} alt="part" className="w-full h-full object-contain bg-white" />
                            ) : (
                              <ImageIcon className="text-outline-variant/50 w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Ảnh Nét Đứt</label>
                            <input
                              type="file"
                              onChange={(e) => handleUploadImage(e, (url) => handlePartChange(index, "part_blueprint_image_url", url))}
                              className="block w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer"
                              accept="image/*"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 shrink-0 bg-slate-100 border border-dashed border-outline-variant rounded flex items-center justify-center overflow-hidden">
                            {part.part_image_url ? (
                              <img src={part.part_image_url} alt="part 3d" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon className="text-outline-variant/50 w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Ảnh Tĩnh 3D</label>
                            <input
                              type="file"
                              onChange={(e) => handleUploadImage(e, (url) => handlePartChange(index, "part_image_url", url))}
                              className="block w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white cursor-pointer"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {parts.length === 0 && (
                    <div className="text-center p-6 text-sm text-on-surface-variant/70 border-2 border-dashed border-outline-variant rounded-lg">
                      Chưa có linh kiện. Hãy thêm ảnh nét đứt và ảnh 3D để đính kèm vào báo giá.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: LIVE PREVIEW HTML */}
            <div className="w-full lg:w-2/3 flex flex-col bg-[#f8f9fa] relative border-l border-outline-variant/60 overflow-hidden">
               <div className="absolute top-4 left-4 z-10 flex gap-2">
                 <div className="bg-primary text-white px-3 py-1.5 rounded-lg shadow text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                   <Code className="w-4 h-4" /> Live Preview 3D
                 </div>
               </div>
               
               <div className="flex-1 overflow-auto bg-slate-100 p-4 flex justify-center min-h-[500px]">
                  {htmlCode ? (
                    <div className="w-full h-full flex items-center justify-center bg-transparent min-w-fit">
                      <iframe
                        ref={previewRef}
                        srcDoc={cleanHtmlCode(htmlCode)}
                        className="pointer-events-auto bg-transparent relative rounded-xl border border-outline-variant/20 shadow-sm w-full h-full border-none min-h-[500px]"
                        title="Live Preview 3D"
                      />
                    </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center text-outline-variant h-full w-full border-2 border-dashed border-outline-variant/40 rounded-xl m-8">
                        <ImageIcon className="w-16 h-16 mb-4 text-outline-variant/50" />
                        <p className="font-semibold text-lg text-on-surface-variant/50">Chưa tải lên Code HTML</p>
                        <p className="text-sm mt-2 text-on-surface-variant/40">Tải lên file .html ở cột bên trái để xem trước Bản Vẽ Tổng Thể.</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrawings;
