import React from 'react';
import { ChevronDown, Drill, Hammer, LayoutPanelLeft, Ruler, Settings } from 'lucide-react';

const NavigationMenu = () => {
  const menuItems = [
    { title: 'Tất cả sản phẩm', icon: LayoutPanelLeft, hasSub: true },
    { title: 'Dịch vụ gia công', icon: Hammer, hasSub: true },
    { title: 'Cắt CNC & Bản mã', icon: Drill, hasSub: false },
    { title: 'Yêu cầu báo giá', icon: Ruler, hasSub: false },
    { title: 'Thông số kỹ thuật', icon: Settings, hasSub: false },
  ];

  return (
    <div className="w-full bg-white border-b border-outline-variant hidden md:block">
      <div className="max-w-[1280px] mx-auto px-5">
        <ul className="flex items-center gap-2">
          {menuItems.map((item, index) => (
            <li key={index} className="group relative">
              <button className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer">
                <item.icon className="w-4 h-4" />
                <span className="uppercase tracking-wide">{item.title}</span>
                {item.hasSub && <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />}
              </button>
              
              {/* Dropdown giả lập */}
              {item.hasSub && (
                <div className="absolute top-full left-0 w-64 bg-white border border-outline-variant shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] py-2 rounded-b-lg">
                  <a href="#" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">Sắt mỹ nghệ</a>
                  <a href="#" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">Kết cấu nhà tiền chế</a>
                  <a href="#" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">Phụ kiện cơ khí</a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NavigationMenu;