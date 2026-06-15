import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

const NotFound = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#f6f8f8] text-on-surface flex flex-col items-center justify-center p-5 selection:bg-primary/20">
            <div className="max-w-md w-full text-center space-y-6 bg-white border border-outline-variant/70 rounded-[32px] p-8 md:p-12 shadow-sm">

                {/* Icon cảnh báo */}
                <div className="mx-auto w-30 h-30 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
                    <ShieldAlert className="w-24 h-24" />
                </div>

                {/* Mã lỗi */}
                <div className="space-y-2">
                    <h1 className="text-7xl font-black tracking-tighter text-primary">404</h1>
                    <h2 className="text-lg font-black uppercase tracking-[0.2em] text-on-surface">
                        Không tìm thấy trang
                    </h2>
                </div>

                {/* Đoạn văn mô tả và hiển thị đường dẫn lỗi */}
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    Đường dẫn không tồn tại trên hệ thống hoặc đã bị thay đổi, vui lòng quay trở lại.
                </p>

                <div className="pt-4 border-t border-dashed border-outline-variant/40 flex flex-col sm:flex-row gap-3">
                    {/* Nút quay lại trang trước đó của trình duyệt */}
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex-1 border border-outline-variant rounded-xl text-xs font-bold h-12 flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>

                    {/* Nút về trang chủ */}
                    <Link
                        to="/"
                        className="flex-1 bg-primary text-white text-xs font-black uppercase tracking-wider h-12 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-md shadow-primary/10"
                    >
                        <Home className="w-4 h-4" />
                        Trang chủ
                    </Link>
                </div>
            </div>

            {/* Footer nhỏ chân trang */}
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                KPM System &copy; 2026
            </p>
        </div>
    );
};

export default NotFound;