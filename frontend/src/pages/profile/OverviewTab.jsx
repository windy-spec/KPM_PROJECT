import React, { useState, useEffect } from 'react';
import { CircleDollarSign, ClipboardList, FileSignature, MessageSquareCode, Activity, ArrowRight, ArrowUpRight } from 'lucide-react';
import userService from '../../services/user.service';
import { useNavigate } from 'react-router-dom';

const OverviewTab = ({ user }) => {
  const navigate = useNavigate();
  const [profileStats, setProfileStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await userService.getProfileStats();
        if (res.success) {
          setProfileStats(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const stats = [
    { title: 'Đơn hàng', value: profileStats?.totalOrders || 0, icon: ClipboardList, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Yêu cầu đang chờ', value: profileStats?.pendingQuotations || 0, icon: FileSignature, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Tổng chi tiêu', value: profileStats ? formatCurrency(profileStats.totalSpent) : '0đ', icon: CircleDollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Tư vấn AI', value: profileStats?.aiConsultations || 0, icon: MessageSquareCode, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // Lấy danh sách 5 hoạt động gần nhất đã trộn ở backend
  const recentActivities = profileStats?.recentActivities || [];

  return (
    <div className="mt-6 space-y-6">
      {/* Lời chào */}
      <div className="bg-gradient-to-r from-primary to-teal-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-primary/20">
        <div>
          <h2 className="text-2xl font-black mb-2">Xin chào, {user.firstName || 'bạn'}! 👋</h2>
          <p className="text-white/80 text-sm font-medium">Chào mừng trở lại trung tâm quản lý cá nhân KPM Industrial. Dưới đây là tóm tắt hoạt động của bạn.</p>
        </div>
        <button className="px-6 py-3 bg-white text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-surface-container transition-colors shadow-sm whitespace-nowrap">
          Tạo Báo Giá Mới
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 mb-1">{stat.title}</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-black text-on-surface">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Hoạt động gần đây */}
      <div className="bg-white p-6 rounded-2xl border border-outline-variant/40 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-base font-black text-on-surface uppercase tracking-tight">Hoạt động gần đây</h3>
          </div>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-surface-container-highest">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative pl-8 py-3">
                <span className={`absolute left-0 top-4 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center
                  ${act.id.startsWith('order') ? 'bg-teal-500' : 'bg-amber-500'}
                `}></span>
                <div
                  onClick={() => {
                    if (act.id.startsWith('order')) {
                      navigate('?panel=orders');
                    } else {
                      navigate('?panel=quotations');
                    }
                  }}
                  className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 hover:border-primary/30 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {act.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">
                        {formatDate(act.time)}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-on-surface-variant">
            Chưa ghi nhận hoạt động nào gần đây.
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
