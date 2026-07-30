import React, { useState, useEffect } from 'react';
import Portal from '../common/Portal';
import { DoorOpen, LayoutGrid, Layers, Construction, Home, Box, X, ArrowRight, Loader2 } from 'lucide-react';
import { categoryService } from '../../services/category.service';
import { useNavigate } from 'react-router-dom';

// 1. Bản đồ ánh xạ icon và nội dung bổ sung dựa trên ID hoặc Tên danh mục từ DB
const CATEGORY_RESOURCES = {
  "cổng sắt kỹ nghệ": { icon: DoorOpen, desc: "Gia công cổng sắt mỹ thuật với họa tiết hoa văn uốn lượn tinh xảo, sơn tĩnh điện cao cấp chống gỉ sét tuyệt đối.", features: ['Sắt đặc 100%', 'Sơn giả cổ', 'Bản lề tự động', 'Mối hàn thẩm mỹ'] },
  "cầu thang & lan can": { icon: LayoutGrid, desc: "Thiết kế lan can ban công, cầu thang xoắn ốc hiện đại cho biệt thự và nhà phố, tối ưu diện tích và sang trọng.", features: ['Tay vịn gỗ/sắt', 'Kính cường lực', 'Chống gỉ sét', 'Lắp đặt tận nơi'] },
  "hàng rào mỹ thuật": { icon: Layers, desc: "Hàng rào sắt bảo vệ kết hợp trang trí, đảm bảo an ninh nghiêm ngặt nhưng vẫn giữ được vẻ đẹp kiến trúc.", features: ['Mũi giáo an toàn', 'Liên kết hàn CO2', 'Độ bền trên 20 năm', 'Dễ dàng bảo trì'] },
  "kết cấu thép": { icon: Construction, desc: "Gia công vì kèo, cột thép cho nhà xưởng và các công trình dân dụng quy mô lớn theo tiêu chuẩn kỹ thuật.", features: ['Thép SS400/A36', 'Cắt Plasma CNC', 'Bản vẽ kỹ thuật 3D', 'Chịu lực cao'] },
  "mái che tiền chế": { icon: Home, desc: "Hệ thống mái lấy sáng, mái Poly, mái tôn giả ngói cho sân thượng và nhà xe với khung sườn kiên cố.", features: ['Khung chịu lực tốt', 'Chống thấm tuyệt đối', 'Thi công nhanh', 'Cách nhiệt hiệu quả'] },
  "phụ kiện bản mã": { icon: Box, desc: "Cung cấp bản mã, bu lông, mặt bích cắt định hình theo yêu cầu kỹ thuật chính xác cho mọi công trình.", features: ['Cắt Laser theo yêu cầu', 'Mạ kẽm nhúng nóng', 'Giao hàng nhanh', 'Đa dạng độ dày'] },
};

// Hàm bổ trợ lấy tài nguyên tĩnh phù hợp, nếu không khớp sẽ trả về icon Box mặc định
const getCategoryMeta = (name) => {
  const normalizeName = (name || "").toLowerCase().trim();

  // Xử lý riêng cho 6 danh mục hiện tại của bạn
  if (normalizeName.includes("cửa sổ")) return CATEGORY_RESOURCES["cầu thang & lan can"]; // Dùng LayoutGrid (trông giống ô cửa sổ)
  if (normalizeName === "cửa" || normalizeName.includes("cổng")) return CATEGORY_RESOURCES["cổng sắt kỹ nghệ"]; // Dùng DoorOpen
  if (normalizeName.includes("hàng rào")) return CATEGORY_RESOURCES["hàng rào mỹ thuật"]; // Dùng Layers
  if (normalizeName.includes("nhà tiền chế")) return CATEGORY_RESOURCES["kết cấu thép"]; // Dùng Construction
  if (normalizeName.includes("mái nhà")) return CATEGORY_RESOURCES["mái che tiền chế"]; // Dùng Home
  if (normalizeName.includes("vật dụng")) return CATEGORY_RESOURCES["phụ kiện bản mã"]; // Dùng Box

  return CATEGORY_RESOURCES[normalizeName] || {
    icon: Box,
    desc: "Cung cấp các sản phẩm cơ khí chất lượng cao, gia công chuẩn xác theo tiêu chuẩn kỹ thuật hiện đại.",
    features: ['Tiêu chuẩn ISO', 'Độ bền vượt trội', 'Giá thành tối ưu', 'Hỗ trợ kỹ thuật']
  };
};

const CategoryCard = ({ icon: Icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="group relative bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col gap-3 
               hover:border-primary hover:bg-white 
               hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10
               transition-all duration-300 ease-out
               items-center text-center shadow-sm cursor-pointer active:scale-[0.98] w-full h-full"
  >
    <div className="absolute top-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <div className="relative p-4 rounded-xl bg-surface group-hover:bg-primary/10 group-hover:rotate-6 transition-all duration-300">
      <Icon className="w-9 h-9 text-on-surface-variant group-hover:text-primary transition-colors" />
    </div>

    <div className="relative flex flex-col gap-1.5 mt-1">
      <h3 className="font-extrabold text-on-surface group-hover:text-primary transition-colors text-sm uppercase tracking-wider leading-tight">
        {title}
      </h3>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1">
          Xem chi tiết <ArrowRight className="w-3 h-3" />
        </span>
        <div className="w-0 group-hover:w-full h-0.5 bg-primary/20 transition-all duration-500 mt-1 rounded-full"></div>
      </div>
    </div>
  </button>
);

const CategoryGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu danh mục khi Component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        // Giữ đúng cấu trúc bóc tách giống file SidebarFilter của bạn
        const fetchedData = res.data?.data || res.data || [];
        setCategories(fetchedData);
      } catch (error) {
        console.error("Lỗi lấy danh mục ở Grid:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant/70">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Đang tải danh mục công trình...</span>
      </div>
    );
  }

  return (
    <section className="mt-10">
      {/* Hiển thị lưới danh mục lấy từ API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          // Khớp nối dữ liệu API tên danh mục sang icon và cấu trúc text tương ứng
          const meta = getCategoryMeta(cat.category_name);

          return (
            <CategoryCard
              key={cat.id}
              icon={meta.icon}
              title={cat.category_name}
              onClick={() => setActiveCategory({
                ...cat,
                desc: meta.desc,
                features: meta.features,
                icon: meta.icon
              })}
            />
          );
        })}
      </div>

      {/* Modal chi tiết danh mục */}
      {activeCategory && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-md transition-opacity"
              onClick={() => setActiveCategory(null)}
            ></div>

            <div className="relative bg-white w-full max-w-lg rounded-3xl p-10 shadow-2xl border border-outline-variant animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveCategory(null)}
                className="absolute top-6 right-6 p-2 hover:bg-surface rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-on-surface-variant" />
              </button>

              <div className="flex flex-col items-center text-center gap-6">
                <div className="p-6 bg-primary/10 rounded-3xl">
                  <activeCategory.icon className="w-16 h-16 text-primary" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black text-on-surface uppercase tracking-tighter">
                    {activeCategory.category_name}
                  </h2>
                  <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
                </div>

                <p className="text-on-surface-variant leading-relaxed text-sm font-medium">
                  {activeCategory.desc}
                </p>

                {/* Khối hiển thị tiêu chuẩn kỹ thuật */}
                <div className="w-full mt-2 bg-surface-container/50 p-6 rounded-2xl border border-outline-variant">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-4 text-left">
                    Tiêu chuẩn kỹ thuật KPM
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {activeCategory.features.map((feat, index) => (
                      <div key={index} className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant text-left">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thay đổi nút bấm cũ thành cấu trúc này */}
                <button
                  onClick={() => {
                    // 1. Đóng modal hiện tại lại cho sạch giao diện
                    setActiveCategory(null);

                    // 2. Điều hướng sang trang sản phẩm và đính kèm ID danh mục lên URL làm query param
                    // Ví dụ URL sẽ thành: /products?category=1
                    navigate(`/products?category=${activeCategory.id}`);
                  }}
                  className="w-full mt-4 py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all uppercase tracking-widest text-xs shadow-xl shadow-primary/30 active:scale-95 cursor-pointer"
                >
                  Xem sản phẩm & Báo giá
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
};

export default CategoryGrid;