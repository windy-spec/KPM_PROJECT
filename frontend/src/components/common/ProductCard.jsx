import React, { useState } from 'react';
import { ShoppingCart, FileText, Grid3X3, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import cartService from '../../services/cart.service';
import { toast } from 'react-toastify';
import defaultProductImg from '../../assets/img/avt_chung.jpg';

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

  const isHighValue = base_price > 40000000;

  // LOGIC XỬ LÝ KHI NHẤN NÚT YÊU CẦU BÁO GIÁ ĐỐI VỚI SẢN PHẨM > 40 TRIỆU
  const handleQuoteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Bắn thông báo hướng dẫn cho khách hàng bằng toast.info hoặc toast.warning
    toast.info(
      `Sản phẩm này có giá trị lớn. Vui lòng liên hệ Hotline hoặc trang Yêu Cầu Báo Giá để nhận cấu hình báo giá may đo chi tiết!`,
      { autoClose: 5000 } // Hiển thị trong 5 giây để khách hàng kịp đọc
    );
  };

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
        <img src={imageUrl || defaultProductImg} alt={product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        <div className="mt-3 pt-3 border-t border-outline-variant/40 flex flex-col gap-2">
          <div className="text-sm font-black text-primary">
            {base_price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(base_price) : 'Liên hệ'}
          </div>

          {/* ĐỐI LƯU CHUẨN: Luôn nằm trên 1 hàng ngang (flex-row), khoảng cách gap-1.5 nhỏ gọn hơn */}
          <div className="flex flex-row gap-1.5 w-full items-center">

            {/* NÚT TỚI TRANG TÙY CHỈNH KÍCH THƯỚC */}
            <Link
              to={`/product/${id}`}
              /* Giảm padding dọc xuống py-2, cỡ chữ text-[10px] để nút thanh thoát hơn */
              className="flex-1 py-2 bg-surface-container border border-outline-variant/60 text-on-surface-variant text-[10px] font-black uppercase tracking-wider rounded-lg 
                 hover:bg-on-surface hover:text-white transition-all flex items-center justify-center text-center min-h-[36px] whitespace-nowrap"
            >
              Xem Chi Tiết
            </Link>

            {/* THAY THẾ HIỂN THỊ VÀ LOGIC DỰA TRÊN ĐIỀU KIỆN GIÁ (> 40 TRIỆU) */}
            {isHighValue ? (
              <button
                onClick={handleQuoteClick}
                title="Sản phẩm giá trị lớn - Yêu cầu báo giá riêng"
                /* Thay vì chiếm flex-1 làm nút quá to, ta cho nút báo giá chiếm tỉ lệ flex-[1.2] rộng hơn nút cấu hình một chút để không vỡ chữ */
                className="flex-[1.2] py-2 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg 
                   hover:bg-primary/90 transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer 
                   shadow-sm shadow-secondary/10 whitespace-nowrap min-h-[36px]"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Báo giá</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCartQuick}
                disabled={isAdding}
                title="Thêm nhanh vào giỏ hàng"
                /* Cố định chiều rộng nút giỏ hàng là w-9 (bằng chiều cao min-h-36) để tạo thành khối vuông tròn cực kỳ gọn */
                className="w-9 h-9 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center 
                   disabled:bg-surface-container disabled:text-on-surface-variant/40 active:scale-95 cursor-pointer min-h-[36px] shrink-0"
              >
                {isAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;