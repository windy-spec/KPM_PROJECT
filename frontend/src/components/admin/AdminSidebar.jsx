import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Boxes,
  Layers,
  Ruler,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const AdminSidebar = ({ onPanelChange = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Đọc dữ liệu bảng điều khiển hiện tại từ URL query parameters (?panel=...)
  const queryParams = new URLSearchParams(location.search);
  const activePanel = queryParams.get('panel') || 'overview';

  // Quản lý trạng thái đóng mở danh mục "Vật tư"
  const [isMaterialOpen, setIsMaterialOpen] = useState(
    ['materials', 'material_types', 'material_units'].includes(activePanel)
  );

  const handleLogout = async () => {
    try {
      // Gọi API đăng xuất ở Backend (nếu có cấu hình)
      await authService.logout();
    } catch (error) {
      console.warn('Backend logout failed or pending, clearing client session anyway:', error);
    } finally {
      // Bất kể API có chạy thành công hay lỗi, bắt buộc phải dọn dẹp Client và chuyển trang
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Chuyển hướng người dùng về trang đăng nhập ngay lập tức
      navigate('/login');
    }
  };

  // CHUYỂN NAVGROUPS VÀO TRONG ĐÂY: Để nhận đúng State và re-render mượt mà khi click
  const navGroups = [
    {
      label: 'Quản trị kinh doanh',
      items: [
        { label: 'Tổng quan doanh số', icon: LayoutDashboard, panel: 'overview' },
        { label: 'Quản lý sản phẩm', icon: Package, panel: 'products' },
        { label: 'Lập báo giá', icon: ShoppingCart, panel: 'pricing' },
        { label: 'Danh sách Báo giá', icon: FileText, panel: 'quotations' },
        
        // Cấu trúc dropdown Vật tư đa cấp
        {
          label: 'Vật tư',
          icon: Boxes,
          isDropdown: true,
          isOpen: isMaterialOpen,
          onToggle: () => setIsMaterialOpen(!isMaterialOpen),
          submenu: [
            { label: 'Loại vật tư', icon: Layers, panel: 'material_types' },
            { label: 'Đơn vị tính', icon: Ruler, panel: 'material_units' },
            { label: 'Quản lý vật tư', icon: Boxes, panel: 'materials' },
          ],
        },

        { label: 'Quản lý danh mục', icon: Package, panel: 'categories' },
        { label: 'Quản lý đơn hàng', icon: ShoppingCart, path: '/admin/orders' },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        { label: 'Cấu hình', icon: Settings, panel: 'settings' },
      ],
    },
  ];

  return (
    <div className="w-64 h-screen border-r border-outline-variant/70 bg-surface flex flex-col shrink-0 select-none">
      <div className="p-5 border-b border-outline-variant/70 bg-white">
        <h1 className="text-xl font-black tracking-tight text-primary flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          KPM SYSTEM
        </h1>
        <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">
          Hệ thống Quản trị
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <span className="px-3 text-[11px] font-extrabold text-on-surface-variant/50 uppercase tracking-wider block">
              {group.label}
            </span>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                // XỬ LÝ GIAO DIỆN DROPDOWN (MỤC VẬT TƯ)
                if (item.isDropdown) {
                  const isAnySubmenuActive = item.submenu.some(sub => activePanel === sub.panel);
                  
                  return (
                    <div key={item.label} className="w-full space-y-1">
                      <button
                        type="button"
                        onClick={item.onToggle}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          isAnySubmenuActive
                            ? 'bg-primary/5 text-primary'
                            : 'text-on-surface-variant hover:bg-white hover:text-primary'
                        }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate text-left">{item.label}</span>
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 opacity-60 transition-transform duration-200 ${
                            item.isOpen ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>

                      {/* Hiển thị menu con khi mở rộng */}
                      {item.isOpen && (
                        <div className="pl-4 space-y-1 border-l border-outline-variant/50 ml-5 mt-1">
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = activePanel === subItem.panel;

                            return (
                              <Link
                                key={subItem.label}
                                to={`/admin/dashboard?panel=${subItem.panel}`}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${
                                  isSubActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-on-surface-variant/80 hover:bg-white hover:text-primary'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // XỬ LÝ CÁC MENU LINK THÔNG THƯỜNG
                const isActive = item.path
                  ? location.pathname === item.path
                  : activePanel === item.panel;

                return (
                  <Link
                    key={item.label}
                    to={item.path || `/admin/dashboard?panel=${item.panel}`}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/10'
                        : 'text-on-surface-variant hover:bg-white hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate text-left">{item.label}</span>
                    </span>
                    {!isActive ? <ChevronRight className="w-4 h-4 opacity-40" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-outline-variant/70 bg-white">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;