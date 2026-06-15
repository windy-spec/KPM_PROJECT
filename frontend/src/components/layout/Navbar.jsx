import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, User, Factory, LogOut } from "lucide-react";
import { authService } from "../../services/auth.service";
import { useCart } from "../../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      className={`bg-white w-full z-50 sticky top-0 transition-all duration-200 ${
        isScrolled
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

          <div className="flex-1 max-w-2xl relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm mẫu thiết kế, vật liệu cơ khí..."
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 pl-11 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 w-4.5 h-4.5" />
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
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" /> Hồ sơ cá nhân
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-black text-error hover:bg-red-50 rounded-lg transition-colors mt-1"
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
