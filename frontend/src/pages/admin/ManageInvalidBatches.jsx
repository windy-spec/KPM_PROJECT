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
  Filter,
  TriangleAlert,
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

  // Thanh công cụ tìm kiếm & bộ lọc đồng bộ AdminProductPanel
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Xem chi tiết lỗi lô hàng
  const [selectedBatch, setSelectedBatch] = useState(null);

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
      // Gắn thêm file_name vào để Modal hiển thị
      setSelectedBatch({ ...detailData, file_name: batch.file_name });
    } catch (err) {
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
      showError("Không thể tải file excel lỗi.");
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
  const totalPages = Math.ceil(filteredBatches.length / pageSize);
  const currentTableData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, page]);

  return (
    <div className="space-y-6 p-1">
      {/* 1. Header tóm tắt giống cấu trúc AdminProductPanel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">
            Lô Hàng Import Lỗi
          </h1>
          <p className="text-sm font-medium text-on-surface-variant/80">
            Quản lý, xem chi tiết lỗi kiểm định dữ liệu và dọn dẹp các tệp Excel
            tạm thời.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchInvalidBatches}
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface px-4 text-sm font-bold text-on-surface shadow-sm transition-all hover:bg-surface-container-low disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider">
              Tổng số lô lỗi
            </p>
            <p className="text-2xl font-black text-on-surface">
              {filteredBatches.length} Lô
            </p>
          </div>
        </div>
      </div>

      {/* 2. Thanh công cụ Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Tìm theo mã lô, tên tệp tin Excel..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface pl-10 pr-4 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 h-10 text-xs font-bold text-on-surface-variant">
            <Filter className="h-3.5 w-3.5" />
            <span>Trạng thái:</span>
          </div>
          {["ALL", "INVALID", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`h-10 px-4 rounded-xl text-xs font-black transition-all ${
                statusFilter === st
                  ? "bg-primary text-white shadow-sm"
                  : "border border-outline-variant/80 bg-surface text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {st === "ALL"
                ? "Tất cả lô"
                : st === "INVALID"
                  ? "Lỗi Định Dạng"
                  : "Bị Từ Chối"}
            </button>
          ))}
        </div>
      </div>

      {/* Thông báo lỗi nếu có từ kết nối API */}
      {error && (
        <div className="flex items-center gap-3 p-4 border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 3. Bảng Dữ Liệu Đồng Bộ Hệ Giao Diện Sạch */}
      <div className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low/40 text-xs font-bold text-on-surface-variant/80 uppercase tracking-wider">
                <th className="p-4 w-20 text-center">Mã Lô</th>
                <th className="p-4">Tên Tệp Tin Excel</th>
                <th className="p-4">Thời Gian Tải Lên</th>
                <th className="p-4 text-center">Số Dòng Lỗi</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4 text-center w-32">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs font-bold text-on-surface-variant/60">
                        Đang quét dọn dữ liệu hệ thống...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : currentTableData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">
                      <AlertCircle className="h-8 w-8" />
                      <p className="text-sm font-bold">
                        Không tìm thấy lô hàng lỗi nào thực tế trên hệ thống.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTableData.map((batch) => {
                  const errorCount = batch.invalid_count || 0;
                  return (
                    <tr
                      key={batch.id}
                      className="group hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                      onClick={(e) => handleViewClick(batch, e)}
                    >
                      <td className="p-4 text-center font-mono font-bold text-primary">
                        #{batch.id}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-on-surface max-w-xs truncate sm:max-w-md">
                          {batch.file_name || "Không rõ tên file"}
                        </div>
                      </td>
                      <td className="p-4 text-on-surface-variant/90 font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-60" />
                          {formatDate(batch.created_at)}
                        </div>
                      </td>
                      <td className="p-4 text-center font-black text-rose-600 bg-rose-50/10">
                        {errorCount} dòng
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                            batch.status === "REJECTED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {batch.status || "INVALID"}
                        </span>
                      </td>
                      <td
                        className="p-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => handleViewClick(batch, e)} // ✅ SỬA LẠI THÀNH THẾ NÀY
                            title="Xem chi tiết dòng lỗi"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(batch, e)}
                            title="Xóa dọn dẹp hệ thống"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
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
          <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/20">
            <p className="text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">
              Trang {page} / {totalPages} ({filteredBatches.length} bản ghi)
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* 4. Portal Modal Xem Chi Tiết Dòng Lỗi Thực Tế */}
      {selectedBatch && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-[32px] border border-outline-variant/60 bg-surface shadow-2xl overflow-hidden animate-scale-up">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-low px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-on-surface truncate max-w-md sm:max-w-xl">
                      Chi Tiết Lỗi Lô: {selectedBatch.file_name}
                    </h3>
                    <p className="text-xs font-bold text-on-surface-variant/70">
                      Mã số hệ thống:{" "}
                      <span className="font-mono text-primary">
                        #{selectedBatch.id}
                      </span>{" "}
                      • Đăng lúc: {formatDate(selectedBatch.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Thân Modal Chứa Bảng Con */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-2xl border border-outline-variant/50 overflow-hidden bg-surface-container-lowest">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/40 bg-surface-container-low/60 text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                        <th className="p-3 w-32">Mã Sản Phẩm</th>
                        <th className="p-3 w-48">Tên Sản Phẩm</th>
                        <th className="p-3 w-32">Mã Danh Mục</th>
                        <th className="p-3">
                          Nội Dung Chi Tiết Lỗi Kiểm Định (Validation)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-medium">
                      {!selectedBatch.rows ||
                      selectedBatch.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-8 text-center text-on-surface-variant/60 font-bold"
                          >
                            Không tìm thấy dữ liệu dòng lỗi nào của lô này trên
                            cơ sở dữ liệu.
                          </td>
                        </tr>
                      ) : (
                        selectedBatch.rows.map((row, idx) => {
                          // Gọi đúng biến `data` thay vì `raw_data` do BE đã xử lý sẵn
                          const rawData =
                            typeof row.data === "string"
                              ? JSON.parse(row.data)
                              : row.data || {};
                          const errors =
                            typeof row.validation_errors === "string"
                              ? JSON.parse(row.validation_errors)
                              : row.validation_errors || {};

                          return (
                            <tr
                              key={row.id || idx}
                              className="hover:bg-surface-container-low/30 transition-colors"
                            >
                              <td className="p-3 font-mono font-bold uppercase tracking-wider text-primary">
                                {rawData.product_code || (
                                  <span className="text-on-surface-variant/40 italic">
                                    Trống
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-on-surface">
                                {rawData.product_name || "N/A"}
                              </td>
                              <td className="p-3 font-semibold uppercase text-on-surface-variant">
                                {rawData.category_code || "N/A"}
                              </td>
                              <td className="p-3 text-rose-600 font-semibold whitespace-pre-line bg-rose-50/20">
                                {errors && Object.keys(errors).length > 0
                                  ? Object.values(errors)
                                      .map((err, i) => `• ${err}`)
                                      .join("\n")
                                  : "Lỗi cấu trúc hoặc định dạng dữ liệu không đồng nhất."}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/60 px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleDownloadErrorFile(selectedBatch.id)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-sm transition-all hover:bg-emerald-700"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Xuất Excel Sửa Lỗi
                </button>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="h-10 rounded-xl border border-outline-variant bg-surface px-5 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* 5. Cửa sổ xác nhận xóa dữ liệu kẹt thật */}
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
