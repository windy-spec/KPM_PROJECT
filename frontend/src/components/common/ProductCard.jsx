import React from 'react';
import { ShoppingCart, FileText, Grid3X3 } from 'lucide-react';

const ProductCard = ({ product }) => {
  // Destructure dữ liệu từ prop product
  const { title, spec1, spec2, price, hasPrice, tag } = product;

  return (
    <div className="group relative bg-white border border-outline-variant rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm 
                    hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40 transition-all duration-300 h-[400px] w-full">
      
      {/* Tag Bán chạy nếu có */}
      {tag && (
        <span className="absolute top-3 right-3 z-10 text-[9px] font-black bg-teal-600 text-white px-2 py-1 rounded tracking-widest uppercase">
          {tag}
        </span>
      )}

      {/* Khung ảnh sản phẩm */}
      <div className="w-full h-44 bg-surface-container/30 flex items-center justify-center border-b border-outline-variant/40 group-hover:bg-primary/[0.02] transition-colors">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-outline-variant/60 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-transform duration-300">
          <Grid3X3 className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary/40 transition-colors" />
        </div>
      </div>

      {/* Nội dung chữ */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên sản phẩm */}
          <h3 className="font-extrabold text-on-surface text-sm line-clamp-2 uppercase tracking-wide group-hover:text-primary transition-colors duration-300 min-h-[40px]">
            {title}
          </h3>

          {/* Badge thông số kỹ thuật công nghiệp */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {spec1 && (
              <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant/80 px-2 py-1 rounded border border-outline-variant/40">
                {spec1}
              </span>
            )}
            {spec2 && (
              <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant/80 px-2 py-1 rounded border border-outline-variant/40">
                {spec2}
              </span>
            )}
          </div>
        </div>

        {/* Giá và nút chức năng */}
        <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col gap-3">
          <div className={`text-sm font-black ${hasPrice ? 'text-primary' : 'text-on-surface-variant/70 italic'}`}>
            {price}
          </div>

          {hasPrice ? (
            <button className="w-full py-2.5 border border-primary/20 bg-primary/5 text-primary text-xs font-black uppercase tracking-wider rounded-xl 
                               hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/10 transition-all flex items-center justify-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" /> Thêm vào giỏ
            </button>
          ) : (
            <button className="w-full py-2.5 bg-surface-container border border-outline-variant/80 text-on-surface-variant text-xs font-black uppercase tracking-wider rounded-xl 
                               hover:bg-on-surface hover:text-white transition-all flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Nhận báo giá
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;