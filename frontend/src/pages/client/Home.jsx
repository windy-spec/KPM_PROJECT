import React, { useEffect, useState } from 'react';
import Hero from '../../components/home/Hero';
import HomeAbout from '../../components/home/HomeAbout';
import CategoryGrid from '../../components/home/CategoryGrid';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import CoreValues from '../../components/home/CoreValues';
import HowItWorks from '../../components/home/HowItWorks';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20 flex flex-col pb-16 md:pb-24">

      {/* 1. HERO BANNER - Giữ nguyên khoảng nền thoáng trên cùng */}
      <div className="max-w-[1280px] mx-auto w-full px-5 pt-6">
        <Hero />
      </div>

      {/* 2. VIDEO + MÔ TẢ BẢN THÂN (HomeAbout) - Bọc dải nền nhẹ tạo chiều sâu */}
      <div className="w-full bg-surface-container/30 border-y border-outline-variant/20 mt-16 md:mt-24 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto w-full px-5">
          <HomeAbout />
        </div>
      </div>

      {/* 3. DANH MỤC SẢN PHẨM (CategoryGrid) */}
      <div className="max-w-[1280px] mx-auto w-full px-5 mt-16 md:mt-24">
        <section id="categories" className="scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] bg-primary/10 text-primary font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
              Hệ thống xử lý kích thước động
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight mb-4 mt-3">
              Danh mục cấu kiện gia công
            </h2>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Lựa chọn nhóm sản phẩm cơ khí bạn cần thiết lập bản vẽ bóc tách vật tư. Hệ thống hỗ trợ xử lý kích thước động hóa tức thời.
            </p>
          </div>
          <CategoryGrid />
        </section>
      </div>

      {/* Đường cắt mờ phân cấp kỹ thuật */}
      <div className="max-w-[1280px] mx-auto w-full px-5 mt-16 md:mt-24">
        <div className="border-t border-outline-variant/40 w-full"></div>
      </div>

      {/* 4. 6 SẢN PHẨM NỔI BẬT - Đã có nền nhẹ bên trong component */}
      <div className="max-w-[1280px] mx-auto w-full px-5 mt-16 md:mt-24">
        <FeaturedProducts />
      </div>

      {/* Đường cắt mờ tiếp theo trước khi vào Core Values */}
      <div className="max-w-[1280px] mx-auto w-full px-5 mt-16 md:mt-24">
        <div className="border-t border-outline-variant/40 w-full"></div>
      </div>

      {/* MAIN CONTENT AREA - Quản lý các Khối thông tin và Chốt Sale cuối trang */}
      <main className="max-w-[1280px] mx-auto w-full px-5 flex flex-col gap-16 md:gap-24 mt-16 md:mt-24">

        {/* 5. CORE VALUE (Giá trị cốt lõi) */}
        <section id="core-values" className="scroll-mt-24">
          {/* Thêm cụm tiêu đề chuẩn tiêu chuẩn UI thiết kế cơ khí giống danh mục */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] bg-primary/10 text-primary font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
              Cam kết chất lượng KPM
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight mb-4 mt-3">
              Giá trị cốt lõi của chúng tôi
            </h2>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Nền tảng vững chắc tạo nên sự tin tưởng trong từng dự án gia công kết cấu. Chúng tôi tối ưu chi phí và chuẩn hóa kỹ thuật dựa trên 3 tiêu chí nghiêm ngặt.
            </p>
          </div>

          {/* Component chứa các thẻ card của bạn giữ nguyên */}
          <CoreValues />
        </section>

        {/* Đường cắt mờ phân tách giữa CoreValues và Quy trình */}
        <div className="border-t border-outline-variant/40 w-full"></div>

        {/* 6. HOW IT WORK (Quy trình hoạt động) */}
        <section id="how-it-works" className="scroll-mt-24">
          <HowItWorks />
        </section>

        {/* 7. SẴN SÀNG NHẬN BÁO GIÁ (Banner chốt sale) */}
        <section className="relative rounded-[32px] overflow-hidden bg-primary px-8 py-20 text-center flex flex-col items-center justify-center shadow-lg shadow-primary/10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6 leading-tight">
              Sẵn sàng nhận báo giá cho công trình của bạn?
            </h2>
            <p className="text-sm md:text-lg text-primary-100 mb-10 font-medium max-w-xl">
              Trải nghiệm hệ thống bóc tách vật tư tự động 100% của KPM ngay hôm nay. Không cần chờ đợi, không phát sinh chi phí.
            </p>
            <Link
              to="/products"
              className="bg-white text-primary text-xs font-black uppercase tracking-widest px-10 h-16 rounded-xl shadow-xl hover:bg-surface-container transition-all duration-300 flex items-center justify-center gap-2 group active:scale-95"
            >
              Bắt đầu thiết kế ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Home;