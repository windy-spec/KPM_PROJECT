import React, { useEffect, useState } from "react";
import adminService from "../../services/admin.service";
import apiClient from "../../services/apiClient";
import { showError, showSuccess } from "../../utils/notify";
import {
  ChevronDown,
  ArrowLeft,
  FileText,
  Paperclip,
  UploadCloud,
  ExternalLink,
  FileCheck,
  AlertCircle,
  Clock,
  DollarSign,
  Gavel
} from "lucide-react";
import { useSocket } from "../../context/SocketContext";

export default function QuotationDetail({ quotationIdProp, onBack }) {
  const [id, setId] = useState(
    quotationIdProp || localStorage.getItem("activeQuotationId"),
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [customPrice, setCustomPrice] = useState('');
  const [expandedSpecId, setExpandedSpecId] = useState(null);

  const [negotiatePrice, setNegotiatePrice] = useState('');
  const [finalStatus, setFinalStatus] = useState('admin_confirmed');

  const socket = useSocket();

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    const handleQuoteNegotiated = (payload) => {
      // Chỉ reload nếu đúng id báo giá đang xem
      if (payload?.data?.id === id) {
        showSuccess(payload?.message || "Khách hàng vừa phản hồi báo giá này!");
        load();
      }
    };
    socket.on("quote_negotiated", handleQuoteNegotiated);
    return () => {
      socket.off("quote_negotiated", handleQuoteNegotiated);
    };
  }, [socket, id]);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getQuotation(id);
      const qData = res.data?.data || res.data || null;
      setData(qData);
      if (qData) {
        setCustomPrice(qData.user_proposed_price || qData.admin_proposed_price || qData.total_quoted_price || '');
      }
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Không tải được báo giá",
      );
    } finally {
      setLoading(false);
    }
  }

  function formatVND(n) {
    if (n == null) return "-";
    return new Intl.NumberFormat("vi-VN").format(Number(n)) + " đ";
  }

  // Upload helper: expects window.CLOUDINARY_UPLOAD_URL to be set to unsigned upload URL
  async function uploadToCloud(file) {
    const url = window.CLOUDINARY_UPLOAD_URL;
    if (!url)
      throw new Error(
        "No cloud upload URL configured. Set window.CLOUDINARY_UPLOAD_URL to your upload endpoint (e.g., https://api.cloudinary.com/v1_1/<cloud>/auto/upload).",
      );
    const fd = new FormData();
    fd.append("file", file);
    // If using Cloudinary unsigned you might need upload_preset param; allow global
    if (window.CLOUDINARY_UPLOAD_PRESET)
      fd.append("upload_preset", window.window.CLOUDINARY_UPLOAD_PRESET);
    const resp = await fetch(url, { method: "POST", body: fd });
    if (!resp.ok) throw new Error("Upload failed");
    const json = await resp.json();
    return json.secure_url || json.url;
  }

  async function handleFileSelect(file) {
    try {
      setUploading(true);
      const fileUrl = await uploadToCloud(file);
      await adminService.createQuotationAttachment(id, {
        name: file.name,
        file_url: fileUrl,
      });
      showSuccess("Upload thành công và lưu attachment");
      await load();
    } catch (e) {
      showError(e?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function changeStatus(newStatus) {
    try {
      await adminService.updateQuotationStatus(id, { status: newStatus });
      showSuccess("Cập nhật trạng thái thành công");
      await load();
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Cập nhật thất bại",
      );
    }
  }

  async function handleApproveAndSendEmail() {
    try {
      await apiClient.put(`/quotations/${id}/approve`, {
        admin_proposed_price: Number(customPrice)
      });
      showSuccess("Đã duyệt và gửi báo giá qua email cho khách hàng!");
      await load();
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Lỗi khi duyệt báo giá",
      );
    }
  }

  // Gửi đề xuất mặc cả
  async function handleNegotiate() {
    if (!negotiatePrice) {
      showError("Vui lòng nhập số tiền muốn mặc cả.");
      return;
    }
    try {
      await apiClient.put(`/quotations/${id}/negotiate`, {
        price: Number(negotiatePrice)
      });
      showSuccess("Gửi đề xuất mặc cả thành công!");
      setNegotiatePrice('');
      await load();
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Lỗi khi gửi đề xuất mặc cả.",
      );
    }
  }

  // Chốt yêu cầu mặc cả từ khách
  async function handleFinalDecision() {
    try {
      await apiClient.put(`/quotations/${id}/final-decision`, {
        status: finalStatus
      })
      showSuccess("Đã chốt quyết định cho yêu cầu báo giá này!");
      await load();
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Lỗi khi chốt quyết định",
      );
    }
  }

  if (!id)
    return (
      <div className="rounded-2xl border border-outline-variant/60 bg-white p-6 text-center text-on-surface-variant/70 font-medium">
        Không có báo giá được chọn.
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      {/* KHỐI TRÁI: CHI TIẾT CẤU HÌNH HÓA ĐƠN */}
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant/60 bg-white p-5 md:p-6 shadow-sm flex flex-col gap-6">

        {/* Header chi tiết báo giá */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary md:block hidden">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-black uppercase tracking-wider text-on-surface">Chi tiết Báo giá</h3>
              <div className="text-xs font-mono text-on-surface-variant/60 mt-0.5">ID: {id}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("activeQuotationId");
              onBack?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-white px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container/40 hover:text-on-surface transition-all active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
        </div>

        {loading && (
          <div className="text-xs font-black text-primary/70 tracking-widest uppercase py-4 animate-pulse">
            Đang tải dữ liệu từ hệ thống...
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80 mb-3">Hóa đơn chi tiết</h4>

              <div className="overflow-x-auto rounded-xl border border-outline-variant/40 bg-surface-container/5">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/50 bg-surface-container/20 text-on-surface-variant/70 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Chi tiết Cấu hình</th>
                      <th className="py-3 px-4 font-bold text-center w-[140px]">Kích thước (mm)</th>
                      <th className="py-3 px-4 font-bold text-right w-[150px]">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {(data.quotation_specs || []).map((spec, i) => {
                      const isExpanded = expandedSpecId === (spec.id || i);
                      return (
                        <React.Fragment key={spec.id || i}>
                          <tr
                            onClick={() => setExpandedSpecId(isExpanded ? null : (spec.id || i))}
                            className="hover:bg-surface-container/15 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4 flex items-center gap-2.5">
                              <ChevronDown className={`w-4 h-4 text-on-surface-variant/60 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                              <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
                                {spec.component_name || `Linh kiện #${i + 1}`}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs text-on-surface-variant/80">
                              {spec.dimensions?.width} × {spec.dimensions?.height}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-on-surface text-[13px]">
                              {formatVND(spec.snapshot_price)}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-surface-container/10">
                              <td colSpan="3" className="py-3 px-5 px-10 border-t border-b border-outline-variant/20">
                                <div className="text-xs text-on-surface-variant/80 space-y-2 py-1">
                                  <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                                    <p>
                                      <span className="font-bold text-on-surface/70">Vật tư: </span>
                                      <span className="inline-flex bg-white px-2 py-0.5 rounded border border-outline-variant/50 font-medium">
                                        {spec.materials?.material_name || "-"} ({spec.material_thickness?.thickness_value || "-"})
                                      </span>
                                    </p>
                                    <p>
                                      <span className="font-bold text-on-surface/70">Loại sơn: </span>
                                      <span className="inline-flex bg-white px-2 py-0.5 rounded border border-outline-variant/50 font-medium">
                                        {spec.paint_types?.paint_name || "-"}
                                      </span>
                                    </p>
                                  </div>
                                  {spec.note && (
                                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-2 text-amber-700 italic flex gap-1.5 items-start">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                      <p><span className="font-bold not-italic">Ghi chú sản xuất:</span> {spec.note}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {(!data.quotation_specs || data.quotation_specs.length === 0) && (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-on-surface-variant/50 italic text-xs">
                          Chưa có chi tiết vật tư trong báo giá này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tổng tiền hiển thị dạng Banner lớn cực đẹp */}
              <div className="mt-4 bg-rose-50/40 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                <div className="text-xs font-black uppercase tracking-widest text-rose-800/80">
                  Tổng Tiền Thanh Toán (Tạm tính)
                </div>
                <div className="text-xl md:text-2xl font-black text-rose-600 tracking-tight">
                  {formatVND(data.total_quoted_price)}
                </div>
              </div>
            </div>

            {/* Mục file đính kèm */}
            <div className="pt-4 border-t border-outline-variant/30">
              <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80 mb-3 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span>Tài liệu đính kèm ({data.attachments?.length || 0})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(data.attachments || []).map((att) => (
                  <div
                    key={att.id || att.file_url}
                    className="flex items-center justify-between border border-outline-variant/60 rounded-xl px-3 py-2 bg-surface-container/5 hover:bg-surface-container/10 transition-colors"
                  >
                    <div className="truncate text-xs font-medium text-on-surface-variant max-w-[80%]">
                      {att.name || att.file_name}
                    </div>
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline px-2 py-1 bg-primary/5 rounded-md border border-primary/10"
                    >
                      <span>Mở</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
                {(!data.attachments || data.attachments.length === 0) && (
                  <div className="text-xs text-on-surface-variant/50 italic col-span-2">
                    Chưa có hồ sơ hay file đính kèm nào
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KHỐI PHẢI: QUẢN LÝ BẢN VẼ & TRẠNG THÁI */}
      <div className="lg:col-span-1 flex flex-col gap-6">

        {/* 1. Upload bản vẽ kĩ thuật */}
        <div className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80 mb-3">Quản lý Bản vẽ</h4>
          <div>
            <label className="relative border-dashed border-2 border-outline-variant hover:border-primary/50 hover:bg-primary/5 rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all group">
              <input
                type="file"
                className="hidden" // Ẩn ô input gốc xấu xí đi
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <UploadCloud className="w-8 h-8 text-on-surface-variant/40 group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface">
                Tải bản vẽ kĩ thuật lên
              </p>
              <span className="text-[10px] text-on-surface-variant/50 mt-1">
                Chấp nhận ảnh hoặc file PDF
              </span>

              {uploading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl flex items-center justify-center text-xs font-bold text-primary animate-pulse">
                  Đang tải lên Cloud...
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 2. Quy trình xử lý báo giá */}
        <div className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/80 mb-3">Chốt đơn & Xử lý</h4>
          <div className="space-y-3">

            {/* TRẠNG THÁI CHỜ DUYỆT ADMIN */}
            {data && data.status === "pending_admin" && (
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cấu hình giá xuất xưởng</span>
                </div>

                <div className="space-y-1">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Nhập tổng số tiền..."
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-black text-on-surface focus:outline-none focus:border-amber-500 bg-white shadow-2xs"
                  />
                  {/* Trải nghiệm đỉnh cao: Xem trước số tiền tệ dạng chữ vi-VN khi Admin đang nhập số */}
                  {customPrice && (
                    <div className="text-[11px] text-amber-700 font-bold pl-1">
                      Xem trước: {formatVND(customPrice)}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleApproveAndSendEmail}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 h-10 text-white font-bold text-xs uppercase shadow-md transition-all active:scale-95"
                >
                  Duyệt & Gửi Email Báo Giá
                </button>
                <button
                  onClick={() => changeStatus("rejected")}
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 h-10 text-rose-600 font-bold text-xs uppercase hover:bg-rose-50 transition-colors"
                >
                  Từ chối yêu cầu
                </button>
              </div>
            )}

            {/* TRẠNG THÁI ĐÃ ĐỀ XUẤT GIÁ - CHO PHÉP MẶC CẢ (status === "admin_quoted") */}
            {data && data.status === "admin_quoted" && (
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-200 space-y-3">
                <div className="flex items-center gap-1.5 text-sky-800 text-xs font-black uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Giá xưởng đề xuất: {formatVND(data.total_quoted_price)}</span>
                </div>
                <div className="space-y-1">
                  <input
                    type="number"
                    value={negotiatePrice}
                    onChange={(e) => setNegotiatePrice(e.target.value)}
                    placeholder="Nhập giá muốn mặc cả..."
                    className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm font-black text-on-surface focus:outline-none focus:border-sky-500 bg-white shadow-2xs"
                  />
                  {negotiatePrice && (
                    <div className="text-[11px] text-sky-700 font-bold pl-1">
                      Xem trước: {formatVND(negotiatePrice)}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleNegotiate}
                  className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 px-4 h-10 text-white font-bold text-xs uppercase shadow-md transition-all active:scale-95"
                >
                  Gửi đề xuất mặc cả
                </button>
              </div>
            )}

            {/* TRẠNG THÁI KHÁCH HÀNG MUỐN MẶC CẢ (status === "user_proposed") */}
            {data && data.status === "user_proposed" && (
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-purple-800 text-xs font-black uppercase tracking-wider">
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Khách muốn mặc cả xuống: <b className="text-rose-600">{formatVND(data.total_quoted_price)}</b></span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-700 block pl-1">Quyết định của Admin:</label>
                  <select
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:border-purple-500 bg-white shadow-2xs"
                  >
                    <option value="admin_confirmed">Đồng ý (admin_confirmed)</option>
                    <option value="under_review">Xem xét thêm (under_review)</option>
                    <option value="cancelled">Từ chối (cancelled)</option>
                  </select>
                </div>
                <button
                  onClick={handleFinalDecision}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 px-4 h-10 text-white font-bold text-xs uppercase shadow-md transition-all active:scale-95"
                >
                  Chốt yêu cầu
                </button>
              </div>
            )}

            {/* TRẠNG THÁI NHÁP HOẶC ĐÃ GỬI KHÁCH HÀNG */}
            {data && (data.status === "draft" || data.status === "sent_to_customer") && (
              <div className="space-y-2">
                <button
                  onClick={() => changeStatus("approved")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 h-11 text-white font-bold text-xs uppercase shadow-md transition-all active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Khách hàng đồng ý đặt hàng</span>
                </button>
                <button
                  onClick={() => changeStatus("cancelled")}
                  className="w-full rounded-xl border border-outline-variant/60 bg-white hover:bg-rose-50 hover:text-rose-600 px-4 h-10 text-on-surface-variant/80 font-bold text-xs uppercase transition-colors"
                >
                  Hủy báo giá này
                </button>
              </div>
            )}

            {/* TRẠNG THÁI KHÁCH DUYỆT -> ADMIN XÁC NHẬN SẢN XUẤT */}
            {data && (data.status === "customer_approved" || data.status === "approved") && (
              <button
                onClick={() => changeStatus("admin_confirmed")}
                className="w-full rounded-xl bg-emerald-600 px-4 h-11 text-white font-bold text-xs uppercase shadow-md hover:bg-emerald-700 transition-all active:scale-95"
              >
                Xác nhận Đơn & Lên Lịch Sản Xuất
              </button>
            )}

            {/* CÁC TRẠNG THÁI VÒNG ĐỜI ĐÃ KHÓA */}
            {data && !["draft", "pending_admin", "sent_to_customer", "customer_approved", "approved"].includes(data.status) && (
              <div className="bg-surface-container/30 border border-outline-variant/40 rounded-xl p-3.5 text-xs text-on-surface-variant/70 italic flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-on-surface-variant/60 shrink-0" />
                <p>
                  Đơn đã đóng trạng thái: <span className="font-black not-italic uppercase text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 ml-0.5">{data.status}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}