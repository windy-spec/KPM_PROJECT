import React, { useState } from 'react';
import { ShoppingCart, FileText, Grid3X3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import cartService from '../../services/cart.service';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  // Destructure dữ liệu thật từ DB
  const {
    id,
    product_name,
    product_code,
    product_images,
    product_categories,
    base_price,
    components,
  } = product;

  const imageUrl = product_images?.[0]?.image_url || null;
  const categoryName = product_categories?.category_name || '';

  const { fetchCartCount } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // LOGIC THÊM VÀO GIỎ HÀNG NHANH VỚI THÔNG SỐ MẶC ĐỊNH
  const handleAddToCartQuick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Kiểm tra trạng thái đăng nhập dựa theo token hệ thống
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      return;
    }

    try {
      setIsAdding(true);

      // 2. Ép mảng cấu hình mặc định (components) thành JSON Object/Array hợp lệ
      let parsedComponents = [];
      try {
        parsedComponents = typeof components === 'string' ? JSON.parse(components) : (components || []);
      } catch (parseErr) {
        console.error("Lỗi xử lý định dạng components:", parseErr);
        parsedComponents = [];
      }

      /**
       * 3. PAYLOAD ĐỒNG BỘ TUYỆT ĐỐI VỚI HÀM TRONG PRODUCT_DETAIL:
       * - Sử dụng chính xác key snake_case: 'product_id', 'components_config' (nếu BE cần)
       * - Truyền kèm 'price' để triệt tiêu lỗi Prisma "Argument price is missing" ở Backend.
       */
      const payload = {
        product_id: id,                     // Đúng chuẩn product_id của trang Detail
        quantity: 1,                        // Số lượng mua nhanh mặc định là 1
        price: base_price,                  // Gửi giá gốc đi kèm để BE lưu trữ trực tiếp
        components_config: parsedComponents // Gửi cấu hình linh kiện gốc của sản phẩm
      };

      // 4. Gọi đúng hàm thông qua cartService (Tự động chạy qua endpoint /cart/add và đính kèm token bảo mật)
      const responseData = await cartService.addToCart(payload);

      // Chấp nhận phản hồi thành công dựa theo cấu trúc Response của bạn
      toast.success(`Đã thêm thành công 1 ${product_name} vào giỏ hàng!`);

      // Kích hoạt cập nhật số hiển thị giỏ hàng ngay lập tức trên Header
      await fetchCartCount();

    } catch (error) {
      console.error("Lỗi xử lý thêm nhanh giỏ hàng:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi thêm vào giỏ hàng."
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative bg-white border border-outline-variant rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm 
                    hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40 transition-all duration-300 h-[400px] w-full">

      {/* Khung ảnh sản phẩm */}
      <Link to={`/product/${id}`} className="block w-full h-44 bg-surface-container/30 flex items-center justify-center border-b border-outline-variant/40 group-hover:bg-primary/[0.02] transition-colors relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-outline-variant/60 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-transform duration-300">
            <Grid3X3 className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary/40 transition-colors" />
          </div>
        )}
      </Link>

      {/* Nội dung chữ */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên sản phẩm */}
          <Link to={`/product/${id}`}>
            <h3 className="font-extrabold text-on-surface text-sm line-clamp-2 uppercase tracking-wide group-hover:text-primary transition-colors duration-300 min-h-[40px]">
              {product_name}
            </h3>
          </Link>

          {/* Badge thông số kỹ thuật công nghiệp */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product_code && (
              <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant/80 px-2 py-1 rounded border border-outline-variant/40">
                Mã: {product_code}
              </span>
            )}
            {categoryName && (
              <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant/80 px-2 py-1 rounded border border-outline-variant/40">
                {categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Khối Hiển thị giá và Nút hành động */}
        <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col gap-3">
          <div className="text-sm font-black text-primary">
            {base_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(base_price) : 'Liên hệ'}
          </div>

          <div className="flex gap-2 w-full">
            {/* NÚT TỚI TRANG TÙY CHỈNH KÍCH THƯỚC */}
            <Link
              to={`/product/${id}`}
              className="flex-1 py-2.5 bg-surface-container border border-outline-variant/80 text-on-surface-variant text-[11px] font-black uppercase tracking-wider rounded-xl \
                               hover:bg-on-surface hover:text-white transition-all flex items-center justify-center text-center"
            >
              Cấu hình
            </Link>

            {/* NÚT THÊM NHANH VẬT TƯ MẶC ĐỊNH VÀO GIỎ HÀNG */}
            <button
              onClick={handleAddToCartQuick}
              disabled={isAdding}
              title="Thêm nhanh vào giỏ hàng với thông số mặc định"
              className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center disabled:bg-surface-container disabled:text-on-surface-variant/40 active:scale-95"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;