import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  RefreshCcw,
  X,
  Search,
  TriangleAlert,
  CheckCircle,
} from "lucide-react";
import adminService from "../../services/admin.service";
import ConfirmModal from "../../components/common/ConfirmModal";
import Portal from "../../components/common/Portal";
import Pagination from "../../components/common/Pagination";
import { showError, showSuccess } from "../../utils/notify";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ManageInvalidBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Thanh công cụ tìm kiếm & bộ lọc đồng bộ
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Xem chi tiết lỗi lô hàng
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [modalTab, setModalTab] = useState("INVALID");

  // Xử lý xóa lô lỗi
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvalidBatches = async () => {
    setLoading(true);
    setError("");
    try {
      // Gọi trực tiếp dữ liệu thật từ Backend
      const res = await adminService.getImportBatches({ limit: 200 });
      setBatches(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        "Không thể kết nối đến máy chủ hoặc API chưa được thiết lập.",
      );
      showError("Không thể tải danh sách lô hàng lỗi từ hệ thống.");
      setBatches([]); // Đảm bảo clear danh sách nếu lỗi xảy ra
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvalidBatches();
  }, []);

  // Xử lý Xóa lô hàng lỗi
  const handleDeleteClick = (batch, e) => {
    e.stopPropagation();
    setPendingDelete(batch);
    setShowDeleteModal(true);
  };

  // Gọi API lấy dữ liệu chi tiết của lô khi bấm xem
  const handleViewClick = async (batch, e) => {
    e.stopPropagation();
    try {
      const res = await adminService.getImportBatchDetails(batch.id);
      const detailData = res.data?.data || res.data;

      // ✅ Ép kiểu dữ liệu đồng bộ:
      // Lấy batch_id từ Backend gán vào id để Modal dùng chung 1 tên biến
      setSelectedBatch({
        ...detailData,
        id: detailData.batch_id,
        file_name: batch.file_name,
      });
      setModalTab("INVALID");
    } catch (err) {
      console.error(err);
      showError("Không thể tải chi tiết dòng lỗi của lô này!");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    try {
      if (adminService.deleteImportBatch) {
        await adminService.deleteImportBatch(pendingDelete.id);
      }
      showSuccess(`Đã dọn dẹp sạch lô hàng lỗi #${pendingDelete.id}`);
      setBatches((prev) => prev.filter((b) => b.id !== pendingDelete.id));
      setShowDeleteModal(false);
      setPendingDelete(null);
      // Nếu xóa xong trang hiện tại trống thì lùi trang
      if (currentTableData.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      showError(
        err?.response?.data?.message || "Không thể xóa lô hàng lỗi này",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Duyệt các dòng hợp lệ
  const handleApproveBatch = async (batchId) => {
    setIsApproving(true);
    try {
      await adminService.approveImportBatch(batchId);
      showSuccess("Đã duyệt thành công các dòng dữ liệu hợp lệ!");
      setSelectedBatch(null);
      fetchInvalidBatches();
    } catch (err) {
      console.error(err);
      showError(
        err?.response?.data?.message || "Có lỗi xảy ra khi duyệt lô hàng."
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Xuất file excel lỗi
  const handleDownloadErrorFile = async (batchId) => {
    try {
      if (adminService.exportInvalidBatchErrors) {
        const response = await adminService.exportInvalidBatchErrors(batchId);

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Errors_Batch_${batchId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSuccess("Tải file báo cáo lỗi Excel thành công!");
      } else {
        showError(
          "Tính năng xuất Excel lỗi chưa được tích hợp trong adminService.",
        );
      }
    } catch (err) {
      if (err.response && err.response.data) {
        // Trường hợp data là Blob (do thiết lập responseType: 'blob')
        if (err.response.data instanceof Blob) {
          const text = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve("");
            reader.readAsText(err.response.data);
          });
          try {
            const errorObj = JSON.parse(text);
            showError(errorObj.message || "Lỗi từ máy chủ khi xuất file.");
            return;
          } catch (parseErr) {
            console.error("Lỗi parse Blob:", parseErr);
          }
        } else if (typeof err.response.data === "object" && err.response.data.message) {
          // Trường hợp trả về JSON trực tiếp không qua Blob
          showError(err.response.data.message);
          return;
        } else if (typeof err.response.data === "string") {
          try {
            const errorObj = JSON.parse(err.response.data);
            showError(errorObj.message || "Lỗi từ máy chủ khi xuất file.");
            return;
          } catch (e) { }
        }
      }

      showError("Không thể tải file excel lỗi. Chi tiết: " + err.message);
    }
  };

  // Logic Tìm kiếm & Bộ lọc Client-side dựa trên dữ liệu thật trả về
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(b.id).includes(searchQuery);
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  // Phân trang dữ liệu
  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;
  const currentTableData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, page]);

  return (
    <div className="space-y-6">
      {/* Thông báo lỗi từ hệ thống */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 1. Container Bảng chính */}
      <div className="bg-white border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Panel */}
        <div className="px-4 md:px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] md:text-[16px] font-black uppercase tracking-[0.12em] text-on-surface">
              Quản lý lô hàng
            </h2>
            <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/75">
              {filteredBatches.length} bản ghi
            </span>
          </div>
        </div>

        {/* Toolbar: Bộ lọc & Tìm kiếm */}
        <div className="px-4 md:px-5 py-3 border-b border-outline-variant/40 bg-surface-container/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="min-w-[160px] rounded-lg border border-outline-variant/60 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã Xác Nhận (APPROVED)</option>
              <option value="INVALID">Lỗi Định Dạng (INVALID)</option>
              <option value="REJECTED">Bị Từ Chối (REJECTED)</option>
              <option value="PENDING">Đang Chờ (PENDING)</option>
            </select>
          </div>

          <div className="relative w-full lg:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Mã lô, tên file excel..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-full border border-outline-variant/60 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                <th className="p-4 pl-6 w-[120px]">Mã Lô</th>
                <th className="p-4">Tên Tệp Tin Excel</th>
                <th className="p-4 w-[180px]">Thời Gian Tải Lên</th>
                <th className="p-4 text-center w-[140px]">Số Dòng Lỗi</th>
                <th className="p-4 text-center w-[160px]">Trạng Thái</th>
                <th className="p-4 pr-6 text-center w-[160px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-xs font-bold text-on-surface-variant/50 tracking-widest uppercase"
                  >
                    Đang đồng bộ dữ liệu...
                  </td>
                </tr>
              ) : currentTableData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-sm font-medium text-on-surface-variant/60"
                  >
                    Không tìm thấy lô hàng lỗi nào phù hợp.
                  </td>
                </tr>
              ) : (
                currentTableData.map((batch) => {
                  const errorCount = batch.invalid_count || 0;
                  return (
                    <tr
                      key={batch.id}
                      className="hover:bg-surface-container/20 transition-colors cursor-pointer"
                      onClick={(e) => handleViewClick(batch, e)}
                    >
                      <td className="p-4 pl-6 font-mono text-xs font-bold text-on-surface-variant/80">
                        #{batch.id}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-on-surface line-clamp-1">
                          {batch.file_name || "Không rõ tên file"}
                        </div>
                      </td>
                      <td className="p-4 text-[12px] text-on-surface-variant/75 font-medium">
                        {formatDate(batch.created_at)}
                      </td>
                      <td className="p-4 text-center font-black text-rose-600">
                        {errorCount}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.18em] 
                            ${batch.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : batch.status === "PENDING"
                                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                : batch.status === "REJECTED"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                        >
                          {batch.status || "INVALID"}
                        </span>
                      </td>
                      <td
                        className="p-4 pr-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleViewClick(batch, e)}
                            title="Xem chi tiết"
                            className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">Xem</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(batch, e)}
                            title="Xóa dọn dẹp"
                            className="rounded-lg border border-outline-variant/60 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />{" "}
                            <span className="hidden sm:inline">Xoá</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Khối Phân Trang */}
        {totalPages > 1 && (
          <div className="border-t border-outline-variant/40 px-4 md:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container/10">
            <div className="text-xs font-semibold text-on-surface-variant/70">
              Hiển thị trang {page} / {totalPages}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* 2. Portal Modal Xem Chi Tiết Dòng Lỗi */}
      {selectedBatch && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm animate-fade-in">
            <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-[26px] border border-outline-variant/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden animate-scale-up">
              {/* Header Modal */}
              <div className="border-b border-outline-variant/50 px-6 py-5 bg-surface-container/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="h-5 w-5 text-rose-600" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">
                      Chi Tiết Lô Nhập: {selectedBatch.file_name} ({(selectedBatch.rows?.filter(r => r.validation_status === "INVALID") || []).length} lỗi)
                    </h3>
                    <p className="text-[11px] font-bold text-on-surface-variant/70 mt-1">
                      Mã:{" "}
                      <span className="font-mono text-primary">
                        #{selectedBatch.id}
                      </span>{" "}
                      • Đăng lúc: {formatDate(selectedBatch.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thân Modal Chứa Bảng Con */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#f6f8f8]">
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setModalTab("INVALID")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${modalTab === "INVALID" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-outline-variant/60 hover:bg-slate-50"}`}
                  >
                    Dòng bị lỗi ({(selectedBatch.rows?.filter(r => r.validation_status === "INVALID") || []).length})
                  </button>
                  <button
                    onClick={() => setModalTab("VALID")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${modalTab === "VALID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-outline-variant/60 hover:bg-slate-50"}`}
                  >
                    Dòng hợp lệ ({(selectedBatch.rows?.filter(r => r.validation_status === "VALID") || []).length})
                  </button>
                </div>

                <div className="rounded-2xl border border-outline-variant/60 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/50 bg-surface-container/30 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant/70">
                        <th className="p-4 pl-6 w-32">Mã SP</th>
                        <th className="p-4 w-48">Tên Sản Phẩm</th>
                        <th className="p-4 w-32">Danh Mục</th>
                        <th className="p-4">{modalTab === "INVALID" ? "Nguyên nhân Lỗi (Validation)" : "Trạng thái"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/25">
                      {(() => {
                        const filteredRows = selectedBatch.rows?.filter((r) => r.validation_status === modalTab) || [];
                        if (filteredRows.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan="4"
                                className="p-8 text-center text-sm font-medium text-on-surface-variant/60"
                              >
                                Không tìm thấy dữ liệu cho mục này.
                              </td>
                            </tr>
                          );
                        }
                        return filteredRows.map((row, idx) => {
                          const rawData =
                            typeof row.data === "string"
                              ? JSON.parse(row.data)
                              : row.data || {};

                          if (modalTab === "INVALID") {
                            const errors =
                              typeof row.validation_errors === "string"
                                ? JSON.parse(row.validation_errors)
                                : row.validation_errors || {};
                            return (
                              <tr
                                key={row.id || idx}
                                className="hover:bg-surface-container/10 transition-colors"
                              >
                                <td className="p-4 pl-6 font-mono font-bold text-[12px] text-primary">
                                  {rawData.product_code || (
                                    <span className="text-on-surface-variant/40 italic">
                                      Trống
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 font-bold text-on-surface text-[13px]">
                                  {rawData.product_name || "N/A"}
                                </td>
                                <td className="p-4 font-bold text-[12px] uppercase text-on-surface-variant">
                                  {rawData.category_code || "N/A"}
                                </td>
                                <td className="p-4">
                                  <div className="text-rose-600 text-[12px] font-semibold whitespace-pre-line bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                                    {errors && Object.keys(errors).length > 0
                                      ? Object.values(errors)
                                        .map((err) => `• ${err}`)
                                        .join("\n")
                                      : "Lỗi cấu trúc hoặc định dạng dữ liệu không đồng nhất."}
                                  </div>
                                </td>
                              </tr>
                            );
                          } else {
                            return (
                              <tr
                                key={row.id || idx}
                                className="hover:bg-surface-container/10 transition-colors"
                              >
                                <td className="p-4 pl-6 font-mono font-bold text-[12px] text-primary">
                                  {rawData.product_code || "N/A"}
                                </td>
                                <td className="p-4 font-bold text-on-surface text-[13px]">
                                  {rawData.product_name || "N/A"}
                                </td>
                                <td className="p-4 font-bold text-[12px] uppercase text-on-surface-variant">
                                  {rawData.category_code || "N/A"}
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.18em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="rounded-xl border border-outline-variant/60 px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Đóng cửa sổ
                </button>
                {(() => {
                  const validRowsCount = (selectedBatch.rows || []).filter(r => r.validation_status === "VALID").length;
                  if (validRowsCount > 0 && selectedBatch.status === "PENDING") {
                    return (
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={() => handleApproveBatch(selectedBatch.batch_id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
                      >
                        {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Duyệt {validRowsCount} dòng hợp lệ
                      </button>
                    );
                  }
                  return null;
                })()}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadErrorFile(selectedBatch.batch_id)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Xuất Excel Sửa Lỗi
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 3. Cửa sổ xác nhận xóa dữ liệu kẹt thật */}
      <ConfirmModal
        open={showDeleteModal}
        title="Dọn dẹp bản ghi lô lỗi"
        message="Hành động này sẽ xóa vĩnh viễn dữ liệu tạm thời của lô lỗi này khỏi hệ thống. Bạn chắc chắn chứ?"
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setShowDeleteModal(false);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
