import React, { useEffect, useState } from "react";
import adminService from "../../services/admin.service";
import apiClient from "../../services/apiClient";
import { showError, showSuccess } from "../../utils/notify";
import { ChevronDown } from "lucide-react";

export default function QuotationDetail({ quotationIdProp, onBack }) {
  const [id, setId] = useState(
    quotationIdProp || localStorage.getItem("activeQuotationId"),
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [expandedSpecId, setExpandedSpecId] = useState(null);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getQuotation(id);
      const qData = res.data?.data || res.data || null;
      setData(qData);
      if (qData) {
        setCustomPrice(qData.total_quoted_price || '');
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
      fd.append("upload_preset", window.CLOUDINARY_UPLOAD_PRESET);
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
        total_quoted_price: Number(customPrice)
      });
      showSuccess("Đã duyệt và gửi báo giá qua email cho khách hàng!");
      await load();
    } catch (e) {
      showError(
        e?.response?.data?.message || e?.message || "Lỗi khi duyệt báo giá",
      );
    }
  }

  if (!id)
    return (
      <div className="rounded-2xl border border-outline-variant/60 bg-white p-4">
        Không có báo giá được chọn.
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black">Chi tiết Báo giá</h3>
            <div className="text-xs text-on-surface-variant/70">Mã: {id}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("activeQuotationId");
                onBack?.();
              }}
              className="rounded-lg border border-outline-variant/60 px-3 py-2"
            >
              Quay lại
            </button>
          </div>
        </div>

        {loading ? <div>Đang tải...</div> : null}

        {data && (
          <div>
            <h4 className="font-black">Hóa đơn chi tiết</h4>
            <div className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/50 text-on-surface-variant/70 text-xs uppercase tracking-wider">
                      <th className="py-2 font-bold">Chi tiết Cấu hình</th>
                      <th className="py-2 font-bold text-center">
                        Kích thước (mm)
                      </th>
                      <th className="py-2 font-bold text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.quotation_specs || []).map((spec, i) => {
                      const isExpanded = expandedSpecId === (spec.id || i);
                      return (
                        <React.Fragment key={spec.id || i}>
                          <tr
                            onClick={() => setExpandedSpecId(isExpanded ? null : (spec.id || i))}
                            className="border-b border-outline-variant/20 hover:bg-surface-container/10 transition-colors cursor-pointer"
                          >
                            <td className="py-3 flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              <div className="font-black text-primary">
                                {spec.component_name || `Linh kiện #${i + 1}`}
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              {spec.dimensions?.width} x {spec.dimensions?.height}
                            </td>
                            <td className="py-3 text-right font-black text-on-surface">
                              {formatVND(spec.snapshot_price)}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-surface-container-lowest">
                              <td colSpan="3" className="py-3 px-6 border-b border-outline-variant/20">
                                <div className="text-xs text-on-surface-variant/80 leading-relaxed space-y-1">
                                  <p><span className="font-bold">Vật tư:</span> {spec.materials?.material_name || "-"} ({spec.material_thickness?.thickness_value || "-"})</p>
                                  <p><span className="font-bold">Loại sơn:</span> {spec.paint_types?.paint_name || "-"}</p>
                                  {spec.note && (
                                    <p className="text-amber-600 italic">
                                      <span className="font-bold">Ghi chú:</span> {spec.note}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {(!data.quotation_specs ||
                      data.quotation_specs.length === 0) && (
                      <tr>
                        <td
                          colSpan="3"
                          className="py-6 text-center text-on-surface-variant/60 italic"
                        >
                          Chưa có chi tiết vật tư trong báo giá này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t border-outline-variant/60 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold uppercase tracking-wider text-on-surface-variant/80">
                    Tổng Tiền Thanh Toán
                  </div>
                  {/* Sửa lại đúng tên trường DB là total_quoted_price */}
                  <div className="text-xl font-black text-rose-600">
                    {formatVND(data.total_quoted_price)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-black">Attachments</h4>
              <div className="mt-2 space-y-2">
                {(data.attachments || []).map((att) => (
                  <div
                    key={att.id || att.file_url}
                    className="flex items-center justify-between border rounded px-3 py-2"
                  >
                    <div className="truncate">{att.name || att.file_name}</div>
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary"
                    >
                      Mở
                    </a>
                  </div>
                ))}
                {(!data.attachments || data.attachments.length === 0) && (
                  <div className="text-sm text-on-surface-variant/70">
                    Chưa có file đính kèm
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <h4 className="font-black">Quản lý Bản vẽ</h4>
        <div className="mt-3">
          <div className="border-dashed border-2 border-outline-variant/40 rounded-xl p-4 text-center">
            <p className="text-sm text-on-surface-variant/70">
              Kéo thả file vào đây (ảnh/pdf) hoặc chọn file
            </p>
            <div className="mt-3">
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>
            {uploading && <div className="mt-2 text-sm">Đang upload...</div>}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-black">Chốt đơn & Xử lý Yêu cầu</h4>
          <div className="mt-3 space-y-3">
            {data && data.status === "pending_admin" && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                <label className="text-xs font-bold text-amber-800 uppercase">Giá báo khách hàng (VND)</label>
                <input 
                  type="number" 
                  value={customPrice} 
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-bold"
                />
                <button
                  onClick={handleApproveAndSendEmail}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-white font-bold text-xs uppercase shadow-sm"
                >
                  Duyệt & Gửi Email Báo Giá
                </button>
                <button
                  onClick={() => changeStatus("rejected")}
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2 text-rose-600 font-bold text-xs uppercase"
                >
                  Từ chối yêu cầu
                </button>
              </div>
            )}

            {data && (data.status === "draft" || data.status === "sent_to_customer") && (
              <>
                <button
                  onClick={() => changeStatus("approved")}
                  className="w-full rounded-xl bg-primary px-4 py-2 text-white font-bold text-xs uppercase"
                >
                  XÁC NHẬN ĐẶT HÀNG (Khách hàng duyệt)
                </button>
                <button
                  onClick={() => changeStatus("cancelled")}
                  className="w-full rounded-xl border border-outline-variant/60 px-4 py-2 text-rose-600 font-bold text-xs uppercase"
                >
                  HỦY BÁO GIÁ
                </button>
              </>
            )}
            {data && (data.status === "customer_approved" || data.status === "approved") && (
              <button
                onClick={() => changeStatus("admin_confirmed")}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-white font-bold text-xs uppercase shadow-sm hover:bg-emerald-700"
              >
                Xác nhận Đơn & Gửi Email KH
              </button>
            )}

            {data && !["draft", "pending_admin", "sent_to_customer", "customer_approved", "approved"].includes(data.status) && (
              <div className="text-sm text-on-surface-variant/70 italic mt-3">
                Trạng thái hiện tại: <span className="font-bold uppercase text-primary">{data.status}</span> (Vòng đời đơn đã đóng)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
