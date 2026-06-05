import React from 'react';
import Portal from './Portal';

const ConfirmModal = ({ open, title = 'Xác nhận', message = 'Bạn chắc chắn muốn tiếp tục?', confirmText = 'Đồng ý', cancelText = 'Hủy', onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md overflow-hidden rounded-[20px] border border-outline-variant/60 bg-white shadow-lg">
          <div className="border-b border-outline-variant/50 px-6 py-4">
            <h3 className="text-sm font-black uppercase tracking-[0.12em]">{title}</h3>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-on-surface-variant/75">{message}</p>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/50 px-6 py-4 bg-surface-container/10">
            <button type="button" onClick={onCancel} className="rounded-xl border border-outline-variant/60 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">{cancelText}</button>
            <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700 transition-colors">{confirmText}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ConfirmModal;
