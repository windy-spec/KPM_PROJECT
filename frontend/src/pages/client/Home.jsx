import React, { useState, useEffect } from 'react';
import Hero from '../../components/home/Hero';
import CategoryGrid from '../../components/home/CategoryGrid';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import AIFloatingButton from '../../components/home/AIFloatingButton';
import Footer from '../../components/layout/Footer';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Dữ liệu mẫu (Sau này nối API từ Backend)
    const mockProducts = [
      {
        id: 1,
        name: "Cửa cổng sắt CNC 4 cánh mẫu Trống Đồng Đông Sơn",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070",
        tags: ["Thép tấm 5mm", "Sơn tĩnh điện"],
        price: 3200000,
        unit: "m2",
        isNew: true
      },
      {
        id: 2,
        name: "Cầu thang sắt nghệ thuật xoắn ốc hiện đại",
        image: "https://images.unsplash.com/photo-1621293954908-907159247fc8?q=80&w=2070",
        tags: ["Sắt đặc 16x16", "Tay vịn gỗ"],
        price: 1850000,
        unit: "md",
        isNew: false
      },
      {
        id: 3,
        name: "Lan can ban công sắt mỹ nghệ tân cổ điển",
        image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=2070",
        tags: ["Hoa văn đúc", "Thép la"],
        price: 1250000,
        unit: "md",
        isNew: true
      },
      {
        id: 4,
        name: "Hàng rào sắt hộp mạ kẽm chống rỉ",
        image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070",
        tags: ["Sắt hộp 40x80", "Mạ kẽm"],
        price: 950000,
        unit: "m2",
        isNew: false
      }
    ];
    setProducts(mockProducts);
  }, []);

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      
      {/* 1. Hero Section */}
      <div className="max-w-[1280px] mx-auto px-5 pt-6">
        <Hero />
      </div>

      {/* 2. ĐƯỜNG LINE NGĂN CÁCH (Divider) */}
      <div className="max-w-[1280px] mx-auto px-5 mt-16 mb-4">
        <div className="relative flex items-center justify-center">
          {/* Đường line ngang */}
          <div className="w-full h-px bg-outline-variant"></div>
          
          {/* Biểu tượng cơ khí ở giữa (Hình thoi) */}
          <div className="absolute bg-surface px-4 flex gap-1.5">
            <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"></div>
            <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"></div>
            <div className="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"></div>
          </div>
        </div>
      </div>

      {/* 3. Main Content */}
      <main className="max-w-[1280px] mx-auto px-5 pb-24 flex flex-col gap-20">  
        
        <section id="categories">
           <CategoryGrid />
        </section>

        <section id="featured">
           <FeaturedProducts products={products} />
        </section>

      </main>

      <AIFloatingButton />
    </div>
  );
};

export default Home;