import React, { useEffect, useState } from "react";
import { quotationService } from "../../services/quotation.service";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { showError, showSuccess } from "../../utils/notify";
import apiClient from "../../services/apiClient";

const QuotationsTab = () => {
  const socket = useSocket();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [negotiatePrices, setNegotiatePrices] = useState({});

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleQuoteUpdated = (payload) => {
      setQuotations((prev) =>
        prev.map((q) => (q.id === payload.data.id ? payload.data : q)),
      );
      showSuccess(
        payload.message || "Yêu cầu báo giá của bạn đã được cập nhật!",
      );
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
      const res = await quotationService.getUserQuotations([
        "pending_admin",
        "sent_to_customer",
        "approved",
        "rejected",
        "under_review",
        "admin_quoted",
        "user_proposed",
        "admin_confirmed",
      ]);
      setQuotations(res.data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await quotationService.updateStatus(id, "approved");
      fetchQuotations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id) => {
    try {
      await quotationService.updateStatus(id, "rejected");
      fetchQuotations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCustomerNegotiate = async (id) => {
    const priceToSubmit = negotiatePrices[id];
    if (!priceToSubmit || isNaN(priceToSubmit) || Number(priceToSubmit) <= 0) {
      showError("Vui lòng nhập số tiền hợp lệ muốn đề xuất!");
      return;
    }
    try {
      await apiClient.put(`/quotations/${id}/negotiate`, {
        price: Number(priceToSubmit),
      });
      showSuccess("Gửi đề xuất mặc cả thành công!");
      setNegotiatePrices((prev) => ({ ...prev, [id]: "" }));
      fetchQuotations();
    } catch (e) {
      showError(err?.response?.data?.message || "Gửi đề xuất mặc cả thất bại");
    }
  };

  const handleInputChange = (id, value) => {
    setNegotiatePrices((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_admin":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" /> Đang chờ duyệt
          </span>
        );
      case "sent_to_customer":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <AlertCircle className="w-3 h-3" /> Đã báo giá (Chờ chốt)
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Khách đã chốt
          </span>
        );
      case "admin_confirmed":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
            <CheckCircle2 className="w-3 h-3" /> Đã lên đơn hàng
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Đã từ chối
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">
        Đang tải danh sách yêu cầu...
      </div>
    );

  return (
    <div className="mt-6 space-y-4">
      {quotations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant flex flex-col items-center">
          <FileText className="w-16 h-16 text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">
            Chưa có yêu cầu báo giá nào
          </h3>
          <p className="text-sm text-on-surface-variant">
            Hãy trải nghiệm tính năng yêu cầu báo giá tùy chỉnh của KPM nhé.
          </p>
        </div>
      ) : (
        quotations.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />{" "}
                  {q.title || "Yêu cầu báo giá"}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">
                  Mã YC: #{q.id.slice(0, 8).toUpperCase()} • Tạo lúc:{" "}
                  {new Date(q.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(q.status)}
                {q.status !== "pending_admin" && (
                  <p className="text-lg font-black text-error">
                    {formatCurrency(
                      q.user_proposed_price ||
                        q.admin_proposed_price ||
                        q.total_quoted_price,
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
              {q.quotation_specs?.slice(0, 2).map((spec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-bold text-on-surface">
                      {spec.component_name}
                    </p>
                    <p className="text-xs text-on-surface-variant line-clamp-1">
                      {spec.materials?.material_name} • Dày:{" "}
                      {spec.material_thickness?.thickness_value}
                    </p>
                  </div>
                </div>
              ))}
              {q.quotation_specs?.length > 2 && (
                <div className="text-xs font-bold text-primary italic flex items-center">
                  + {q.quotation_specs.length - 2} linh kiện khác...
                </div>
              )}
            </div>

            {/* Dòng hiển thị Tổng giá */}
            <div className="flex justify-between items-center bg-rose-50/30 rounded-xl px-4 py-2.5 border border-rose-100/60 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-rose-800/80">
                Tổng chi phí dự tính:
              </span>
              <span className="text-base font-black text-rose-600">
                {formatCurrency(
                  q.user_proposed_price ||
                    q.admin_proposed_price ||
                    q.total_quoted_price,
                )}
              </span>
            </div>

            <div className="flex justify-end gap-3">
              {/* Nút hành động */}
              {q.status === "sent_to_customer" && (
                <>
                  <button
                    onClick={() => handleReject(q.id)}
                    className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApprove(q.id)}
                    className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-xl hover:bg-primary-container transition-colors shadow-md shadow-primary/20"
                  >
                    Đồng ý chốt đơn
                  </button>
                </>
              )}

              {/* Khi trạng thái là admin_quoted (Xưởng đề xuất giá nhưng cho mặc cả) */}
              {q.status === "admin_quoted" && (
                <div className="border-t border-dashed border-outline-variant/40 pt-3 flex flex-col md:flex-row items-end md:items-center justify-between gap-3 bg-sky-50/20 p-3 rounded-xl border border-sky-100/50">
                  <div className="text-xs text-sky-800 font-medium">
                    💡 Bạn có thể đồng ý với giá xưởng hoặc nhập số tiền muốn
                    mặc cả thấp hơn vào ô bên cạnh:
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <input
                      type="number"
                      value={negotiatePrices[q.id] || ""}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      placeholder="Nhập giá đề xuất..."
                      className="w-full md:w-44 px-3 h-9 text-xs font-bold border border-sky-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white shadow-2xs"
                    />
                    <button
                      onClick={() => handleCustomerNegotiate(q.id)}
                      className="h-9 px-4 text-xs font-black uppercase bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all shrink-0 shadow-sm"
                    >
                      Mặc cả
                    </button>
                    <button
                      onClick={() => handleApprove(q.id)}
                      className="h-9 px-4 text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shrink-0 shadow-sm"
                    >
                      Chốt giá luôn
                    </button>
                  </div>
                </div>
              )}

              {/* Khi trạng thái là user_proposed (Khách hàng đang treo giá mặc cả đợi Admin duyệt) */}
              {q.status === "user_proposed" && (
                <div className="bg-purple-50/40 border border-purple-100 text-purple-800 p-3 rounded-xl text-xs flex items-center gap-2 italic">
                  <AlertCircle className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>
                    Hệ thống đã ghi nhận mức giá mặc cả của bạn. Vui lòng đợi
                    quản lý phân xưởng xem xét và đưa ra quyết định chốt đơn
                    cuối cùng!
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default QuotationsTab;
