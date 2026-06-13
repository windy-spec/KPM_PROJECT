import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Drill, Hammer, LayoutPanelLeft, Ruler, Settings } from 'lucide-react';
import { categoryService } from '../../services/category.service';

const NavigationMenu = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    categoryService.getCategories()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setCategories(data);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Hàm xử lý cuộn mượt mà đến section
  const handleScrollToSection = (e, targetId) => {
    e.preventDefault();

    if (location.pathname === '/') {
      // Nếu đang ở trang chủ -> Tìm id và cuộn mượt xuống
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Nếu ở trang khác -> Điều hướng về trang chủ kèm theo dấu vết #targetId
      navigate(`/#${targetId}`);
    }
  };

  // ĐỊNH NGHĨA MENU: Thêm thoải mái các mục cần cuộn trang ở đây
  const menuItems = [
    { title: 'Tất cả sản phẩm', icon: LayoutPanelLeft, hasSub: true, to: '/products' },
    { title: 'Dịch vụ gia công', icon: Hammer, hasSub: true },
    {
      title: 'Về chúng tôi',
      icon: Drill,
      hasSub: false,
      onClick: (e) => handleScrollToSection(e, 'home-about')
    },
    { title: 'Yêu cầu báo giá', icon: Ruler, hasSub: false },
    { title: 'Thông số kỹ thuật', icon: Settings, hasSub: false },
  ];

  return (
    <div
      className={`w-full bg-white hidden md:block transition-all duration-200 ${isScrolled ? 'border-b border-transparent shadow-none' : 'border-b border-outline-variant'
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-5">
        <ul className="flex items-center gap-2">
          {menuItems.map((item, index) => (
            <li key={index} className="group relative">
              {item.onClick ? (
                // Các nút có sự kiện cuộn trang tự động
                <button
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer w-full text-left"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide">{item.title}</span>
                </button>
              ) : item.to ? (
                <Link
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide">{item.title}</span>
                  {item.hasSub && <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />}
                </Link>
              ) : (
                <button className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer">
                  <item.icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide">{item.title}</span>
                  {item.hasSub && <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />}
                </button>
              )}

              {/* Dropdown động */}
              {item.hasSub && (
                <div className="absolute top-full left-0 w-64 bg-white border border-outline-variant shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] py-2 rounded-b-lg">
                  {index === 0 && categories.length > 0 ? (
                    categories.map(cat => (
                      <Link key={cat.id || cat._id || cat.category_code} to={`/products?category=${cat.id || cat._id}`} className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">
                        {cat.category_name || cat.name}
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link to="/products" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">Dịch vụ gia công CNC</Link>
                      <Link to="/products" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary">Gia công bản mã</Link>
                    </>
                  )}
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