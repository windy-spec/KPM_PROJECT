import React, { useEffect, useState } from 'react';
import { Package, Truck, Clock, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import orderService from '../../services/order.service';

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getMyOrders();
        if (res.success && res.data) {
          const formattedOrders = res.data.map(o => ({
            id: o.order_code,
            created_at: o.created_at,
            total_amount: parseFloat(o.total_amount) || 0,
            status: o.production_status,
            items: o.order_items?.map(i => ({
              name: i.products?.product_name || "Sản phẩm",
              specs: i.products?.materials?.material_name || ""
            })) || []
          }));
          setOrders(formattedOrders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3 h-3"/> Chờ xử lý</span>;
      case 'production':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Package className="w-3 h-3"/> Đang sản xuất</span>;
      case 'delivering':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700"><Truck className="w-3 h-3"/> Đang giao hàng</span>;
      case 'completed':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3"/> Đã hoàn thành</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="mt-6 space-y-4">
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <Package className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Bạn chưa có đơn hàng nào</h3>
          <p className="text-sm text-on-surface-variant">Các đơn hàng sau khi chốt báo giá sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                  <span className="text-primary">{order.id}</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(order.status)}
                <p className="text-lg font-black text-on-surface">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-bold text-on-surface">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">{item.specs}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                {order.status === 'completed' ? 'Đã giao hàng và thanh toán' : 'Đang cập nhật tiến độ...'}
              </div>
              <div className="flex gap-3">
                {order.status === 'completed' && (
                  <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-surface-container text-on-surface-variant rounded-xl hover:bg-outline-variant transition-colors">
                    <Download className="w-4 h-4" />
                    Tải Hóa Đơn PDF
                  </button>
                )}
                <button className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-colors shadow-sm">
                  Theo dõi đơn hàng
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersTab;
