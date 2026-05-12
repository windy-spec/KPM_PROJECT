import React from 'react';
import ProductCard from '../common/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FeaturedProducts = ({ products }) => {
  return (
    <section className="mt-16 flex flex-col gap-8">
      {/* Header của Section */}
      <div className="flex items-end justify-between border-b border-outline-variant pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-primary font-bold text-sm uppercase tracking-widest">Gợi ý cho bạn</span>
          <h2 className="text-3xl font-black text-on-surface uppercase flex items-center gap-3">
            Mẫu thiết kế nổi bật
          </h2>
        </div>
        
        {/* Nút điều hướng (Slider giả) */}
        <div className="flex gap-2">
          <button className="p-2 border border-outline-variant rounded-full hover:bg-surface-container transition-all">
            <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
          <button className="p-2 bg-primary border border-primary rounded-full hover:bg-primary-container transition-all">
            <ChevronRight className="w-5 h-5 text-on-primary" />
          </button>
        </div>
      </div>

      {/* Danh sách Grid sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
      
      {/* Nút xem tất cả */}
      <div className="flex justify-center mt-4">
        <button className="px-10 py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all uppercase text-sm tracking-bold">
          Xem tất cả mẫu thiết kế
        </button>
      </div>
    </section>
  );
};

export default FeaturedProducts;