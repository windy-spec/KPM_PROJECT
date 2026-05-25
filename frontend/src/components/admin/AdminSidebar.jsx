import React from 'react';
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
  Boxes,
} from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const navGroups = [
      {
        label: 'Quản trị kinh doanh',
        items: [
          { label: 'Tổng quan doanh số', icon: LayoutDashboard, panel: 'overview' },
          // point sidebar to dashboard with query so panel stays integrated
          { label: 'Quản lý sản phẩm', icon: Package, panel: 'products' },
          { label: 'Quản lý danh mục', icon: Package, panel: 'categories' },
          { label: 'Quản lý đơn hàng', icon: ShoppingCart, path: '/admin/orders' },
          { label: 'Danh sách khách hàng', icon: Users, path: '/admin/customers' },
        ],
      },
      {
        label: 'Vận hành',
        items: [
          { label: 'Lịch thi công', icon: CalendarDays },
          { label: 'Báo cáo định kỳ', icon: FileText },
        ],
      },
      {
        label: 'Hệ thống',
        items: [
          { label: 'Quản lý tài khoản', icon: Users },
          { label: 'Cài đặt chung', icon: Settings },
        ],
      },
];

const AdminSidebar = ({ activePanel = 'overview', onPanelChange = () => {} }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // backend logout failed or token expired; still clear client auth state
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      navigate('/login');
    }
  };
  return (
    <aside className="w-full lg:w-[280px] lg:min-h-screen bg-[#f4f7f7] border-r border-outline-variant/70 flex flex-col">
      <div className="h-[88px] px-5 flex items-center border-b border-outline-variant/70 bg-white">
        <div className="flex items-center gap-3 font-black text-primary">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/15">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg leading-none">KPM Admin</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant/60 mt-1">Bảng điều khiển</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="px-3 mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant/55">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                // If item defines a panel, render a button that triggers panel change (no navigation)
                if (item.panel) {
                  const isActive = activePanel === item.panel;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => onPanelChange(item.panel)}
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
                    </button>
                  );
                }

                const isActive = item.path && location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.label}
                    to={item.path || '#'}
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
    </aside>
  );
};

export default AdminSidebar;