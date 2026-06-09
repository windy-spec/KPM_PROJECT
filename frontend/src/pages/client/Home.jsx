import React, { useEffect, useState } from 'react';
import Hero from '../../components/home/Hero';
import CategoryGrid from '../../components/home/CategoryGrid';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import HowItWorks from '../../components/home/HowItWorks';
import CoreValues from '../../components/home/CoreValues';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Tạm thời ẩn mock products vì đã có CategoryGrid thật
  }, []);

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      <div className="max-w-[1280px] mx-auto px-5 pt-6">
        <Hero />
      </div>

      <div className="max-w-[1280px] mx-auto px-5 mt-16 mb-16">
        <CoreValues />
      </div>

      <main className="max-w-[1280px] mx-auto px-5 pb-24 flex flex-col gap-24">
        
        {/* Danh mục nổi bật */}
        <section id="categories">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-sm font-black uppercase text-primary tracking-[0.2em] mb-4">Danh mục Sản phẩm</h2>
            <h3 className="text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight">Cấu hình Đa dạng</h3>
          </div>
          <CategoryGrid />
        </section>

        {/* Quy trình */}
        <section id="how-it-works">
          <HowItWorks />
        </section>

        {/* Banner chốt sale */}
        <section className="relative rounded-[32px] overflow-hidden bg-primary px-8 py-20 text-center flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6 leading-tight">
              Sẵn sàng nhận báo giá cho công trình của bạn?
            </h2>
            <p className="text-primary-100 mb-10 text-lg">
              Trải nghiệm hệ thống bóc tách vật tư tự động 100% của KPM ngay hôm nay. Không cần chờ đợi, không phát sinh chi phí.
            </p>
            <Link to="/products" className="bg-white text-primary px-10 h-16 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-surface-container transition-all hover:-translate-y-1 shadow-2xl">
              Bắt đầu ngay
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;