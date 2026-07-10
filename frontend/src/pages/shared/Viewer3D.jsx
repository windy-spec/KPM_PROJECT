import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Printer, Info, Home } from "lucide-react";
import apiClient from "../../services/apiClient";

const Viewer3D = () => {
  const { id } = useParams();
  const [drawing, setDrawing] = useState(null);
  const [htmlCode, setHtmlCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [infoOpen, setInfoOpen] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchDrawing = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/drawings/${id}`);
        const data = res.data?.data;
        if (data?.html_code) {
          setDrawing(data);
          setHtmlCode(data.html_code);
        } else {
          setError("Sản phẩm chưa có mô hình 3D tương tác.");
        }
      } catch (err) {
        console.error("Lỗi khi tải mô hình 3D:", err);
        setError("Không thể tải mô hình 3D. Vui lòng kiểm tra lại đường dẫn.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDrawing();
  }, [id]);

  const handlePrint = () => {
    // Ẩn panel thông tin trước khi in (tùy chọn) để mô hình sạch sẽ
    const wasInfoOpen = infoOpen;
    if (wasInfoOpen) setInfoOpen(false);

    setTimeout(() => {
      window.print();
      if (wasInfoOpen) setInfoOpen(true);
    }, 300);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-50 flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Đang tải mô hình 3D...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-50 flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">Lỗi tải mô hình</h2>
          <p className="text-on-surface-variant/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const safeHtml = htmlCode
    .replace(/bottom:\s*40px;?/g, "bottom: 15px;")
    .replace(
      "</head>", 
      "<style>body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; background-color: transparent !important; } * { box-sizing: border-box !important; } @media print { @page { size: landscape; margin: 0; } body, html { overflow: visible !important; background: white !important; } canvas { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; } }</style></head>"
    );

  return (
    <>
    <style>{`
      @media print {
        @page { size: landscape; margin: 0; }
        body * { visibility: hidden; }
        #print-viewer, #print-viewer * { visibility: visible; }
        #print-viewer { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: visible !important; display: block !important; }
        .print-hidden { display: none !important; }
      }
    `}</style>
    <div 
      id="print-viewer"
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-[9999] bg-slate-50 overflow-hidden font-sans m-0 p-0"
    >
      
      {/* Khung iframe 3D */}
      <iframe
        srcDoc={safeHtml}
        className="absolute inset-0 w-full h-full border-none m-0 p-0 block"
        title="Mô hình 3D tương tác KPM"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Control Layer (Nổi lên trên Iframe) */}
      <div className="absolute inset-0 pointer-events-none z-10 p-4 md:p-6 flex flex-col justify-between">
        
        {/* Top Header: Logo KPM, Home Button & Info Panel */}
        <div className="flex justify-between items-start pointer-events-auto">
          
          <div className="flex items-center gap-3">
            {/* Nút Home */}
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border border-white/50 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all group"
              title="Về Trang chủ"
            >
              <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Logo KPM */}
            <Link to="/" className="flex items-center gap-2 group bg-white/80 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-white/50 hover:bg-white transition-all">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm shadow-inner">
                KPM
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black text-on-surface leading-tight group-hover:text-primary transition-colors">KPM Industry</div>
                <div className="text-[10px] text-on-surface-variant font-medium leading-tight">Giải pháp Toàn diện</div>
              </div>
            </Link>
          </div>

          {/* Góc trên bên phải: Info Panel + Control Buttons */}
          <div className="flex flex-col items-end gap-3 pointer-events-none">
            <div className="flex gap-2 pointer-events-auto print:hidden">
              <button 
                onClick={handlePrint}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all group"
                title="Lưu PDF / In mô hình"
              >
                <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => setInfoOpen(!infoOpen)}
                className="w-10 h-10 bg-white rounded-full shadow-md border border-outline-variant/20 flex items-center justify-center text-on-surface hover:text-primary transition-colors z-20"
                title="Thông tin mô hình"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {/* Info Box (Nằm dưới các nút bấm) */}
            <div className={`pointer-events-auto bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-2xl border border-white/40 w-[280px] md:w-[320px] transition-all duration-300 origin-top-right ${infoOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Đang xem trực tiếp</span>
              </div>
              
              <h1 className="text-base md:text-lg font-black text-on-surface mb-1 leading-tight">
                {drawing?.products?.product_name || drawing?.drawing_name || 'Mô hình Sản phẩm'}
              </h1>
              <p className="text-xs text-on-surface-variant mb-4 font-medium">
                Mã: {drawing?.products?.product_code || drawing?.drawing_name || 'N/A'}
              </p>

              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-on-surface-variant/70 font-bold uppercase mb-0.5">Đơn vị thiết kế</div>
                  <div className="text-xs font-black text-primary">KPM Industry</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
};

export default Viewer3D;
