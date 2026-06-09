import React from 'react';
import { ShieldCheck, Ruler, Calculator, Clock } from 'lucide-react';

const values = [
  {
    icon: Calculator,
    title: 'Báo giá tức thì',
    desc: 'Hệ thống tự động bóc tách vật tư và nhân công chỉ trong 3 giây sau khi nhập kích thước.'
  },
  {
    icon: Ruler,
    title: 'Tùy chỉnh linh hoạt',
    desc: 'Thay đổi loại sắt, độ dày, màu sơn thoải mái theo sở thích cá nhân.'
  },
  {
    icon: ShieldCheck,
    title: 'Minh bạch chi phí',
    desc: 'Báo giá chi tiết đến từng thanh sắt, con ốc. Không phát sinh chi phí ẩn.'
  },
  {
    icon: Clock,
    title: 'Gia công thần tốc',
    desc: 'Xưởng sản xuất trực tiếp không qua trung gian, đảm bảo tiến độ khắt khe nhất.'
  }
];

const CoreValues = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {values.map((item, idx) => (
        <div key={idx} className="bg-surface-container/50 border border-outline-variant/50 p-6 rounded-2xl hover:bg-surface-container transition-colors duration-300">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <item.icon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black uppercase text-on-surface mb-2">{item.title}</h3>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
};

export default CoreValues;
