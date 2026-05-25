import React from 'react';
import { Bell, Search } from 'lucide-react';

const AdminTopbar = () => {
  return (
    <header className="h-[88px] px-4 md:px-6 flex items-center justify-between gap-4 bg-white border-b border-outline-variant/70">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-on-surface-variant/70">Thống kê kinh doanh</p>
        <h1 className="mt-1 text-xl md:text-2xl font-black text-on-surface">Tổng quan doanh số</h1>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <label className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/70 bg-surface-container/30 min-w-[280px]">
          <Search className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
          <input
            type="text"
            placeholder="Tìm đơn hàng, khách hàng"
            className="w-full bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/45"
          />
        </label>

        <button
          type="button"
          className="w-10 h-10 rounded-full border border-outline-variant/70 bg-white flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-primary text-white font-black flex items-center justify-center shadow-md shadow-primary/10">
          A
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;