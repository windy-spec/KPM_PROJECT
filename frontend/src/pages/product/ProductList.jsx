import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../components/common/ProductCard';
import SidebarFilter from '../../components/layout/SidebarFilter';

const products = [
  { id: 1, title: 'Thép Tấm Đen Cán Nóng', spec1: 'Mác: SS400', spec2: 'Dày: 5mm', price: '15.500đ/kg', hasPrice: true },
  { id: 2, title: 'Thép Hình Chữ I JIS G3101', spec1: 'Mác: SS400', spec2: 'Kích thước: 1200x100', price: '18.000đ/kg', hasPrice: true },
  { id: 3, title: 'Ống Inox 304 Trang Trí Cao Cấp', spec1: 'Mác: SUS304', spec2: 'Dày: 1.2mm', price: '65.000đ/kg', hasPrice: true, tag: 'BÁN CHẠY' },
  { id: 4, title: 'Sắt Đặc Vuông 14×14 Xoắn Mỹ Thuật', spec1: 'Mác: CT3', spec2: 'Gia công: Xoắn CNC', price: 'Liên hệ', hasPrice: false },
  { id: 5, title: 'Thép Hộp Chữ Nhật Mạ Kẽm', spec1: 'Mác: Q235', spec2: 'Dày: 1.8mm', price: '19.500đ/kg', hasPrice: true },
  { id: 6, title: 'Bản Mã Thép Đột Lỗ Theo Yêu Cầu', spec1: 'Mác: SS400', spec2: 'Dày: >10mm', price: 'Liên hệ', hasPrice: false },
];

const ProductList = () => {
  return (
    <div className="min-h-screen bg-surface font-sans antialiased text-on-surface pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider flex items-center gap-2">
        <span>Trang chủ</span>
        <span>/</span>
        <span className="text-primary">Danh mục Vật tư & Gia công</span>
      </div>

      {/* Tiêu đề */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
        <h1 className="text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight italic">
          Vật tư cơ khí & Thép xây dựng
        </h1>
      </div>

      {/* Layout Grid chính */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* CỘT TRÁI: Gọi Component SidebarFilter vừa tạo */}
        <div className="lg:col-span-1">
          <SidebarFilter />
        </div>

        {/* CỘT PHẢI: LƯỚI SẢN PHẨM */}
        <main className="lg:col-span-3">
          {/* Toolbar */}
          <div className="bg-white border border-outline-variant rounded-2xl p-4 flex justify-between items-center mb-6 shadow-sm">
            <div className="text-xs font-bold text-on-surface-variant/80">
              Hiển thị <span className="text-on-surface font-black">1 - 6</span> trong số <span className="text-primary font-black">124</span> vật tư
            </div>
          </div>

          {/* Lưới sản phẩm dùng ProductCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Phân trang */}
          <div className="mt-12 flex items-center justify-center gap-1.5 text-xs font-black">
            <button className="w-9 h-9 border border-outline-variant rounded-lg bg-white text-on-surface-variant flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">1</button>
            <button className="w-9 h-9 border border-outline-variant rounded-lg bg-white text-on-surface-variant flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </main>

      </div>
    </div>
  );
};

export default ProductList;