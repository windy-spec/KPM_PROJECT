import React from 'react';
import { CheckCircle2, FileWarning, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import Portal from '../common/Portal';

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatErrors = (errors) => {
  if (!errors) return [];

  if (Array.isArray(errors)) return errors.filter(Boolean);
  if (typeof errors === 'string') return [errors];

  return Object.values(errors).filter(Boolean);
};

const RowCard = ({ row, tone = 'valid' }) => {
  const data = row?.data || {};
  const errors = formatErrors(row?.validation_errors);

  return (
    <div className={`rounded-2xl border p-4 ${tone === 'valid' ? 'border-teal-200 bg-teal-50/50' : 'border-rose-200 bg-rose-50/60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black text-on-surface">{data.product_name || 'Chưa có tên'}</div>
          <div className="mt-1 text-[11px] font-semibold text-on-surface-variant/70">
            Mã: <span className="font-black text-on-surface">{data.product_code || '-'}</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${tone === 'valid' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
          {tone === 'valid' ? 'VALID' : 'INVALID'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-on-surface-variant/75">
        <div className="rounded-xl bg-white px-3 py-2 border border-outline-variant/50">
          <span className="font-bold">Danh mục:</span> {data.category_code || data.category_id || '-'}
        </div>
        <div className="rounded-xl bg-white px-3 py-2 border border-outline-variant/50 font-mono whitespace-pre-wrap break-words">
          <span className="font-sans font-bold">Default specs:</span> {typeof data.default_specs === 'string' ? data.default_specs : JSON.stringify(data.default_specs || {}, null, 0)}
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] text-rose-700 space-y-1">
          <div className="font-black uppercase tracking-[0.18em] text-rose-600">Lỗi kiểm tra</div>
          <ul className="list-disc pl-4 space-y-1">
            {errors.map((err, index) => (
              <li key={`${row?.id || 'row'}-${index}`}>{String(err)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const ImportBatchReviewModal = ({
  batch,
  loading = false,
  actionLoading = false,
  onClose,
  onReject,
  onApprove,
  onExportInvalid,
}) => {
  const rows = toArray(batch?.rows);
  const validRows = rows.filter((row) => row.validation_status === 'VALID');
  const invalidRows = rows.filter((row) => row.validation_status === 'INVALID');

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
        <div className="w-full max-w-7xl overflow-hidden rounded-[28px] border border-outline-variant/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-on-surface">Review batch import sản phẩm</h3>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant/70">
                  Sau khi import file Excel, hệ thống đã tách dữ liệu thành 2 nhóm: valid và invalid. Bạn có thể duyệt hoặc hủy toàn bộ batch này.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-on-surface-variant/75">
                  <span className="rounded-full border border-outline-variant/60 bg-surface-container/20 px-3 py-1">Batch ID: <span className="font-black text-on-surface">{batch?.batch_id || batch?.id || '-'}</span></span>
                  <span className="rounded-full border border-outline-variant/60 bg-surface-container/20 px-3 py-1">Trạng thái: <span className="font-black text-on-surface">{batch?.status || 'PENDING'}</span></span>
                  <span className="rounded-full border border-outline-variant/60 bg-surface-container/20 px-3 py-1">Valid: <span className="font-black text-teal-700">{validRows.length}</span></span>
                  <span className="rounded-full border border-outline-variant/60 bg-surface-container/20 px-3 py-1">Invalid: <span className="font-black text-rose-700">{invalidRows.length}</span></span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container transition-colors"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            {loading ? (
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container/20 px-5 py-8 text-center text-sm font-semibold text-on-surface-variant/70">
                Đang tải chi tiết batch...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <section className="rounded-3xl border border-teal-200 bg-teal-50/30 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-teal-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <h4 className="text-sm font-black uppercase tracking-[0.22em]">Valid</h4>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant/70">
                        Dữ liệu đúng định dạng, có thể được approve để ghi vào database.
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                      {validRows.length} dòng
                    </span>
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {validRows.length > 0 ? validRows.map((row) => <RowCard key={row.id} row={row} tone="valid" />) : (
                      <div className="rounded-2xl border border-dashed border-teal-200 bg-white px-4 py-8 text-center text-sm text-on-surface-variant/60">
                        Chưa có dòng valid nào.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-rose-200 bg-rose-50/30 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-rose-700">
                        <FileWarning className="h-5 w-5" />
                        <h4 className="text-sm font-black uppercase tracking-[0.22em]">Invalid</h4>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant/70">
                        Dữ liệu sai định dạng, có thể xuất file lỗi để sửa hoặc reject toàn bộ batch.
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">
                      {invalidRows.length} dòng
                    </span>
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {invalidRows.length > 0 ? invalidRows.map((row) => <RowCard key={row.id} row={row} tone="invalid" />) : (
                      <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-4 py-8 text-center text-sm text-on-surface-variant/60">
                        Không có dòng invalid nào.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant/50 bg-surface-container/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs text-on-surface-variant/70">
              Approve sẽ lưu toàn bộ dòng valid vào database. Hủy batch sẽ vô hiệu hóa batch này và xóa toàn bộ dữ liệu tạm.
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {invalidRows.length > 0 ? (
                <button
                  type="button"
                  onClick={onExportInvalid}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <FileWarning className="h-4 w-4" />
                  Tải file lỗi
                </button>
              ) : null}

              <button
                type="button"
                onClick={onReject}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Hủy batch
              </button>

              <button
                type="button"
                onClick={onApprove}
                disabled={actionLoading || validRows.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {actionLoading ? 'Đang xử lý...' : 'Approve batch'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ImportBatchReviewModal;
