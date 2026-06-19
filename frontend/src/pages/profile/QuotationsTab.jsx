import React, { useEffect, useState } from 'react';
import { quotationService } from '../../services/quotation.service';
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Eye, ChevronRight } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { showSuccess } from '../../utils/notify';

const QuotationsTab = () => {
  const socket = useSocket();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleQuoteUpdated = (payload) => {
      setQuotations(prev => prev.map(q => q.id === payload.data.id ? payload.data : q));
      showSuccess(payload.message || "Yêu cầu báo giá của bạn đã được cập nhật!");
    };

    socket.on("quote_status_changed", handleQuoteUpdated);
    socket.on("quote_updated", handleQuoteUpdated);

    return () => {
      socket.off("quote_status_changed", handleQuoteUpdated);
      socket.off("quote_updated", handleQuoteUpdated);
    };
  }, [socket]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await quotationService.getUserQuotations(['pending_admin', 'sent_to_customer', 'approved', 'rejected']);
      setQuotations(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await quotationService.updateStatus(id, 'approved');
      fetchQuotations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id) => {
    try {
      await quotationService.updateStatus(id, 'rejected');
      fetchQuotations();
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_admin':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3 h-3"/> Đang chờ duyệt</span>;
      case 'sent_to_customer':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><AlertCircle className="w-3 h-3"/> Đã báo giá (Chờ chốt)</span>;
      case 'approved':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3"/> Đã chốt đơn</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3"/> Đã từ chối</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Đang tải danh sách yêu cầu...</div>;

  return (
    <div className="mt-6 space-y-4">
      {quotations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <FileText className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Chưa có yêu cầu báo giá nào</h3>
          <p className="text-sm text-on-surface-variant">Hãy trải nghiệm tính năng yêu cầu báo giá tùy chỉnh của KPM nhé.</p>
        </div>
      ) : (
        quotations.map(q => (
          <div key={q.id} className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> {q.title || 'Yêu cầu báo giá'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Mã YC: #{q.id.slice(0, 8).toUpperCase()} • Tạo lúc: {new Date(q.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(q.status)}
                {q.status !== 'pending_admin' && (
                  <p className="text-lg font-black text-error">{formatCurrency(q.user_proposed_price || q.admin_proposed_price || q.total_quoted_price)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
              {q.quotation_specs?.slice(0, 2).map((spec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-bold text-on-surface">{spec.component_name}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{spec.materials?.material_name} • Dày: {spec.material_thickness?.thickness_value}</p>
                  </div>
                </div>
              ))}
              {q.quotation_specs?.length > 2 && (
                <div className="text-xs font-bold text-primary italic flex items-center">
                  + {q.quotation_specs.length - 2} linh kiện khác...
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {/* Nút hành động */}
              {q.status === 'sent_to_customer' && (
                <>
                  <button onClick={() => handleReject(q.id)} className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                    Từ chối
                  </button>
                  <button onClick={() => handleApprove(q.id)} className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl hover:bg-primary-container transition-colors shadow-md shadow-primary/20">
                    Đồng ý chốt đơn
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default QuotationsTab;
