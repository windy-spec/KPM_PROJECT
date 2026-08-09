import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, User, LogOut, ChevronDown, AlertTriangle, Package } from 'lucide-react';
import { authService } from "../../services/auth.service";
import apiClient from "../../services/apiClient";
import orderService from "../../services/order.service";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

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

      // Lấy danh sách tồn kho thấp
      fetchLowStock();
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await apiClient.get('/warehouse/inventory/low-stock');
      if (res.data?.success) {
        setLowStockItems(res.data.data);
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách tồn kho thấp:", e);
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

  // Effect fetch order suggestions with Debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await orderService.getAllOrders({ headers: { "X-No-Loading": true } });
        if (res.success && res.data) {
          const lowerQuery = searchQuery.toLowerCase().trim();
          const filtered = res.data.filter((order) => {
            const matchesSearch =
              (order.order_code && order.order_code.toLowerCase().includes(lowerQuery)) ||
              (order.users?.username && order.users.username.toLowerCase().includes(lowerQuery)) ||
              (order.quotations?.users?.username && order.quotations.users.username.toLowerCase().includes(lowerQuery)) ||
              (order.users?.phone && order.users.phone.includes(lowerQuery)) ||
              (order.quotations?.users?.phone && order.quotations.users.phone.includes(lowerQuery));
            return matchesSearch;
          });
          setSuggestions(filtered.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi lấy order gợi ý:", error);
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
    <header className={`h-[88px] px-6 flex items-center justify-between bg-white border-b border-outline-variant/70 sticky top-0 z-40 transition-shadow ${isScrolled ? "shadow-md shadow-surface-container-low/30" : ""
      }`}>
      <div className="flex items-center gap-3 ml-auto">

        {/* Nút Thông báo (Low Stock) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full hover:bg-surface-container transition-colors relative text-on-surface-variant hover:text-primary"
          >
            <Bell className="w-5 h-5" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full animate-pulse border-2 border-white"></span>
            )}
          </button>

          {/* Menu Dropdown Thông báo */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
                <h3 className="text-sm font-bold text-on-surface">Thông báo</h3>
                <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded-full">{lowStockItems.length} Mới</span>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item, idx) => (
                    <div key={idx} className="p-3 hover:bg-surface-container/50 rounded-xl transition-colors border-b border-outline-variant/30 last:border-0 flex gap-3 items-start">
                      <div className="p-2 bg-error/10 text-error rounded-full shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface mb-0.5">Sắp hết vật liệu</p>
                        <p className="text-xs text-on-surface-variant">
                          <span className="font-bold">{item.materials?.material_name}</span> chỉ còn <span className="text-error font-bold">{item.quantity}</span> đơn vị.
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-outline font-medium">
                    Không có thông báo mới.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={searchRef} className="hidden md:block relative min-w-[280px]">
          <label className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/70 bg-surface-container/30">
            <Search className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
            <input
              type="text"
              placeholder="Tìm đơn hàng, khách hàng"
              className="w-full bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/45"
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
                  navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </label>

          {/* Dropdown Gợi ý Order */}
          {showSuggestions && searchQuery.trim() !== "" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant overflow-hidden z-50 animate-in fade-in zoom-in-95">
              {isSearching ? (
                <div className="p-4 text-center text-on-surface-variant text-sm font-medium animate-pulse">
                  Đang tìm kiếm...
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  {suggestions.map(order => {
                    const customerName = order.users?.username || order.quotations?.users?.username || "Khách";
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/admin/orders?search=${encodeURIComponent(order.order_code)}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-surface-container transition-colors border-b border-outline-variant/30 last:border-0 cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{order.order_code}</p>
                          <p className="text-xs text-on-surface-variant truncate">KH: {customerName}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    className="p-3 text-center text-sm text-primary font-bold hover:bg-primary/5 cursor-pointer border-t border-outline-variant/50 transition-colors"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                  >
                    Xem tất cả kết quả
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-on-surface-variant text-sm font-medium">
                  Không tìm thấy đơn hàng.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------- KHU VỰC DROPDOWN MENU TÀI KHOẢN ---------- */}
        <div className="flex items-center gap-4 border-l border-outline-variant/60 pl-4 h-8">
          {isLoggedIn ? (
            <div className="relative group flex items-center h-full cursor-pointer">
              {/* Nút bấm hiển thị User (Hover hoặc Click để mở dropdown) */}
              <div className="flex items-center gap-2 hover:bg-primary/5 px-2 py-1.5 rounded-xl transition-all">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden sm:flex flex-col items-start max-w-[100px]">
                  <span className="text-xs font-black text-on-surface truncate w-full">
                    {currentUser?.firstName || currentUser?.username || "Admin"}
                  </span>
                  <span className="text-[10px] font-medium text-on-surface-variant/70">Quản trị viên</span>
                </div>
                <ChevronDown className="w-3 h-3 text-on-surface-variant/65 group-hover:text-primary transition-transform group-hover:rotate-180" />
              </div>

              {/* BẢNG MENU XỔ XUỐNG KHI HOVER VÀO KHU VỰC USER */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="w-60 bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
                  {/* Header thu nhỏ trong Dropdown */}
                  <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary">Hệ thống KPM_System</p>
                    <p className="text-sm font-bold text-on-surface truncate mt-0.5">{currentUser?.email || 'admin@kpm.com'}</p>
                  </div>

                  {/* Các Action Links */}
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-black text-error hover:bg-red-50 rounded-lg transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Trường hợp chưa đăng nhập */
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-primary text-white rounded-xl hover:bg-primary-dark transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;