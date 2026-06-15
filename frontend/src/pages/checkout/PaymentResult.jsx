import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Home, FileText } from "lucide-react";

const PaymentResult = () => {
  // Lấy các tham số trên thanh URL do VNPay/MoMo trả về
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // 'success' | 'failed' | 'loading'
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Tham số trả về của VNPay
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    // Tham số trả về của MoMo
    const resultCode = searchParams.get("resultCode");

    if (vnp_ResponseCode) {
      // Chuẩn VNPay: 00 là thành công
      if (vnp_ResponseCode === "00") {
        setStatus("success");
        setMessage("Thanh toán đơn hàng qua VNPay thành công!");
      } else {
        setStatus("failed");
        setMessage(
          "Thanh toán VNPay thất bại hoặc đã bị hủy (Mã lỗi: " +
            vnp_ResponseCode +
            ")",
        );
      }
    } else if (resultCode) {
      // Chuẩn MoMo: 0 là thành công
      if (resultCode === "0") {
        setStatus("success");
        setMessage("Thanh toán đơn hàng qua MoMo thành công!");
      } else {
        setStatus("failed");
        setMessage("Thanh toán MoMo thất bại (Mã lỗi: " + resultCode + ")");
      }
    } else {
      // Nếu không có param nào (user tự gõ link)
      setStatus("failed");
      setMessage("Không tìm thấy thông tin giao dịch hợp lệ trên hệ thống.");
    }
  }, [searchParams]);

  if (status === "loading")
    return (
      <div className="text-center py-20 font-bold text-on-surface-variant">
        Đang xử lý kết quả giao dịch...
      </div>
    );

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-surface-container/10 p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 p-8 max-w-md w-full text-center">
        {status === "success" ? (
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        ) : (
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        )}

        <h2
          className={`text-2xl font-black uppercase tracking-wider mb-2 ${status === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {status === "success"
            ? "Thanh toán thành công"
            : "Giao dịch thất bại"}
        </h2>

        <p className="text-sm text-on-surface-variant font-medium mb-8 px-4 leading-relaxed">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/profile?panel=orders"
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold tracking-wide hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <FileText className="w-4 h-4" /> Xem chi tiết đơn hàng
          </Link>
          <Link
            to="/"
            className="w-full bg-surface-container/50 text-on-surface py-3.5 rounded-xl text-sm font-bold tracking-wide hover:bg-surface-container transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
