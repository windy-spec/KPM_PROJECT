import React, { useState, useEffect } from "react";
import { Plus, Trash, Image as ImageIcon, Save, X } from "lucide-react";
import adminService from "../../services/admin.service";
import apiClient from "../../services/apiClient";
import { toast } from "react-toastify";

const ManageDrawings = () => {
  const [products, setProducts] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [drawingName, setDrawingName] = useState("");
  const [scaleRatio, setScaleRatio] = useState("1:100");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [parts, setParts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadDrawings(selectedProduct);
    } else {
      setDrawings([]);
      setShowForm(false); // Ẩn form nếu đổi/hủy chọn sản phẩm
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

  // --- LOGIC MỚI: TỰ ĐỘNG ÁNH XẠ LINH KIỆN TỪ SẢN PHẨM ---
  const handleOpenAddForm = () => {
    const product = products.find((p) => p.id === selectedProduct);

    if (product) {
      // Gợi ý tên bản vẽ mặc định
      setDrawingName(`Bản vẽ ${product.product_name || ""}`);

      // Xử lý tự động map components của sản phẩm vào parts của bản vẽ
      let autoMappedParts = [];
      if (product.components) {
        let compArray = [];
        try {
          // Đề phòng trường hợp components lưu ở dạng string JSON trong DB
          compArray =
            typeof product.components === "string"
              ? JSON.parse(product.components)
              : product.components;
        } catch (error) {
          console.error("Lỗi parse components:", error);
        }

        if (Array.isArray(compArray)) {
          autoMappedParts = compArray.map((comp) => ({
            component_name: comp.component_name || "",
            // Map category_code hoặc tên linh kiện làm material_category dự phòng
            material_category:
              comp.category_code || comp.component_name || "Khung/Vỏ",
            part_image_url: "", // Để trống cho Admin tự upload
          }));
        }
      }

      setParts(autoMappedParts);
    } else {
      setParts([]);
    }

    setShowForm(true);
  };
  // --------------------------------------------------------

  const handleUploadImage = async (e, setUrlCallback) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await apiClient.post("/ai/upload-drawing", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrlCallback(res.data?.data?.imageUrl);
    } catch (error) {
      toast.error("Upload ảnh thất bại");
    }
  };

  const handleAddPart = () => {
    setParts([
      ...parts,
      { component_name: "", material_category: "", part_image_url: "" },
    ]);
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
    if (!selectedProduct) return toast.warning("Vui lòng chọn sản phẩm trước");
    if (!drawingName || !mainImageUrl)
      return toast.warning("Vui lòng nhập tên bản vẽ và ảnh tổng");

    try {
      const payload = {
        product_id: selectedProduct,
        drawing_name: drawingName,
        scale_ratio: scaleRatio,
        main_image_url: mainImageUrl,
        parts,
      };

      await adminService.createDrawing(payload);
      toast.success("Tạo bản vẽ thành công!");
      setShowForm(false);
      resetForm();
      loadDrawings(selectedProduct);
    } catch (error) {
      toast.error("Lỗi tạo bản vẽ: " + error.message);
    }
  };

  const resetForm = () => {
    setDrawingName("");
    setScaleRatio("1:100");
    setMainImageUrl("");
    setParts([]);
  };

  return (
    <div className="p-6 bg-surface-container/10 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-on-surface">
          Quản lý Bản Vẽ Sản Phẩm
        </h3>
        {selectedProduct && !showForm && (
          <button
            onClick={handleOpenAddForm} // Thay vì gọi setShowForm(true), gọi hàm xử lý Auto-map
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" /> Thêm Bản Vẽ
          </button>
        )}
      </div>

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
                className="bg-white rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b bg-surface-container/20 flex justify-between items-center">
                  <h4 className="font-black text-lg text-primary">
                    {d.drawing_name}
                  </h4>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                    Tỷ lệ: {d.scale_ratio}
                  </span>
                </div>
                <div className="p-4 flex flex-col xl:flex-row gap-4 h-full">
                  <div className="w-full xl:w-2/5 flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg p-2 min-h-[150px]">
                    <img
                      src={d.main_image_url}
                      alt="Main"
                      className="w-full max-h-[250px] object-contain rounded"
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
                              className="w-full h-full object-cover"
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

      {/* TẠO BẢN VẼ MỚI */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-outline-variant p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h4 className="text-xl font-black text-on-surface">
                Tạo Bản Vẽ Mới
              </h4>
              <p className="text-sm text-on-surface-variant font-medium mt-1">
                Các linh kiện đã được{" "}
                <span className="text-primary font-bold">tự động ánh xạ</span>{" "}
                từ cấu hình sản phẩm.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold mb-2 text-on-surface">
                  Tên Bản Vẽ
                </label>
                <input
                  type="text"
                  required
                  value={drawingName}
                  onChange={(e) => setDrawingName(e.target.value)}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface font-medium"
                  placeholder="VD: Bản vẽ tổng thể Mặt Đứng"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-on-surface">
                  Tỷ lệ (Scale)
                </label>
                <input
                  type="text"
                  value={scaleRatio}
                  onChange={(e) => setScaleRatio(e.target.value)}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface font-medium"
                  placeholder="VD: 1:100"
                />
              </div>
            </div>

            <div className="bg-surface-container/10 p-5 rounded-xl border border-outline-variant/50">
              <label className="block text-sm font-black mb-3 text-primary flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Ảnh Bản Vẽ Tổng Thể (Master)
              </label>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <input
                  type="file"
                  onChange={(e) => handleUploadImage(e, setMainImageUrl)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                  accept="image/*"
                />
                {mainImageUrl && (
                  <img
                    src={mainImageUrl}
                    alt="Preview"
                    className="h-24 w-36 object-contain bg-white border-2 border-primary/30 rounded-lg shadow-sm"
                  />
                )}
              </div>
            </div>

            <div className="border-t border-outline-variant pt-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h5 className="font-black text-lg text-primary">
                    Bóc tách Linh Kiện
                  </h5>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">
                    Upload ảnh cho từng linh kiện tương ứng bên dưới
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="flex items-center gap-2 text-sm font-bold bg-surface-variant text-on-surface px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Plus className="w-4 h-4" /> Thêm tay
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {parts.map((part, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-5 p-5 border border-outline-variant bg-white rounded-xl relative shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-primary/40 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="absolute top-3 right-3 text-outline hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash className="w-4 h-4" />
                    </button>

                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold mb-1.5 text-on-surface-variant uppercase tracking-wider">
                          Tên linh kiện
                        </label>
                        <input
                          type="text"
                          required
                          value={part.component_name}
                          onChange={(e) =>
                            handlePartChange(
                              index,
                              "component_name",
                              e.target.value,
                            )
                          }
                          className="w-full p-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none font-bold text-on-surface"
                          placeholder="VD: Khung bao, Cánh cổng..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1.5 text-on-surface-variant uppercase tracking-wider">
                          Hạng mục Vật tư
                        </label>
                        <input
                          type="text"
                          required
                          value={part.material_category}
                          onChange={(e) =>
                            handlePartChange(
                              index,
                              "material_category",
                              e.target.value,
                            )
                          }
                          className="w-full p-2.5 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none font-medium text-primary bg-primary/5"
                          placeholder="VD: Khung Bao, Sắt Cánh, Phụ Kiện..."
                        />
                      </div>
                    </div>

                    <div className="flex-1 bg-surface-container/10 p-4 rounded-lg border border-dashed border-outline-variant/80 flex flex-col justify-center">
                      <label className="block text-[11px] font-bold mb-3 text-on-surface-variant uppercase tracking-wider">
                        Ảnh chi tiết linh kiện
                      </label>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="file"
                            onChange={(e) =>
                              handleUploadImage(e, (url) =>
                                handlePartChange(index, "part_image_url", url),
                              )
                            }
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white transition-colors cursor-pointer"
                            accept="image/*"
                          />
                        </div>
                        <div className="w-20 h-20 shrink-0 bg-white border border-outline-variant rounded-lg flex items-center justify-center overflow-hidden">
                          {part.part_image_url ? (
                            <img
                              src={part.part_image_url}
                              alt="Preview part"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="text-outline-variant/50 w-6 h-6" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {parts.length === 0 && (
                  <div className="p-10 text-center border-2 border-dashed border-outline-variant rounded-xl bg-surface-container/5">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-outline-variant/50">
                      <ImageIcon className="text-outline-variant w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-on-surface-variant">
                      Chưa có linh kiện nào.
                    </p>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Hệ thống không tìm thấy linh kiện cài sẵn cho sản phẩm
                      này.
                      <br />
                      Hãy bấm "Thêm tay" để bắt đầu bóc tách.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-outline-variant pt-6 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-on-surface bg-surface-container hover:bg-surface-container/80 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/30 active:scale-95 hover:-translate-y-0.5"
              >
                <Save className="w-5 h-5" /> Lưu Bản Vẽ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageDrawings;
