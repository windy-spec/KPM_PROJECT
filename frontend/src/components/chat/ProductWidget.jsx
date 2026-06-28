import React, { useState, useEffect } from "react";
import { productService } from "../../services/product.service";
import {
  ExternalLink,
  Loader2,
  Sparkles,
  Tag,
  ChevronRight,
} from "lucide-react";

const ProductWidget = ({ items }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productPromises = items.map(async (item) => {
          const res = await productService.getProducts({
            search: item.id,
            limit: 1,
          });
          if (res.data?.data && res.data.data.length > 0) {
            const productData = res.data.data[0];
            const primaryImage =
              productData.product_images?.find((img) => img.is_primary)
                ?.image_url ||
              productData.product_images?.[0]?.image_url ||
              null;
            return {
              ...productData,
              reason: item.reason,
              displayImage: primaryImage,
            };
          }
          return null;
        });

        const results = await Promise.all(productPromises);
        setProducts(results.filter((p) => p !== null));
      } catch (error) {
        console.error("Lỗi lấy thông tin Product Widget:", error);
      } finally {
        setLoading(false);
      }
    };

    if (items && items.length > 0) fetchProducts();
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-primary text-[13px] font-medium p-4 bg-primary/5 border border-primary/20 rounded-xl mt-2 animate-pulse">
        <Loader2 className="animate-spin" size={18} />
        Đang trích xuất dữ liệu sản phẩm từ kho...
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-3 mb-1 space-y-3">
      <div className="text-xs font-bold text-outline uppercase tracking-wider flex items-center gap-1.5 ml-1">
        <Tag size={14} className="text-secondary" /> Sản phẩm đề xuất
      </div>

      {/* NÂNG CẤP: Hiển thị dạng list dọc thay vì scroll ngang, phù hợp chat window hơn */}
      <div className="flex flex-col gap-3">
        {products.map((p, idx) => (
          <div
            key={idx}
            className="bg-white border border-outline-variant/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/60 transition-all flex flex-col cursor-pointer group"
            onClick={() => window.open(`/product/${p.id}`, "_blank")}
          >
            <div className="flex p-3 gap-3">
              {/* Thumbnail vuông vức gọn gàng */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 relative border border-outline-variant/30">
                {p.displayImage ? (
                  <img
                    src={p.displayImage}
                    alt={p.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-variant to-outline-variant/20 gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-outline/60">
                      <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/>
                    </svg>
                    <span className="text-[9px] text-outline/50 font-medium">KPM</span>
                  </div>
                )}
              </div>

              {/* Thông tin chính */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-[10px] font-black text-primary/60 uppercase tracking-wider mb-0.5">
                  {p.product_code}
                </div>
                <h4 className="font-bold text-on-surface text-[14px] leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {p.product_name}
                </h4>
                <div className="text-secondary font-black text-[13px] mt-1.5 flex items-center justify-between">
                  {p.base_price
                    ? Number(p.base_price).toLocaleString("vi-VN") + " đ"
                    : "Liên hệ"}
                  <ChevronRight
                    size={16}
                    className="text-outline group-hover:text-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Lý do AI Recommend nằm tách biệt bên dưới */}
            {p.reason && (
              <div className="bg-primary/5 px-3 py-2.5 border-t border-primary/10 flex items-start gap-2">
                <Sparkles
                  size={14}
                  className="text-primary mt-0.5 flex-shrink-0"
                />
                <p className="text-[12px] text-on-surface-variant italic leading-snug">
                  {p.reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductWidget;
