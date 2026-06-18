import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { productService } from "../../services/product.service";
import apiClient from "../../services/apiClient";
import { materialService } from "../../services/material.service";
import { quotationService } from "../../services/quotation.service";
import cartService from "../../services/cart.service";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import {
  ChevronDown,
  ArrowLeft,
  Loader2,
  Save,
  ShoppingCart,
  Star,
  FileText,
  ClipboardList,
  CreditCard,
} from "lucide-react";
import { CATEGORY_BLUEPRINTS } from "../../config/categoryBlueprints";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCartCount } = useCart();
  const [product, setProduct] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);
  const [paints, setPaints] = useState([]);
  const [laborRates, setLaborRates] = useState([]);

  const [componentsConfig, setComponentsConfig] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [priceData, setPriceData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [note, setNote] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [initialConfig, setInitialConfig] = useState(null);
  const [isModified, setIsModified] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); // Checkbox state

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, matRes, thickRes, paintRes, laborRes] =
          await Promise.all([
            productService.getProductById(id),
            materialService.getMaterials(),
            materialService.getThicknesses(),
            materialService.getPaints(),
            materialService.getLaborRates(),
          ]);

        const pData = prodRes.data?.data || prodRes.data;
        setProduct(pData);

        // Khởi tạo ảnh chính (ưu tiên is_primary, nếu không thì lấy ảnh đầu tiên)
        if (pData?.product_images?.length > 0) {
          const primaryImg =
            pData.product_images.find((img) => img.is_primary) ||
            pData.product_images[0];
          setMainImage(primaryImg.image_url);
        }

        setMaterials(matRes.data?.data || matRes.data || []);
        setThicknesses(thickRes.data?.data || thickRes.data || []);
        setPaints(paintRes.data?.data || paintRes.data || []);
        setLaborRates(laborRes.data?.data || laborRes.data || []);

        // Khởi tạo config cho từng linh kiện từ DB (pData.components)
        const categoryCode = pData?.product_categories?.category_code;
        const blueprint = CATEGORY_BLUEPRINTS[categoryCode] || [];
        let baseConfig = [];

        if (
          pData?.components &&
          Array.isArray(pData.components) &&
          pData.components.length > 0
        ) {
          baseConfig = pData.components.map((comp) => {
            // Cố gắng tìm blueprint tương ứng để lấy allowed_materials
            const bpMatch = blueprint.find((b) => b.name === comp.name);
            return {
              component_name: comp.component_name || comp.name || "Linh kiện",
              length: comp.length || "",
              width: comp.width || "",
              height: comp.height || "",
              unit: comp.unit || "mm",
              default_material: comp.default_material || "",
              material_id: comp.material_id || "",
              thickness_id: comp.thickness_id || "",
              paint_id: comp.paint_id || "",
              allowed_materials:
                comp.allowed_materials ||
                (bpMatch ? bpMatch.allowed_materials : []),
              allow_paint:
                comp.allow_paint !== undefined
                  ? comp.allow_paint
                  : bpMatch
                    ? bpMatch.allow_paint
                    : true,
            };
          });
        }

        // Ánh xạ config từ favorite nếu có
        const stateConfig = location.state?.quotationSpecs;
        if (
          stateConfig &&
          Array.isArray(stateConfig) &&
          stateConfig.length > 0
        ) {
          const mergedConfig = baseConfig.map((comp, idx) => {
            const s = stateConfig[idx];
            if (s) {
              return {
                ...comp,
                length: s.dimensions?.length || comp.length,
                width: s.dimensions?.width || comp.width,
                height: s.dimensions?.height || comp.height,
                material_id: s.material_id || "",
                thickness_id: s.thickness_id || "",
                paint_id: s.paint_id || "",
              };
            }
            return comp;
          });
          setComponentsConfig(mergedConfig);
          setInitialConfig(JSON.stringify(baseConfig));
          setIsModified(
            JSON.stringify(mergedConfig) !== JSON.stringify(baseConfig),
          );
          if (location.state?.note) setNote(location.state.note);
        } else {
          setComponentsConfig(baseConfig);
          setInitialConfig(JSON.stringify(baseConfig));
          setIsModified(false); // Cấu hình đã là tiêu chuẩn, không cần báo giá
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast.error(
          "Không thể tải thông tin sản phẩm: " +
          (error.response?.data?.message || error.message),
        );
        // navigate(-1); // Tạm ẩn để debug
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  // Debounce API call
  useEffect(() => {
    if (!componentsConfig.length) return;

    // Check xem tất cả component đã chọn đủ vật tư, độ dày, sơn chưa
    const isFullyConfigured = componentsConfig.every((c) => {
      if (!c.material_id) return false;
      const hasThicknesses = thicknesses.some(
        (t) => String(t.material_id) === String(c.material_id),
      );
      if (hasThicknesses && !c.thickness_id) return false;
      if (c.allow_paint && !c.paint_id) return false;
      return true;
    });

    if (!isFullyConfigured || !isModified) return;

    const timer = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const laborRate = laborRates[0]; // Tạm dùng labor đầu tiên
        const payload = {
          product_id: product.id,
          labor_category_id: laborRate?.category_id,
          labor_model_id: laborRate?.model_id,
          components: componentsConfig,
        };
        const res = await quotationService.calculateRealtime(payload);
        if (res.data?.success === false) {
          toast.error(res.data.message || "Lỗi khi tính giá");
          setPriceData(null);
        } else {
          setPriceData(res.data?.data || res.data);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi tính giá");
      } finally {
        setIsCalculating(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [componentsConfig, product, laborRates]);

  const handleConfigChange = (index, field, value) => {
    const newConfig = [...componentsConfig];
    newConfig[index][field] = value;
    setComponentsConfig(newConfig);
    if (initialConfig) {
      // So sánh chỉ các field quan trọng: material_id, thickness_id, paint_id, length, width, height
      const relevantKeys = [
        "material_id",
        "thickness_id",
        "paint_id",
        "length",
        "width",
        "height",
      ];
      const pickRelevant = (cfg) =>
        cfg.map((c) => {
          const obj = {};
          relevantKeys.forEach((k) => {
            obj[k] = c[k] ?? "";
          });
          return obj;
        });
      const initialParsed = JSON.parse(initialConfig);
      setIsModified(
        JSON.stringify(pickRelevant(newConfig)) !==
        JSON.stringify(pickRelevant(initialParsed)),
      );
    }
  };

  const handleAddToCart = async () => {
    if (!isAgreed) return;
    if (isModified && !priceData) {
      toast.warning(
        "Vui lòng cấu hình đầy đủ linh kiện để xem giá trước khi thêm vào giỏ!",
      );
      return;
    }

    try {
      await cartService.addToCart({
        product_id: product.id,
        quantity: quantity,
        price: product.base_price,
      });

      toast.success("Đã thêm vào giỏ hàng thành công!");
      fetchCartCount(); // GỌI Ở ĐÂY! SỐ TRÊN NAVBAR SẼ NHẢY NGAY LẬP TỨC!
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
    }
  };
  const handleBuyNow = async () => {
    if (!isAgreed) return;
    try {
      toast.info("Đang khởi tạo đơn hàng...");

      // Gọi API mua trực tiếp
      const payload = {
        product_id: product.id,
        quantity: quantity,
        price: product.base_price,
      };

      const res = await apiClient.post("/orders/direct", payload);
      const createdOrderId = res.data?.data?.order_id;

      if (createdOrderId) {
        // Tạo giỏ hàng "ảo" để mang sang trang Checkout
        const formattedItem = [
          {
            id: `direct-${Date.now()}`,
            product_id: product.id,
            product_name: product.product_name,
            image: mainImage,
            material_name: "Tiêu chuẩn",
            quantity: quantity,
            price: parseFloat(product.base_price) || 0,
          },
        ];

        navigate("/checkout", {
          state: { checkoutItems: formattedItem, order_id: createdOrderId },
        });
      } else {
        toast.error("Không tạo được đơn hàng!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xử lý Mua ngay");
    }
  };
  const handleSaveFavorite = async () => {
    if (!priceData) {
      toast.warning("Vui lòng cấu hình đầy đủ trước khi lưu!");
      return;
    }

    // Thêm prompt hỏi tên cấu hình
    const title = window.prompt(
      "Nhập tên cho thiết kế yêu thích của bạn:",
      `Cấu hình ${product.product_name}`,
    );
    if (title === null) return; // Nếu khách bấm Cancel thì bỏ qua
    if (!title.trim()) {
      toast.warning("Tên thiết kế không được để trống!");
      return;
    }

    try {
      await quotationService.saveFavorite({
        product_id: product.id,
        components: componentsConfig,
        note: note,
        title: title.trim(), // Truyền tên lên backend
      });
      toast.success("Đã lưu thiết kế vào mục yêu thích!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi lưu yêu thích");
    }
  };

  const handleRequestQuote = async () => {
    if (!priceData) {
      toast.warning("Vui lòng cấu hình đầy đủ trước khi yêu cầu báo giá!");
      return;
    }
    try {
      await quotationService.requestCustomQuote({
        product_id: product.id,
        components: componentsConfig,
        note: note,
        quantity: quantity,
      });
      toast.success("Đã gửi yêu cầu báo giá! Admin sẽ liên hệ lại với bạn.");
      navigate("/profile"); // Chuyển đến trang cá nhân
    } catch (error) {
      if (error.response?.data?.code === "PROFILE_INCOMPLETE") {
        toast.error(
          "Vui lòng cập nhật Số điện thoại và Địa chỉ ở trang Cá nhân trước khi gửi yêu cầu.",
        );
        navigate("/profile");
      } else {
        toast.error(error.response?.data?.message || "Lỗi gửi yêu cầu báo giá");
      }
    }
  };

  if (!product)
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Left: Visual */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden bg-surface-container aspect-[4/3] shadow-sm border border-outline-variant/30 flex items-center justify-center relative group">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-on-surface-variant/50 font-medium">
                Chưa có hình ảnh
              </div>
            )}
          </div>

          {/* Dàn ảnh Thumbnails */}
          {product.product_images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.product_images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setMainImage(img.image_url)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img.image_url ? "border-primary shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img
                    src={img.image_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-black text-on-surface">
              {product.product_name}
            </h1>
            <p className="text-sm font-mono text-on-surface-variant mt-1 mb-6">
              Mã SP: {product.product_code}
            </p>

            {/* Accordions cho Thông số và Mô tả */}
            <div className="space-y-3">
              <div className="border border-outline-variant/40 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSpecs(!expandedSpecs)}
                  className="w-full flex items-center justify-between p-4 bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    <span className="font-bold text-on-surface">
                      Thông số kỹ thuật
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${expandedSpecs ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${expandedSpecs ? "max-h-[1000px] border-t border-outline-variant/40 p-4" : "max-h-0"}`}
                >
                  {product.default_specs ? (
                    <div className="text-sm text-on-surface-variant leading-relaxed">
                      <p>
                        Sản phẩm <strong>{product.product_name}</strong> sở hữu
                        các thông số tiêu chuẩn sau:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {Object.entries(product.default_specs).map(
                          ([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {value}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      Sản phẩm được gia công theo cấu hình linh kiện bên phải.
                    </p>
                  )}
                </div>
              </div>
              <div className="border border-outline-variant/40 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedDesc(!expandedDesc)}
                  className="w-full flex items-center justify-between p-4 bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-on-surface">
                      Mô tả sản phẩm
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${expandedDesc ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${expandedDesc ? "max-h-[1000px] border-t border-outline-variant/40 p-4 overflow-y-auto custom-scrollbar" : "max-h-0"}`}
                >
                  {product.description ? (
                    <div
                      className="text-sm text-on-surface-variant leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Chưa có mô tả cho sản phẩm này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Configurator */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30">
          <h2 className="text-xl font-black text-on-surface mb-4">
            Cấu hình linh kiện
          </h2>

          <div className="space-y-3 mb-6">
            {componentsConfig.map((comp, idx) => (
              <div
                key={idx}
                className="border border-outline-variant/40 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() =>
                    setExpandedIndex(expandedIndex === idx ? -1 : idx)
                  }
                  className="w-full flex items-center justify-between p-4 bg-surface-container/30 hover:bg-surface-container/60 transition-colors"
                >
                  <span className="font-bold text-on-surface">
                    {comp.component_name}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-300 ${expandedIndex === idx ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${expandedIndex === idx ? "max-h-[500px] border-t border-outline-variant/40 p-4" : "max-h-0"}`}
                >
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Dài ({comp.unit})
                      </label>
                      <input
                        type="number"
                        disabled={true}
                        value={comp.length}
                        onChange={(e) =>
                          handleConfigChange(idx, "length", e.target.value)
                        }
                        className="w-full bg-surface-container rounded-lg px-3 py-2 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Rộng ({comp.unit})
                      </label>
                      <input
                        type="number"
                        disabled={true}
                        value={comp.width}
                        onChange={(e) =>
                          handleConfigChange(idx, "width", e.target.value)
                        }
                        className="w-full bg-surface-container rounded-lg px-3 py-2 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Cao ({comp.unit})
                      </label>
                      <input
                        type="number"
                        disabled={true}
                        value={comp.height}
                        onChange={(e) =>
                          handleConfigChange(idx, "height", e.target.value)
                        }
                        className="w-full bg-surface-container rounded-lg px-3 py-2 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        Loại vật tư
                      </label>
                      <select
                        value={comp.material_id}
                        disabled={true}
                        onChange={(e) => {
                          const newConfig = [...componentsConfig];
                          newConfig[idx].material_id = e.target.value;
                          newConfig[idx].thickness_id = ""; // Reset thickness when material changes
                          setComponentsConfig(newConfig);
                        }}
                        className="w-full bg-surface-container rounded-lg px-3 py-2.5 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none appearance-none"
                      >
                        <option value="">-- Chọn loại vật tư --</option>
                        {materials
                          .filter(
                            (m) =>
                              comp.allowed_materials.length === 0 ||
                              comp.allowed_materials.includes(m.material_code),
                          )
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.material_name}
                            </option>
                          ))}
                      </select>
                    </div>
                    {thicknesses.some(
                      (t) =>
                        !comp.material_id ||
                        String(t.material_id) === String(comp.material_id),
                    ) && (
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            Độ dày
                          </label>
                          <select
                            value={comp.thickness_id}
                            disabled={true}
                            onChange={(e) =>
                              handleConfigChange(
                                idx,
                                "thickness_id",
                                e.target.value,
                              )
                            }
                            className="w-full bg-surface-container rounded-lg px-3 py-2.5 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none appearance-none"
                          >
                            <option value="">-- Chọn độ dày --</option>
                            {thicknesses
                              .filter(
                                (t) =>
                                  !comp.material_id ||
                                  String(t.material_id) ===
                                  String(comp.material_id),
                              )
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.thickness_value}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                    {comp.allow_paint && (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          Loại sơn
                        </label>
                        <select
                          value={comp.paint_id}
                          disabled={true}
                          onChange={(e) =>
                            handleConfigChange(idx, "paint_id", e.target.value)
                          }
                          className="w-full bg-surface-container rounded-lg px-3 py-2.5 text-sm font-semibold border-none focus:ring-2 focus:ring-primary outline-none appearance-none"
                        >
                          <option value="">-- Chọn loại sơn --</option>
                          {paints.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.paint_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-on-surface-variant mb-2">
              Ghi chú yêu cầu riêng
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Khoét lỗ khóa từ, uốn vòm..."
              className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm font-medium border-none focus:ring-2 focus:ring-primary outline-none resize-none h-24"
            />
          </div>

          {/* Checkbox Đồng ý */}
          <div className="mb-6 flex items-start gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <input
              type="checkbox"
              id="agree-specs"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-primary bg-surface-container border-outline-variant rounded focus:ring-primary focus:ring-2 transition-all cursor-pointer"
            />
            <label
              htmlFor="agree-specs"
              className="text-sm font-medium text-on-surface-variant cursor-pointer leading-relaxed select-none"
            >
              <a
                href="/specification"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Tôi đã kiểm tra đủ các thông số{" "}
              </a>
              và{" "}
              <a
                href="/spec-confirmation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                đồng ý với các chi tiết linh kiện
              </a>
              .
            </label>
          </div>

          {/* Pricing Section */}
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 relative overflow-hidden">
            {isCalculating && (
              <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-primary w-6 h-6" />
              </div>
            )}
            <div className="text-sm font-bold text-primary mb-1">
              {isModified ? "Giá tạm tính" : "Giá bán tiêu chuẩn"}
            </div>
            <div className="text-4xl font-black text-on-surface mb-4">
              {isModified
                ? priceData
                  ? new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(priceData.total_amount)
                  : "--- ₫"
                : new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.base_price || 0)}
            </div>

            {priceData && (
              <div className="space-y-1.5 pt-4 border-t border-primary/20">
                {priceData.breakdown_costs.map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs font-medium text-on-surface-variant"
                  >
                    <span>{b.name}</span>
                    <span>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-highest transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-on-surface">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface font-bold hover:bg-surface-container-highest transition-colors"
              >
                +
              </button>
            </div>

            {isModified ? (
              <button
                onClick={handleRequestQuote}
                disabled={!isAgreed}
                className={`flex-[2] font-black py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${!isAgreed ? "bg-surface-container opacity-50 cursor-not-allowed text-on-surface-variant" : "bg-primary text-white hover:bg-primary/90 shadow-primary/30"}`}
              >
                <ClipboardList className="w-5 h-5" />
                Yêu cầu Báo giá
              </button>
            ) : (
              <button
                onClick={handleBuyNow}
                disabled={!isAgreed}
                className={`flex-[2] font-black py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${!isAgreed ? "bg-surface-container opacity-50 cursor-not-allowed text-on-surface-variant" : "bg-[#ff6b00] text-white hover:bg-[#ff6b00]/90 shadow-[#ff6b00]/30"}`}
              >
                <CreditCard className="w-5 h-5" />
                Mua ngay
              </button>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isModified || !isAgreed}
              title={
                isModified
                  ? "Vui lòng yêu cầu báo giá cho sản phẩm đã thay đổi thông số"
                  : "Thêm vào giỏ hàng"
              }
              className={`flex-1 font-black py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${isModified || !isAgreed ? "bg-surface-container opacity-50 cursor-not-allowed text-on-surface-variant" : "bg-surface-container-highest text-on-surface hover:bg-outline-variant/30"}`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Giỏ hàng</span>
            </button>

            <button
              onClick={handleSaveFavorite}
              title="Lưu yêu thích"
              className="flex-none w-14 bg-pink-50 text-pink-500 font-bold py-3.5 px-4 rounded-xl hover:bg-pink-100 hover:text-pink-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
