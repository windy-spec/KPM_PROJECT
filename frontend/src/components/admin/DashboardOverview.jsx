import React from 'react';
import { 
  DollarSign, ShoppingBag, Users, FileSignature, 
  TrendingUp, Bell, Search 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';

import StatCard from "./StatsCard";
import AdminProductPanel from './AdminProductPanel';
import ManageCategories from '../../pages/admin/ManageCategories';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../../services/admin.service';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProducts: 0, totalMaterials: 0, totalCategories: 0 });
  const [chartData, setChartData] = useState([
    { name: 'Thứ 2', doanhThu: 120 },
    { name: 'Thứ 3', doanhThu: 240 },
    { name: 'Thứ 4', doanhThu: 180 },
    { name: 'Thứ 5', doanhThu: 320 },
    { name: 'Thứ 6', doanhThu: 290 },
    { name: 'Thứ 7', doanhThu: 410 },
    { name: 'Chủ Nhật', doanhThu: 350 },
  ]);

  const [recentItems, setRecentItems] = useState([]);
  const [searchParams] = useSearchParams();
  const productRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoading(true);
      try {
        const [productsRes, materialsRes, categoriesRes] = await Promise.all([
          adminService.getProducts({ page: 1, limit: 10 }),
          adminService.getMaterials({ page: 1, limit: 10 }),
          adminService.getCategories({ page: 1, limit: 10 }),
        ]);

        if (!mounted) return;

        const totalProducts = Array.isArray(productsRes.data?.data) ? productsRes.data.data.length : (productsRes.data?.pagination?.total || 0);
        const totalMaterials = Array.isArray(materialsRes.data?.data) ? materialsRes.data.data.length : (materialsRes.data?.pagination?.total || 0);
        const totalCategories = Array.isArray(categoriesRes.data?.data) ? categoriesRes.data.data.length : (categoriesRes.data?.pagination?.total || 0);

        setStats({ totalProducts, totalMaterials, totalCategories });

        // Prepare recent items: use first products as recent entries
        const recentProducts = Array.isArray(productsRes.data?.data) ? productsRes.data.data.slice(0, 6) : [];
        const mapped = recentProducts.map((p) => ({
          id: p.id || p._id || Math.random().toString(36).slice(2, 9),
          code: p.product_code || p.sku || `PR-${p.id || ''}`,
          customer: p.supplier || p.brand || '-',
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-',
          product: p.name || p.title || 'Sản phẩm',
          value: p.price ? `${p.price}đ` : (p.price_vnd || '-'),
          status: p.status || 'Mới',
        }));

        setRecentItems(mapped);
      } catch (e) {
        // fallback: keep existing mock chart/data if API not available or error
        console.warn('Không thể tải dữ liệu admin overview:', e?.message || e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const panel = searchParams.get('panel');
    if (!panel) return;

    // small timeout to allow layout to settle before scrolling
    setTimeout(() => {
      if (panel === 'products' && productRef.current) {
        productRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (panel === 'categories' && categoryRef.current) {
        categoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }, [searchParams]);

  return (
    <div className="p-6 md:p-8 bg-surface-container/20 min-h-screen text-on-surface font-sans">
      
      {/* TOPBAR: Tìm kiếm & Thông tin Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant/80">
            Thống kê kinh doanh
          </h2>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto w-full sm:w-auto">
          {/* Ô tìm kiếm nhanh */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm đơn hàng, khách hàng..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant/60 rounded-xl text-xs font-bold outline-none focus:border-primary transition-colors"
            />
          </div>
          {/* Chuông thông báo */}
          <button className="p-2 bg-white border border-outline-variant/60 rounded-xl relative hover:bg-surface-container transition-colors">
            <Bell className="w-4 h-4 text-on-surface-variant" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {/* Avatar Admin */}
          <div className="w-9 h-9 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center shadow-md shadow-primary/10">
            A
          </div>
        </div>
      </header>

      {/* 1. LƯỚI THẺ THỐNG KÊ (GRID STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Tổng doanh thu tháng" value="1.240 tỷ" subtext="+12.5% so với tháng trước" icon={DollarSign} trend="+12.5% ↗" trendColor="green" />
        <StatCard title="Đơn hàng mới hôm nay" value="14" subtext="Cập nhật 5 phút trước" icon={ShoppingBag} trend="+8 đơn" trendColor="green" />
        <StatCard title="Khách hàng mới" value="28" subtext="Trên toàn quốc" icon={Users} />
        <StatCard title="Hợp đồng chờ ký" value="06" subtext="Cần xử lý gấp" icon={FileSignature} trend="Cần xử lý" trendColor="amber" />
      </div>

      {/* 2. KHỐI ĐỒ THỊ & TỶ LỆ SẢN PHẨM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Biểu đồ biến động doanh thu */}
        <div className="lg:col-span-2 bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Biến động doanh thu theo tuần
            </h3>
            <div className="flex bg-surface-container rounded-lg p-0.5 text-[10px] font-black uppercase">
              <button className="px-3 py-1.5 bg-white shadow-xs rounded-md text-primary">Tuần này</button>
              <button className="px-3 py-1.5 text-on-surface-variant/60">Tháng trước</button>
            </div>
          </div>
          
          <div className="w-full h-64 text-xs font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="doanhThu" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tỷ lệ sản phẩm bán chạy */}
        <div className="bg-white border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider mb-6">
              Tỷ lệ sản phẩm bán chạy
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Cổng Sắt CNC', percentage: 45 },
                { label: 'Lan Can Cầu Thang', percentage: 25 },
                { label: 'Kết Cấu Thép', percentage: 20 },
                { label: 'Phụ Kiện Khác', percentage: 10 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface-variant">{item.label}</span>
                    <span className="text-on-surface font-black">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/40 text-center text-[10px] text-on-surface-variant/50 font-bold">
            Thống kê dựa trên 120 đơn hàng gần nhất
          </div>
        </div>
      </div>

      {/* 3. KHỐI QUẢN LÝ SẢN PHẨM */}
      <div ref={productRef}>
        <AdminProductPanel />
      </div>

      {/* 4. KHỐI QUẢN LÝ DANH MỤC (tích hợp) */}
      <div ref={categoryRef} className="mt-6">
        <ManageCategories />
      </div>
    </div>
  );
};

export default DashboardOverview;