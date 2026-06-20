import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { authService } from "../../services/auth.service";

const WarehouseTopbar = ({ title = "Tổng quan kho", subTitle = "Thống kê tồn kho" }) => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Đồng bộ trạng thái đăng nhập và thông tin tài khoản giống AdminTopbar
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

        // Lắng nghe sự kiện click ra ngoài để đóng dropdown menu nhanh
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("scroll", handleScroll, { passive: true });
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.warn('Backend logout failed or pending, clearing client tokens anyway.');
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("auth-change"));
            navigate("/login");
        }
    };

    return (
        <header className={`h-[88px] px-6 flex items-center justify-between bg-white border-b border-outline-variant/70 sticky top-0 z-40 transition-shadow ${isScrolled ? "shadow-md shadow-surface-container-low/30" : ""
            }`}>
            {/* Khối tiêu đề bên trái */}
            <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-on-surface-variant/70">{subTitle}</p>
                <h1 className="mt-1 text-xl font-black text-on-surface">{title}</h1>
            </div>

            {/* Khối chức năng bên phải */}
            <div className="flex items-center gap-4">
                {/* Thanh tìm kiếm vật tư */}
                <label className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/70 bg-surface-container/30 min-w-[280px]">
                    <Search className="w-4 h-4 text-on-surface-variant/50" />
                    <input type="text" placeholder="Tìm vật tư, mã cấu kiện..." className="w-full bg-transparent outline-none text-sm" />
                </label>

                {/* Khu vực Dropdown thông tin tài khoản Thủ Kho */}
                <div className="flex items-center gap-4 border-l border-outline-variant/60 pl-4 h-8">
                    {isLoggedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* Nút kích hoạt mở Dropdown */}
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 px-2 rounded-xl transition-all cursor-pointer select-none"
                            >
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center border border-teal-200 shadow-inner">
                                    <User className="w-4 h-4 text-teal-700" />
                                </div>
                                <div className="hidden sm:flex flex-col text-left">
                                    <span className="text-xs font-black text-on-surface max-w-[120px] truncate">
                                        {currentUser?.username || "Thủ Kho KPM"}
                                    </span>
                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">Admin Kho</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-on-surface-variant/70 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Nội dung Dropdown Menu */}
                            <div className={`absolute right-0 mt-2 w-60 bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 origin-top-right z-50 ${isDropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                                }`}>
                                {/* Header thu nhỏ trong Dropdown */}
                                <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-teal-600">Hệ thống KPM_System</p>
                                    <p className="text-sm font-bold text-on-surface truncate mt-0.5">{currentUser?.email || 'warehouse@kpm.com'}</p>
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

export default WarehouseTopbar;