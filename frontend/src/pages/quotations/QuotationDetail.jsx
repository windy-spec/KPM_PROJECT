import React, { useEffect, useState } from "react";
import adminService from "../../services/admin.service";
import { showError, showSuccess } from "../../utils/notify";

export default function QuotationDetail({ quotationIdProp, onBack }) {
  const [id, setId] = useState(
    quotationIdProp || localStorage.getItem("activeQuotationId"),
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getQuotation(id);
      setData(res.data?.data || res.data || null);
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
                    {(data.quotation_specs || []).map((spec, i) => (
                      <tr
                        key={spec.id || i}
                        className="border-b border-outline-variant/20 hover:bg-surface-container/10 transition-colors"
                      >
                        <td className="py-3">
                          <div className="font-black text-primary">
                            Sản phẩm #{i + 1}
                          </div>
                          <div className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
                            • Vật tư: {spec.materials?.material_name || "-"} (
                            {spec.material_thickness?.thickness_value || "-"})
                            <br />• Sơn: {spec.paint_types?.paint_name || "-"}
                            <br />
                            {spec.note && (
                              <span className="text-amber-600 italic">
                                Ghi chú: {spec.note}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center align-top mt-1">
                          {spec.dimensions?.width} x {spec.dimensions?.height}
                        </td>
                        <td className="py-3 text-right font-black align-top mt-1 text-on-surface">
                          {formatVND(spec.snapshot_price)}
                        </td>
                      </tr>
                    ))}
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
          <h4 className="font-black">Chốt đơn</h4>
          <div className="mt-3 space-y-2">
            {data && data.status === "draft" ? (
              <>
                <button
                  onClick={() => changeStatus("approved")}
                  className="w-full rounded-xl bg-primary px-4 py-2 text-white"
                >
                  CHỐT ĐƠN
                </button>
                <button
                  onClick={() => changeStatus("cancelled")}
                  className="w-full rounded-xl border border-outline-variant/60 px-4 py-2 text-rose-600"
                >
                  HỦY BÁO GIÁ
                </button>
              </>
            ) : (
              <div className="text-sm text-on-surface-variant/70">
                Không thể thay đổi trạng thái (đã chốt hoặc đã hủy).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
