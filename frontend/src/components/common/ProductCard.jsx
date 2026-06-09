import React from 'react';
import { ShoppingCart, FileText, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  // Destructure dữ liệu thật từ DB
  const { id, product_name, product_code, product_images, product_categories } = product;

  const imageUrl = product_images?.[0]?.image_url || null;
  const categoryName = product_categories?.category_name || '';

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

        {/* Giá và nút chức năng */}
        <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col gap-3">
          <div className="text-sm font-black text-primary">
            Tùy chỉnh linh kiện
          </div>

          <Link to={`/product/${id}`} className="w-full py-2.5 bg-surface-container border border-outline-variant/80 text-on-surface-variant text-xs font-black uppercase tracking-wider rounded-xl 
                             hover:bg-on-surface hover:text-white transition-all flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;