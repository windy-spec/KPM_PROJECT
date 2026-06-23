import React, { useState } from 'react';
import { LayoutDashboard, Boxes, Layers, Ruler, ClipboardList, LogOut, ChevronRight, ChevronDown, ClipboardCheck, Box } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const WarehouseSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const activePanel = queryParams.get('panel') || 'overview';

    const [isConfigOpen, setIsConfigOpen] = useState(
        ['material_types', 'material_units', 'materials'].includes(activePanel)
    );

    const handleLogout = async () => {
        try { await authService.logout(); } catch (e) { console.warn(e); }
        finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    const navGroups = [
        {
            label: 'Luồng Công Việc',
            items: [
                { label: 'Tổng Quan Tồn Kho', icon: LayoutDashboard, panel: 'overview' },
                { label: 'Yêu Cầu Xuất Vật Tư', icon: ClipboardList, panel: 'export_requests' },
                { label: 'Lịch Sử Phiếu Xuất', icon: ClipboardList, panel: 'export_history' },
                { label: 'Lập Phiếu Đề Xuất Nhập', icon: ClipboardCheck, panel: 'request' },
                { label: 'Quản Lý Đề Xuất Nhập', icon: Layers, panel: 'material_requests' },
            ],
        },
        {
            label: 'Quản Trị Kho',
            items: [
                { label: 'Quản Lý Tồn Kho Thực', icon: Box, panel: 'inventory' },
                {
                    label: 'Danh Mục Cấu Hình',
                    icon: Ruler,
                    isDropdown: true,
                    isOpen: isConfigOpen,
                    onToggle: () => setIsConfigOpen(!isConfigOpen),
                    submenu: [
                        { label: 'Loại Vật Tư', panel: 'material_types' },
                        { label: 'Đơn Vị Tính', panel: 'material_units' },
                        { label: 'Danh Sách Vật Tư', panel: 'materials' },
                    ],
                },
            ],
        }
    ];

    return (
        <div className="sticky top-0 left-0 z-40 w-64 min-w-[256px] h-screen bg-surface border-r border-outline-variant/70 flex flex-col shrink-0 select-none overflow-hidden">
            <div className="p-5 border-b border-outline-variant/70 bg-white">
                <h1 className="text-xl font-black tracking-tight text-primary flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-teal-600 animate-pulse" />
                    KPM WAREHOUSE
                </h1>
                <p className="text-[10px] font-bold text-teal-700/80 uppercase tracking-widest mt-1">
                    Quản Lý Kho Vật Tư
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navGroups.map((group) => (
                    <div key={group.label} className="space-y-2">
                        <span className="px-3 text-[11px] font-extrabold text-on-surface-variant/50 uppercase tracking-wider block">{group.label}</span>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                if (item.isDropdown) {
                                    const isSubActive = item.submenu.some(sub => activePanel === sub.panel);
                                    return (
                                        <div key={item.label} className="w-full space-y-1">
                                            <button onClick={item.onToggle} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isSubActive ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary'}`}>
                                                <span className="flex items-center gap-3"><Icon className="w-4 h-4" /><span className="truncate">{item.label}</span></span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {item.isOpen && (
                                                <div className="pl-4 space-y-1 border-l border-outline-variant/50 ml-5 mt-1">
                                                    {item.submenu.map((sub) => (
                                                        <Link key={sub.panel} to={`/admin/warehouse?panel=${sub.panel}`} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold ${activePanel === sub.panel ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant/80 hover:bg-white hover:text-primary'}`}>
                                                            <span className="truncate">{sub.label}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                const isActive = activePanel === item.panel;
                                return (
                                    <Link key={item.panel} to={`/admin/warehouse?panel=${item.panel}`} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-white hover:text-primary'}`}>
                                        <span className="flex items-center gap-3"><Icon className="w-4 h-4" /><span>{item.label}</span></span>
                                        {!isActive && <ChevronRight className="w-4 h-4 opacity-40" />}
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

export default WarehouseSidebar;