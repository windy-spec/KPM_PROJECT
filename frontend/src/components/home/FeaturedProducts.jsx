import React, { useEffect, useState } from 'react';
import { ArrowRight, Drill, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/product.service';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealProducts = async () => {
      try {
        setLoading(true);

        // Gọi qua service hệ thống, tăng limit lên 40-50 để có đủ mẫu bóc tách danh mục
        const res = await productService.getProducts({ page: 1, limit: 50 });

        // Bóc tách chuẩn cấu trúc data giống như file ProductList.jsx của bạn
        const responseData = res.data;
        const allProducts = responseData?.data || [];

        // Thuật toán: Lọc ép nhóm - Mỗi danh mục chỉ lấy duy nhất 1 sản phẩm đầu tiên tìm thấy
        const categoriesMap = new Map();

        if (Array.isArray(allProducts)) {
          allProducts.forEach((product) => {
            const categoryName = product.product_categories?.category_name || 'Cấu kiện khác';

            // Nếu danh mục này chưa có sản phẩm nào và số lượng chưa đạt tới 6, thì thêm vào
            if (!categoriesMap.has(categoryName) && categoriesMap.size < 6) {
              categoriesMap.set(categoryName, product);
            }
          });
        }

        // Chuyển Map ngược lại thành mảng 6 sản phẩm thuộc 6 danh mục khác nhau
        setFeaturedProducts(Array.from(categoriesMap.values()));
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealProducts();
  }, []);

  // Trạng thái đang tải dữ liệu mượt mà với hiệu ứng xoay tròn spin
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-black uppercase tracking-widest text-primary/80 animate-pulse">
          Đang cấu hình dữ liệu vật tư KPM...
        </span>
      </div>
    );
  }

  // Nếu API trống hoặc lỗi không lấy được dữ liệu, tránh làm vỡ giao diện trang chủ
  if (featuredProducts.length === 0) {
    return (
      <div className="my-8 py-12 text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container/10">
        <p className="text-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1">
          Chưa có dữ liệu sản phẩm thật
        </p>
        <p className="text-xs text-on-surface-variant/60">
          Hệ thống hiển thị tự động khi bạn cập nhật sản phẩm có gắn danh mục trong hệ quản trị.
        </p>
      </div>
    );
  }

  return (
    <section className="py-16 bg-surface-container/10 px-4 rounded-[24px]">
      <div className="max-w-[1280px] mx-auto">

        {/* TIÊU ĐỀ SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Drill className="w-4 h-4" /> Danh mục vật tư tiêu biểu
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-on-surface">
              Sản phẩm nổi bật hệ thống
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors group"
          >
            Xem tất cả sản phẩm <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* LƯỚI GRID ĐỔ RA 6 SẢN PHẨM THẬT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => {
            // Lấy ảnh chính primary hoặc ảnh đầu tiên trong mảng hình ảnh từ DB thật
            const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url
              || product.product_images?.[0]?.image_url
              || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=400"; // Ảnh dự phòng

            const categoryName = product.product_categories?.category_name || "Cấu kiện";

            return (
              <div
                key={product.id}
                className="bg-white border border-outline-variant/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* VÙNG ẢNH SẢN PHẨM */}
                <div className="h-48 bg-surface-container/30 relative overflow-hidden border-b border-outline-variant/30">
                  <img
                    src={primaryImage}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Badge danh mục thật từ DB */}
                  <span className="absolute top-3 left-3 bg-white/95 text-on-surface text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-outline-variant/40 shadow-sm">
                    {categoryName}
                  </span>

                  {/* Tag mã sản phẩm cơ khí */}
                  {product.product_code && (
                    <span className="absolute top-3 right-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm">
                      {product.product_code}
                    </span>
                  )}
                </div>

                {/* VÙNG THÔNG TIN CHI TIẾT */}
                <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="font-black text-sm text-on-surface hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {product.product_name}
                      </h3>
                    </Link>
                  </div>

                  {/* VÙNG HIỂN THỊ TRẠNG THÁI BÓC TÁCH GIÁ */}
                  <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">Cấu hình linh kiện</span>
                      <span className="text-sm font-black text-primary">
                        Bóc tách tự động
                      </span>
                    </div>

                    {/* Nút bấm xem chi tiết thiết lập thông số */}
                    <Link
                      to={`/product/${product.id}`}
                      className="h-9 w-9 rounded-xl bg-surface-container border border-outline-variant/60 text-on-surface-variant hover:bg-on-surface hover:text-white transition-all flex items-center justify-center group/btn shadow-sm"
                    >
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:rotate-45 transition-transform" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;