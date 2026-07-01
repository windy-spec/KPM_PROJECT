import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Factory, LogOut, FileText } from "lucide-react";
import { authService } from "../../services/auth.service";
import { productService } from "../../services/product.service";
import { useCart } from "../../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Search Suggestion State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  // LẤY THÊM cartItems TỪ CONTEXT
  const { cartCount, cartItems } = useCart();

  const syncAuthState = async () => {
    const accessToken = localStorage.getItem("accessToken");

    setIsLoggedIn(Boolean(accessToken));

    if (!accessToken) {
      setCurrentUser(null);
      return;
    }

    try {
      const response = await authService.getMe();
      const backendUser = response.data?.data?.user || {};
      const backendProfile = response.data?.data?.profile || {};

      setCurrentUser({
        ...backendUser,
        ...backendProfile,
      });
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    syncAuthState();

    const handleStorageChange = () => syncAuthState();
    const handleScroll = () => setIsScrolled(window.scrollY > 0);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effect fetch suggestions with Debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await productService.getProducts(
          { search: searchQuery.trim(), limit: 3 },
          { headers: { "X-No-Loading": true } }
        );
        setSuggestions(res.data?.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout API errors and clear client state anyway
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      setIsLoggedIn(false);
      setCurrentUser(null);
      navigate("/login");
    }
  };

  return (
    <header
      className={`bg-white w-full z-50 sticky top-0 transition-all duration-200 ${isScrolled
        ? "shadow-none border-b border-transparent"
        : "shadow-sm border-b border-outline-variant"
        }`}
    >
      <div className="max-w-[1280px] mx-auto px-5 py-3">
        <div className="flex items-center justify-between gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            <Factory className="w-8 h-8 text-primary" />
            <span className="text-3xl font-black text-primary tracking-tighter uppercase">
              KPM
            </span>
          </Link>

          <div ref={searchRef} className="flex-1 max-w-2xl relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm mẫu thiết kế, vật liệu cơ khí..."
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 pl-11 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() !== '') {
                  setShowSuggestions(false);
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4.5 h-4.5" />
            
            {/* Gợi ý Tìm Kiếm (Dropdown) */}
            {showSuggestions && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-in fade-in zoom-in-95">
                {isSearching ? (
                  <div className="p-4 text-center text-on-surface-variant text-sm font-medium animate-pulse">
                    Đang tìm kiếm...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div>
                    {suggestions.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/product/${p.id}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-surface-container transition-colors border-b border-outline-variant/30 last:border-0 cursor-pointer"
                      >
                        <img 
                          src={p.product_images?.[0]?.image_url || "https://placehold.co/40x40/f8f9fa/a1a1aa"} 
                          alt={p.product_name} 
                          className="w-10 h-10 object-cover rounded-md border border-outline-variant/50 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{p.product_name}</p>
                          <p className="text-xs text-on-surface-variant truncate">Mã SP: {p.product_code}</p>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="p-3 text-center text-sm text-primary font-bold hover:bg-primary/5 cursor-pointer border-t border-outline-variant/50 transition-colors"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                    >
                      Xem tất cả kết quả
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-on-surface-variant text-sm font-medium">
                    Không tìm thấy kết quả phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* ---------- KHU VỰC GIỎ HÀNG MINI CART ---------- */}
                <div className="relative group flex items-center h-full py-2">
                  <Link
                    to="/cart"
                    className="p-2 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors shrink-0 mr-2"
                  >
                    <ShoppingCart className="w-5 h-5 text-on-surface-variant group-hover:text-primary" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-2 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* BẢNG XỔ XUỐNG KHI HOVER */}
                  <div className="absolute right-0 top-full mt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="w-80 bg-white border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col before:absolute before:-top-2 before:right-6 before:border-8 before:border-transparent before:border-b-white">
                      <div className="p-3 border-b border-outline-variant/40 bg-surface-container-lowest">
                        <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant/80">
                          Sản phẩm mới thêm
                        </span>
                      </div>

                      {cartItems && cartItems.length > 0 ? (
                        <>
                          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                            {/* slice(0,3) ĐỂ CHỈ LẤY 3 SẢN PHẨM ĐẦU TIÊN */}
                            {cartItems.slice(0, 3).map((item, idx) => {
                              const image =
                                item.products?.product_images?.[0]?.image_url ||
                                "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=200";
                              const name =
                                item.products?.product_name ||
                                item.quotations?.title ||
                                "Sản phẩm tùy chỉnh";
                              const price = item.price
                                ? parseFloat(item.price)
                                : 0;

                              return (
                                <Link
                                  to={`/product/${item.product_id}`}
                                  key={item.id || idx}
                                  className="flex items-center gap-3 p-3 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/30 last:border-0 group/item"
                                >
                                  <img
                                    src={image}
                                    alt={name}
                                    className="w-12 h-12 rounded-lg object-cover border border-outline-variant/40"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-on-surface truncate group-hover/item:text-primary transition-colors">
                                      {name}
                                    </p>
                                    <p className="text-[11px] text-primary font-black mt-0.5">
                                      {price.toLocaleString("vi-VN")}đ{" "}
                                      <span className="text-on-surface-variant/60 font-medium lowercase">
                                        x {item.quantity}
                                      </span>
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>

                          <div className="p-3 border-t border-outline-variant/40 bg-surface-container-lowest flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-on-surface-variant/70">
                              {cartItems.length > 3
                                ? `Và ${cartItems.length - 3} sản phẩm khác`
                                : ""}
                            </span>
                            <Link
                              to="/cart"
                              className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                            >
                              Xem giỏ hàng
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                          <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant/40 mb-3">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-on-surface-variant">
                            Chưa có sản phẩm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* ------------------------------------------------ */}

                <div className="relative group">
                  <button className="flex flex-col items-center min-w-[80px] py-1 px-2 hover:bg-primary/5 rounded-xl transition-all cursor-pointer">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-1">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-on-surface truncate max-w-[70px]">
                      {currentUser?.firstName ||
                        currentUser?.username ||
                        "Tài khoản"}
                    </span>
                  </button>

                  <div className="absolute right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-60 bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                          Hệ thống KPM
                        </p>
                        <p className="text-sm font-bold text-on-surface truncate">
                          {currentUser?.email}
                        </p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <Link
                          to="/profile?panel=overview"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                          Bảng tổng quan
                        </Link>

                        <Link
                          to="/profile?panel=quotations"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" /> Báo giá & Yêu cầu
                        </Link>

                        <Link
                          to="/profile?panel=orders"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                          Lịch sử đơn hàng
                        </Link>

                        <Link
                          to="/profile?panel=favorites"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" /> Sản phẩm yêu thích
                        </Link>

                        <Link
                          to="/profile?panel=ai_history"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="10" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" x2="8" y1="16" y2="16" /><line x1="16" x2="16" y1="16" y2="16" /></svg>
                          Lịch sử tư vấn AI
                        </Link>

                        <Link
                          to="/profile?panel=profile"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border-b border-outline-variant/30 pb-2"
                        >
                          <User className="w-4 h-4" /> Thông tin cá nhân
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-error hover:bg-red-50 rounded-lg transition-colors mt-1"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
