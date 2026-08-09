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
  Download,
  ExternalLink,
  Paperclip,
  PhoneCall,
  MessageSquare,
  Delete,
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { showError, showSuccess } from "../../utils/notify";
import apiClient from "../../services/apiClient";
import Portal from "../../components/common/Portal";

const QuotationsTab = ({ user }) => {
  const socket = useSocket();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);
  
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const [contactModalId, setContactModalId] = useState(null);
  const [contactMethod, setContactMethod] = useState("Zalo");
  const [contactInfo, setContactInfo] = useState("");

  const [negotiatePrices, setNegotiatePrices] = useState({});

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    if (contactModalId && user) {
      if (contactMethod === "Zalo") {
        setContactInfo(user.zaloNumber || user.phoneNumber || "");
      } else {
        setContactInfo(user.phoneNumber || "");
      }
    }
  }, [contactMethod, contactModalId, user]);

  useEffect(() => {
    if (!socket) return;

    const handleQuoteUpdated = (payload) => {
      fetchQuotations();
    };

    socket.on("quote_status_changed", handleQuoteUpdated);
    socket.on("quote_updated", handleQuoteUpdated);
    socket.on("quote_deletion_requested", handleQuoteUpdated);
    socket.on("quote_deletion_rejected", handleQuoteUpdated);
    socket.on("quote_deletion_approved", handleQuoteUpdated);

    return () => {
      socket.off("quote_status_changed", handleQuoteUpdated);
      socket.off("quote_updated", handleQuoteUpdated);
      socket.off("quote_deletion_requested", handleQuoteUpdated);
      socket.off("quote_deletion_rejected", handleQuoteUpdated);
      socket.off("quote_deletion_approved", handleQuoteUpdated);
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
        "pending_contact",
        "ready_to_negotiate",
        "negotiating",
        "cancelled"
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

    const q = quotations.find((quote) => quote.id === id);
    if (q) {
      const originalPrice = Number(
        q.admin_proposed_price || q.total_quoted_price,
      );
      const minAllowedPrice = originalPrice * 0.9;
      if (Number(priceToSubmit) < minAllowedPrice) {
        showError(
          `Bạn không được mặc cả thấp hơn 10% (Tối thiểu phải là ${formatCurrency(minAllowedPrice)})`,
        );
        return;
      }
    }

    try {
      await apiClient.put(`/quotations/${id}/negotiate`, {
        price: Number(priceToSubmit),
      });
      showSuccess("Gửi đề xuất mặc cả thành công!");
      setNegotiatePrices((prev) => ({ ...prev, [id]: "" }));
      fetchQuotations();
    } catch (e) {
      showError(e?.response?.data?.message || "Gửi đề xuất mặc cả thất bại");
    }
  };

  const openContactModal = (q) => {
    setContactModalId(q.id);
    // setContactInfo is handled by useEffect
  };

  const handleConfirmContact = async () => {
    if (!contactInfo) {
      showError("Vui lòng nhập số điện thoại / Zalo!");
      return;
    }

    const cleanPhone = contactInfo.replace(/[\s\-\+]/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      showError("Số điện thoại / Zalo không hợp lệ! Vui lòng nhập đúng 10 chữ số và bắt đầu bằng số 0.");
      return;
    }

    try {
      await apiClient.put(`/quotations/${contactModalId}/contact-method`, {
        method: contactMethod,
        contactInfo: contactInfo,
      });
      showSuccess("Đã gửi thông tin liên hệ thành công!");
      setContactModalId(null);
      fetchQuotations();
    } catch (e) {
      showError(e?.response?.data?.message || "Gửi thông tin thất bại");
    }
  };

  const handleRequestDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient.post(`/quotations/${deletingId}/request-delete`);
      showSuccess("Đã gửi yêu cầu xoá!");
      setDeletingId(null);
      fetchQuotations();
    } catch (e) {
      showError(e?.response?.data?.message || "Lỗi khi gửi yêu cầu xoá");
    }
  };

  const handleApproveDelete = async () => {
    if (!approvingId) return;
    try {
      await apiClient.post(`/quotations/${approvingId}/approve-delete`);
      showSuccess("Báo giá đã được xoá thành công!");
      setApprovingId(null);
      fetchQuotations();
    } catch (e) {
      showError(e?.response?.data?.message || "Lỗi khi duyệt xoá");
    }
  };

  const handleRejectDelete = async (id) => {
    try {
      await apiClient.post(`/quotations/${id}/reject-delete`);
      showSuccess("Đã từ chối yêu cầu xoá!");
      fetchQuotations();
    } catch (e) {
      showError(e?.response?.data?.message || "Lỗi khi từ chối xoá");
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

  const handleExportPDF = (id) => {
    setPrintingId(id);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingId(null), 500);
    }, 100);
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
      case "under_review":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <Clock className="w-3 h-3" /> Đang chờ xem xét
          </span>
        );
      case "admin_quoted":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            <CheckCircle2 className="w-3 h-3" /> Admin đã báo giá
          </span>
        );
        case "user_proposed":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
            <CheckCircle2 className="w-3 h-3" /> Khách hàng mặc cả
          </span>
        );
      case "pending_contact":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
            <MessageSquare className="w-3 h-3" /> Chờ xác nhận liên hệ
          </span>
        );
      case "ready_to_negotiate":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
            <PhoneCall className="w-3 h-3" /> Đợi xưởng liên hệ
          </span>
        );
      case "negotiating":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
            <Clock className="w-3 h-3" /> Đang thương lượng
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <Delete className="w-3 h-3" /> Đã bị từ chối
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
            id={`quote-card-${q.id}`}
            className={`bg-white rounded-2xl p-6 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all ${printingId === q.id ? "print-area" : printingId ? "no-print" : ""}`}
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />{" "}
                  {q.title || "Yêu cầu báo giá"}
                </h3>
                <div className="flex flex-wrap gap-3 mt-5 lg:mt-0 no-print">
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">
                    Mã YC: #{q.id.slice(0, 8).toUpperCase()} • Tạo lúc:{" "}
                    {new Date(q.created_at).toLocaleString("vi-VN")}
                  </p>
                  
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(q.status)}
                {q.status !== "pending_admin" && (
                  <div className="flex flex-col items-end">
                    <p className={q.status === 'user_proposed' ? "text-sm font-bold text-on-surface-variant line-through" : "text-lg font-black text-error"}>
                      {formatCurrency(q.admin_proposed_price || q.total_quoted_price)}
                    </p>
                    {q.status === "user_proposed" && q.user_proposed_price && (
                      <p className="text-lg font-black text-primary mt-1">
                        Mặc cả: {formatCurrency(q.user_proposed_price)}
                      </p>
                    )}
                  </div>
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
                  q.admin_proposed_price ||
                    q.user_proposed_price ||
                    q.total_quoted_price,
                )}
              </span>
            </div>

            {/* Hồ sơ bản vẽ (Attachments) */}
            {q.quotation_attachments && q.quotation_attachments.length > 0 && (
              <div className="mb-4 bg-surface-container/10 border border-outline-variant/40 rounded-xl p-3">
                <h4 className="text-[11px] font-bold text-on-surface-variant/80 uppercase mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Hồ sơ Bản vẽ đính kèm (
                  {q.quotation_attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.quotation_attachments.map((att) => (
                    <div
                      key={att.id || att.file_url}
                      className="flex items-center justify-between border border-outline-variant/60 rounded-lg px-3 py-2 bg-white"
                    >
                      <div className="truncate text-xs font-medium text-on-surface-variant max-w-[75%]">
                        {att.name || att.file_name}
                      </div>
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                      >
                        Mở <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3" data-html2canvas-ignore>
              {/* Nút hành động */}
              {!q.deletion_status && (
                <>
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
                    <div className="border-t border-dashed border-outline-variant/40 pt-3 flex flex-col md:flex-row items-end md:items-center justify-between gap-3 bg-sky-50/20 p-3 rounded-xl border border-sky-100/50 w-full">
                      <div className="text-xs text-sky-800 font-medium">
                        💡 Bạn có thể đồng ý với giá xưởng hoặc nhập số tiền muốn
                        mặc cả thấp hơn vào ô bên cạnh:
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <input
                          type="text"
                          value={
                            negotiatePrices[q.id]
                              ? Number(negotiatePrices[q.id]).toLocaleString(
                                  "vi-VN",
                                )
                              : ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              q.id,
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
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
                    <div className="bg-purple-50/40 border border-purple-100 text-purple-800 p-3 rounded-xl text-xs flex items-center gap-2 italic w-full">
                      <AlertCircle className="w-4 h-4 shrink-0 text-purple-600" />
                      <span>
                        Hệ thống đã ghi nhận mức giá mặc cả của bạn. Vui lòng đợi
                        quản lý phân xưởng xem xét và đưa ra quyết định chốt đơn
                        cuối cùng!
                      </span>
                    </div>
                  )}

                  {q.status === "pending_contact" && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-orange-50 p-3 rounded-xl border border-orange-200 w-full">
                      <div className="text-xs text-orange-800 font-medium">
                        KPM muốn thương lượng trực tiếp với bạn về đơn hàng này!
                      </div>
                      <button
                        onClick={() => openContactModal(q)}
                        className="px-6 py-2 text-xs font-black uppercase tracking-widest bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                      >
                        Chọn cách liên hệ
                      </button>
                    </div>
                  )}

                  {q.status === "ready_to_negotiate" && (
                    <div className="bg-pink-50/40 border border-pink-100 text-pink-800 p-3 rounded-xl text-xs flex items-center gap-2 italic w-full">
                      <Clock className="w-4 h-4 shrink-0 text-pink-600" />
                      <span>
                        Bạn đã gửi yêu cầu thương lượng. Chuyên viên KPM sẽ sớm liên hệ với bạn qua thông tin đã chọn.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ======================= UI XÓA BÁO GIÁ (2-WAY APPROVAL) CHO USER ======================= */}
            {['pending_admin', 'user_proposed', 'admin_quoted', 'sent_to_customer', 'draft'].includes(q.status) && (
              <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col items-end gap-3" data-html2canvas-ignore>
                {!q.deletion_status && (
                  <button
                    onClick={() => setDeletingId(q.id)}
                    className="px-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors w-full sm:w-auto"
                  >
                    Yêu cầu xoá báo giá
                  </button>
                )}

                {/* Mình (User) là người yêu cầu */}
                {q.deletion_status === "REQUESTED_BY_USER" && (
                  <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3 text-xs text-on-surface-variant/70 italic text-center w-full">
                    <Clock className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                    Đang chờ Admin duyệt yêu cầu xoá...
                  </div>
                )}

                {/* Phía bên kia (Admin) yêu cầu */}
                {q.deletion_status === "REQUESTED_BY_ADMIN" && (
                  <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 shadow-sm w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-black text-rose-800">Admin yêu cầu xoá</div>
                          <div className="text-xs text-rose-700/80 font-medium">Bạn có đồng ý xoá vĩnh viễn báo giá này không?</div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setApprovingId(q.id)}
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase shadow-sm transition-all active:scale-95 flex-1 sm:flex-none"
                        >
                          Đồng ý xoá
                        </button>
                        <button
                          onClick={() => handleRejectDelete(q.id)}
                          className="px-4 py-2 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs uppercase shadow-sm transition-colors flex-1 sm:flex-none"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ========================================================================================= */}
          </div>
        ))
      )}

      {/* MODALS */}
      {deletingId && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-on-surface mb-2">Gửi yêu cầu xoá báo giá?</h3>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Yêu cầu xoá sẽ được gửi đến Admin. Chỉ khi Admin đồng ý thì báo giá này mới bị xoá. Bạn có chắc chắn muốn gửi yêu cầu?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleRequestDelete}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
                    >
                      Gửi yêu cầu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {approvingId && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-on-surface mb-2">Đồng ý xoá báo giá?</h3>
                  <p className="text-sm text-on-surface-variant mb-6">
                    Báo giá này sẽ bị chuyển vào thùng rác và không còn hiển thị trong danh sách nữa. Hành động này không thể hoàn tác ngay lập tức. Bạn có chắc chắn?
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setApprovingId(null)}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleApproveDelete}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
                    >
                      Chắc chắn xoá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

        {/* Modal Chọn phương thức liên hệ */}
        {contactModalId && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div
                className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-on-surface">Phương thức liên hệ</h2>
                  <button
                    onClick={() => setContactModalId(null)}
                    className="p-2 hover:bg-surface-container rounded-full transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>
                
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  KPM muốn trao đổi thêm với bạn về đơn hàng. Bạn muốn chúng tôi liên hệ qua phương thức nào?
                </p>

                <div className="space-y-4 mb-8">
                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-surface-container/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Nhắn tin Zalo</span>
                    </div>
                    <input
                      type="radio"
                      name="contactMethod"
                      value="Zalo"
                      checked={contactMethod === "Zalo"}
                      onChange={() => setContactMethod("Zalo")}
                      className="w-5 h-5 text-primary focus:ring-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-surface-container/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <PhoneCall className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Gọi điện trực tiếp</span>
                    </div>
                    <input
                      type="radio"
                      name="contactMethod"
                      value="Phone"
                      checked={contactMethod === "Phone"}
                      onChange={() => setContactMethod("Phone")}
                      className="w-5 h-5 text-primary focus:ring-primary"
                    />
                  </label>

                  <div className="mt-4">
                    <label className="block text-sm font-bold text-on-surface mb-2">
                      Số điện thoại {contactMethod === 'Zalo' ? 'Zalo' : ''} của bạn:
                    </label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setContactModalId(null)}
                    className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleConfirmContact}
                    className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-container transition-colors shadow-lg shadow-primary/30"
                  >
                    Gửi xác nhận
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
    </div>
  );
};

export default QuotationsTab;
