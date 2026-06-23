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
  AlertCircle,
  User,
  ClipboardList
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';


const AdminSidebar = ({ onPanelChange = () => { } }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Đọc dữ liệu bảng điều khiển hiện tại từ URL query parameters (?panel=...)
  const queryParams = new URLSearchParams(location.search);
  const activePanel = queryParams.get('panel') || 'overview';

  // Quản lý trạng thái đóng mở danh mục "Cấu hình & Vật tư"
  const [isConfigOpen, setIsConfigOpen] = useState(
    ['settings_thickness', 'settings_paint', 'settings_labor', 'materials', 'material_types', 'material_units'].includes(activePanel)
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
        { label: 'Tổng Quan Doanh Số', icon: LayoutDashboard, panel: 'overview' },
        { label: 'Quản Lý Sản Phẩm', icon: Package, panel: 'products' },
        { label: 'Danh Sách Báo Giá', icon: FileText, panel: 'quotations' },
        { label: 'Quản Lý Danh Mục', icon: Package, panel: 'categories' },
        { label: 'Quản Lý Lô', icon: Package, panel: 'invalid_batches' },
        { label: 'Quản Lý Đơn Hàng', icon: ShoppingCart, panel: 'orders' },
        { label: 'Quản Lý User', icon: User, panel: 'users' },
        { label: 'Mẫu Linh Kiện', icon: Layers, panel: 'component_templates' },
        { label: 'Phê duyệt sản xuất', icon: ClipboardList, panel: 'production_requests' },
        { label: 'Yêu Cầu Nhập Vật Tư', icon: ClipboardList, panel: 'material_requests' },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        // Gộp Cấu hình và Vật tư vào chung 1 Dropdown
        {
          label: 'Cấu hình & Vật tư',
          icon: Settings,
          isDropdown: true,
          isOpen: isConfigOpen,
          onToggle: () => setIsConfigOpen(!isConfigOpen),
          submenu: [
            { label: 'Hệ Số Độ Dày', icon: Ruler, panel: 'settings_thickness' },
            { label: 'Đơn Giá Sơn', icon: Layers, panel: 'settings_paint' },
            { label: 'Bảng Giá Nhân Công', icon: Users, panel: 'settings_labor' },
            { label: 'Loại Vật Tư', icon: Layers, panel: 'material_types' },
            { label: 'Đơn Vị Tính', icon: Ruler, panel: 'material_units' },
            { label: 'Quản Lý Vật Tư', icon: Boxes, panel: 'materials' },

          ],
        },
      ],
    },
  ];

  return (
    <div className="sticky top-0 left-0 z-40 w-64 min-w-[256px] max-w-[256px] h-screen bg-surface border-r border-outline-variant/70 flex flex-col shrink-0 lg:flex flex-none select-none overflow-hidden">
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

                // XỬ LÝ GIAO DIỆN DROPDOWN (MỤC VẬT TƯ VÀ CẤU HÌNH)
                if (item.isDropdown) {
                  const isAnySubmenuActive = item.submenu.some(sub => activePanel === sub.panel);

                  return (
                    <div key={item.label} className="w-full space-y-1">
                      <button
                        type="button"
                        onClick={item.onToggle}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isAnySubmenuActive
                          ? 'bg-primary/5 text-primary'
                          : 'text-on-surface-variant hover:bg-white hover:text-primary'
                          }`}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate text-left">{item.label}</span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 opacity-60 transition-transform duration-200 ${item.isOpen ? 'rotate-180' : ''
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
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${isSubActive
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
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
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
    </div>
  );
};

export default AdminSidebar;