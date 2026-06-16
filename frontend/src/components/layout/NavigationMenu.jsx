import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Drill,
  Hammer,
  LayoutPanelLeft,
  Ruler,
  Settings,
  Heart
} from "lucide-react";
import { categoryService } from "../../services/category.service";

const NavigationMenu = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setCategories(data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // ĐỊNH NGHĨA MENU: Thêm thoải mái các mục cần cuộn trang ở đây
  const menuItems = [
    {
      title: "Tất cả sản phẩm",
      icon: LayoutPanelLeft,
      hasSub: true,
      to: "/products",
    },
    {
      title: "Chính sách bảo hành",
      icon: Hammer,
      hasSub: false,
      to: "/warranty",
    },
    {
      title: "Về chúng tôi",
      icon: Drill,
      hasSub: false,
      to: "/about",
    },
    {
      title: "Yêu cầu báo giá",
      icon: Ruler,
      hasSub: false,
      to: "/request-a-quote",
    },
    {
      title: "Thuật ngữ chuyên ngành",
      icon: Settings,
      hasSub: false,
      to: "/technical-terms",
    },
    {
      title: "Trung tâm trợ giúp",
      icon: Heart,
      hasSub: true,
      subItems: [
        { title: "Điều khoản dịch vụ", to: "/terms-of-service" },
        { title: "Chính sách bảo mật", to: "/privacy-policy" },
        { title: "Các câu hỏi thường gặp", to: "/faq" },
      ]
    },
  ];

  return (
    <div
      className={`w-full bg-white hidden md:block transition-all duration-200 ${isScrolled
        ? "border-b border-transparent shadow-none"
        : "border-b border-outline-variant"
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-5">
        <ul className="flex items-center justify-between flex-nowrap gap-2">
          {menuItems.map((item, index) => (
            <li key={index} className="group relative flex-shrink-0">
              {item.onClick ? (
                // Các nút có sự kiện cuộn trang tự động
                <button
                  onClick={item.onClick}
                  className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer w-full text-left whitespace-nowrap"
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
                  {item.hasSub && (
                    <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
                  )}
                </Link>
              ) : (
                <button className="flex items-center gap-2 px-4 py-3 text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all cursor-pointer">
                  <item.icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide">{item.title}</span>
                  {item.hasSub && (
                    <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
                  )}
                </button>
              )}

              {/* Dropdown động */}
              {item.hasSub && (
                <div className="absolute top-full left-0 w-64 bg-white border border-outline-variant shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] py-2 rounded-b-lg">
                  {item.subItems ? (
                    item.subItems.map((sub, idx) => (
                      <Link
                        key={idx}
                        to={sub.to}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      >
                        {sub.title}
                      </Link>
                    ))
                  ) : index === 0 && categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat.id || cat._id || cat.category_code}
                        to={`/products?category=${cat.id || cat._id}`}
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      >
                        {cat.category_name || cat.name}
                      </Link>
                    ))
                  ) : (
                    <>
                      <Link
                        to="/products"
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      >
                        Dịch vụ gia công CNC
                      </Link>
                      <Link
                        to="/products"
                        className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      >
                        Gia công bản mã
                      </Link>
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
