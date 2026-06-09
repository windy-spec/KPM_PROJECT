import React from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative w-full h-[550px] md:h-[650px] bg-surface-container overflow-hidden rounded-[32px] flex items-center mt-6">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=2070" 
          alt="Industrial background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-transparent"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-2xl pl-8 md:pl-20 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 bg-surface/40 backdrop-blur-md text-primary px-4 py-1.5 rounded-full border border-outline-variant/30 w-fit shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-black uppercase tracking-[0.15em]">Hệ thống May đo Cơ khí Đầu tiên</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-on-surface leading-[1.1] uppercase tracking-tight drop-shadow-sm">
          Báo giá tự động <br />
          <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-500">
            Chính xác 100%
          </span>
        </h1>
        
        <p className="text-lg text-on-surface-variant font-medium max-w-xl">
          Chỉ cần nhập Dài x Rộng, tự do lựa chọn loại sắt thép và màu sơn yêu thích. Hệ thống AI sẽ lập tức bóc tách vật tư và đưa ra bảng báo giá chính xác chỉ trong 3 giây.
        </p>

        <div className="flex flex-wrap gap-4 mt-6">
          <Link to="/products" className="bg-primary text-white px-8 h-14 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:-translate-y-1">
            Bắt đầu cấu hình
            <Calculator className="w-5 h-5" />
          </Link>
          <Link to="/login" className="bg-surface/80 backdrop-blur-sm border-2 border-outline-variant text-on-surface px-8 h-14 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white hover:border-primary transition-all hover:-translate-y-1">
            Đăng nhập
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;