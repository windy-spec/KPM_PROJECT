import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative w-full h-[450px] md:h-[550px] bg-surface-container overflow-hidden rounded-xl border border-outline-variant flex items-center mt-6">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=2070" 
          alt="Industrial background" 
          className="w-full h-full object-cover opacity-20 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl pl-8 md:pl-16 flex flex-col gap-5">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-sm border border-primary/20 w-fit">
          <BadgeCheck className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">ISO 9001:2015 Certified</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight uppercase tracking-tight">
          Gia công sắt kỹ nghệ & <br />
          <span className="text-primary">Kết cấu thép</span> chuyên nghiệp
        </h1>
        
        <p className="text-lg text-on-surface-variant max-w-xl">
          Đảm bảo tiến độ - Cam kết chất lượng - Thẩm mỹ cao. Cung cấp giải pháp toàn diện từ thiết kế đến thi công lắp đặt.
        </p>

        <div className="flex flex-wrap gap-4 mt-4">
          <button className="bg-primary text-on-primary px-8 h-12 rounded font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-lg shadow-primary/20 cursor-pointer">
            Nhận tư vấn ngay
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="bg-transparent border border-outline text-on-surface px-8 h-12 rounded font-bold hover:bg-surface-container transition-all cursor-pointer">
            Xem hồ sơ năng lực
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;