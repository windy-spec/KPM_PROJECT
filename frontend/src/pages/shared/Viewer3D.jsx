import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import apiClient from "../../services/apiClient";

const Viewer3D = () => {
  const { id } = useParams();
  const [htmlCode, setHtmlCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrawing = async () => {
      try {
        setLoading(true);
        // Lấy thông tin bản vẽ của sản phẩm
        const res = await apiClient.get(`/drawings/${id}`);
        const drawing = res.data?.data;
        if (drawing?.html_code) {
          setHtmlCode(drawing.html_code);
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Đang tải mô hình 3D...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
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

  // Loại bỏ khoảng trắng thừa ở bottom nếu có trong code kịch bản cũ
  const safeHtml = htmlCode.replace(/bottom:\s*40px;?/g, "bottom: 15px;");

  return (
    <div className="h-screen w-screen bg-slate-50 overflow-hidden relative">
      <iframe
        srcDoc={safeHtml}
        className="w-full h-full border-none"
        title="Mô hình 3D tương tác KPM"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default Viewer3D;
