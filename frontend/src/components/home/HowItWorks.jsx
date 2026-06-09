import React from 'react';
import { MousePointerClick, Settings2, ReceiptText } from 'lucide-react';

const steps = [
  {
    icon: MousePointerClick,
    title: 'Bước 1: Chọn mẫu',
    desc: 'Khám phá hàng trăm mẫu Cửa, Hàng Rào, Mái Tôn được thiết kế chuẩn kỹ thuật.'
  },
  {
    icon: Settings2,
    title: 'Bước 2: May đo thông số',
    desc: 'Nhập kích thước thực tế của nhà bạn, đổi màu sơn, đổi loại sắt hộp hoặc độ dày.'
  },
  {
    icon: ReceiptText,
    title: 'Bước 3: Nhận báo giá',
    desc: 'Hệ thống AI tự động bóc tách vật tư và xuất bảng báo giá chi tiết ngay lập tức.'
  }
];

const HowItWorks = () => {
  return (
    <div className="bg-white border border-outline-variant rounded-[32px] p-8 md:p-12 shadow-sm">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-sm font-black uppercase text-primary tracking-[0.2em] mb-4">Trải nghiệm vượt trội</h2>
        <h3 className="text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight">Quy trình Báo giá 3 Bước</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        {/* Line kết nối (Chỉ hiện trên desktop) */}
        <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-[2px] bg-outline-variant/50 -z-10"></div>

        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-surface-container border-4 border-white rounded-full flex items-center justify-center text-primary mb-6 shadow-md group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <step.icon className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-black uppercase text-on-surface mb-3">{step.title}</h4>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-[250px]">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
