import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChartColumn,
  CircleDollarSign,
  ClipboardList,
  UserRound,
  FileSignature,
  Ellipsis,
  ArrowDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopbar from '../../components/admin/AdminTopbar';
import AdminProductPanel from '../../components/admin/AdminProductPanel';
import ManageCategories from './ManageCategories';
import ManageMaterials from './ManageMaterials';
import ManageSettings from './ManageSettings';
import PricingForm from '../quotations/PricingForm';
import QuotationList from '../quotations/QuotationList';
import QuotationDetail from '../quotations/QuotationDetail';
import ManageMaterialTypes from '../../components/admin/ManageMaterialTypes';
import ManageMaterialUnits from '../../components/admin/ManageMaterialUnits';
import ManageInvalidBatches from './ManageInvalidBatches';
import ManageOrders from './ManageOrders';
const weeklyRevenue = [
  { name: 'Thứ 2', doanhThu: 120 },
  { name: 'Thứ 3', doanhThu: 240 },
  { name: 'Thứ 4', doanhThu: 180 },
  { name: 'Thứ 5', doanhThu: 320 },
  { name: 'Thứ 6', doanhThu: 290 },
  { name: 'Thứ 7', doanhThu: 410 },
  { name: 'Chủ Nhật', doanhThu: 350 },
];

const stats = [
  {
    title: 'Tổng doanh thu tháng',
    value: '1.240 tỷ',
    subtext: '+12.5% so với tháng trước',
    icon: CircleDollarSign,
    trend: '+12.5% ↗',
    tone: 'teal',
  },
  {
    title: 'Đơn hàng mới hôm nay',
    value: '14',
    subtext: 'Cập nhật 5 phút trước',
    icon: ClipboardList,
    trend: '+8 đơn',
    tone: 'teal',
  },
  {
    title: 'Khách hàng mới',
    value: '28',
    subtext: 'Toàn quốc',
    icon: UserRound,
  },
  {
    title: 'Hợp đồng chờ ký',
    value: '06',
    subtext: 'Cần xử lý gấp',
    icon: FileSignature,
    trend: 'Cần xử lý',
    tone: 'amber',
  },
];

const topProducts = [
  { label: 'Cổng Sắt CNC', percentage: 45 },
  { label: 'Lan Can Cầu Thang', percentage: 25 },
  { label: 'Kết Cấu Thép', percentage: 20 },
  { label: 'Phụ Kiện Khác', percentage: 10 },
];

const orders = [
  {
    code: '#KPM-2024-001',
    customer: 'Nguyễn Văn A',
    date: '08/05/2026',
    product: 'Cổng Sắt CNC 4 Cánh',
    value: '45.000.000đ',
    status: 'Đang sản xuất',
  },
  {
    code: '#KPM-2024-002',
    customer: 'Trần Thị B',
    date: '07/05/2026',
    product: 'Lan Can Sắt Nghệ Thuật',
    value: '12.500.000đ',
    status: 'Hoàn tất',
  },
];



const StatCard = ({ title, value, subtext, icon: Icon, trend, tone }) => (
  <div className="bg-white border border-outline-variant/70 rounded-2xl p-5 shadow-sm min-h-[132px] flex flex-col justify-between">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">{title}</p>
        <h3 className="mt-2 text-2xl md:text-[28px] font-black text-on-surface tracking-tight">{value}</h3>
      </div>
      <div className="w-10 h-10 rounded-xl bg-surface-container/70 flex items-center justify-center text-primary">
        <Icon className="w-5 h-5" />
      </div>
    </div>

    <div className="pt-3 mt-3 border-t border-dashed border-outline-variant/40 flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-on-surface-variant/70">{subtext}</span>
      {trend ? (
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.18em] ${
            tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
          }`}
        >
          {trend}
        </span>
      ) : null}
    </div>
  </div>
);

const Dashboard = () => {
  const location = useLocation();
  
  // 1. Khởi tạo state ban đầu dựa trên URL hiện tại
  const getPanelFromUrl = () => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('panel') || 'overview';
  };

  const [activePanel, setActivePanel] = useState(getPanelFromUrl);

  // 2. QUAN TRỌNG: Lắng nghe URL thay đổi khi bấm vào Sidebar để ép Dashboard chuyển trang
  useEffect(() => {
    const currentPanel = getPanelFromUrl();
    setActivePanel(currentPanel);
  }, [location.search]); // Mỗi khi query ?panel=... thay đổi, hàm này sẽ chạy

  return (
    <div className="min-h-screen bg-[#f6f8f8] text-on-surface">
      <div className="flex flex-col lg:flex-row min-h-screen">
        <AdminSidebar activePanel={activePanel} onPanelChange={(p) => setActivePanel(p)} />

        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar />

          <main className="p-4 md:p-6 xl:p-8 space-y-6">
            {activePanel === 'overview' && (
              <>
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {stats.map((item) => (
                    <StatCard key={item.title} {...item} />
                  ))}
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                  <div className="xl:col-span-2 bg-white border border-outline-variant/70 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-2">
                        <ChartColumn className="w-4.5 h-4.5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-[0.22em]">Biến động doanh thu theo tuần</h2>
                      </div>

                      <div className="flex rounded-lg bg-surface-container/80 p-0.5 text-[10px] font-black uppercase tracking-[0.18em]">
                        <button type="button" className="px-3 py-1.5 rounded-md bg-white text-primary shadow-sm">Tuần này</button>
                        <button type="button" className="px-3 py-1.5 rounded-md text-on-surface-variant/60">Tháng trước</button>
                      </div>
                    </div>

                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyRevenue} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eded" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                          <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                          <Tooltip cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="doanhThu" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-on-surface-variant/55 font-bold uppercase tracking-[0.2em]">
                      <span>Thứ 2</span>
                      <span>Thứ 3</span>
                      <span>Thứ 4</span>
                      <span>Thứ 5</span>
                      <span>Thứ 6</span>
                      <span>Thứ 7</span>
                      <span>Chủ Nhật</span>
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/70 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <Ellipsis className="w-4.5 h-4.5 text-primary rotate-90" />
                      <h2 className="text-sm font-black uppercase tracking-[0.22em]">Tỷ lệ sản phẩm bán chạy</h2>
                    </div>

                    <div className="space-y-4">
                      {topProducts.map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                            <span className="text-on-surface-variant">{item.label}</span>
                            <span className="font-black text-on-surface">{item.percentage}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-dashed border-outline-variant/40 text-center">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/50 px-4 py-3 text-[11px] font-semibold text-on-surface-variant/80 bg-surface-container/20">
                        <ArrowDown className="w-4 h-4 text-primary" />
                        Thống kê dựa trên 120 đơn hàng gần nhất
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-outline-variant/70 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">Đơn hàng mới cập nhật</h2>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button type="button" className="px-3 py-2 border border-outline-variant rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-surface-container transition-colors">
                        <span className="inline-block w-3.5 h-0.5 bg-on-surface-variant/60 rounded-full" /> Bộ lọc
                      </button>
                      <button type="button" className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-container transition-all">
                        Xuất Excel
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[820px]">
                      <thead>
                        <tr className="bg-surface-container/40 border-b border-outline-variant/40 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                          <th className="p-4 pl-6">Mã đơn</th>
                          <th className="p-4">Khách hàng</th>
                          <th className="p-4">Ngày đặt</th>
                          <th className="p-4">Sản phẩm</th>
                          <th className="p-4">Giá trị</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 pr-6 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 text-xs font-bold text-on-surface-variant">
                        {orders.map((order) => (
                          <tr key={order.code} className="hover:bg-surface-container/20 transition-colors">
                            <td className="p-4 pl-6 font-mono text-on-surface">{order.code}</td>
                            <td className="p-4 text-on-surface">{order.customer}</td>
                            <td className="p-4 opacity-75">{order.date}</td>
                            <td className="p-4 text-on-surface max-w-xs truncate">{order.product}</td>
                            <td className="p-4 font-black text-on-surface">{order.value}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] ${
                                order.status === 'Hoàn tất'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex items-center justify-center gap-2">
                                <button type="button" className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Chỉnh sửa">
                                  <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                                </button>
                                <button type="button" className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors" title="Xem chi tiết">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {activePanel === 'products' && (
              <section>
                <AdminProductPanel />
              </section>
            )}

            {activePanel === 'categories' && (
              <section>
                <ManageCategories />
              </section>
            )}

            {activePanel === 'materials' && (
              <section>
                <ManageMaterials />
              </section>
            )}

            {activePanel === 'material_types' && (
              <section>
                <ManageMaterialTypes />
              </section>
            )}

            {activePanel === 'material_units' && (
              <section>
                <ManageMaterialUnits />
              </section>
            )}

            {activePanel === 'settings' && (
              <section>
                <ManageSettings />
              </section>
            )}

            {activePanel === 'pricing' && (
              <section>
                <PricingForm />
              </section>
            )}

            {activePanel === 'quotations' && (
              <section>
                <QuotationList onOpen={(id)=>{ setActivePanel('quotation_detail'); localStorage.setItem('activeQuotationId', id); }} />
              </section>
            )}

            {activePanel === 'quotation_detail' && (
              <section>
                <QuotationDetail onBack={()=>{ setActivePanel('quotations'); localStorage.removeItem('activeQuotationId'); }} />
              </section>
            )}

            {activePanel === 'invalid_batches' && (
              <section>
                <ManageInvalidBatches />
              </section>
            )}

            {activePanel === 'orders' &&(
              <section>
                <ManageOrders />
              </section>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;