import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronRight, MessageCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "Làm thế nào để yêu cầu báo giá gia công CNC?",
      answer: "Bạn có thể sử dụng chức năng 'Yêu cầu báo giá' trên hệ thống. Chọn linh kiện, điền kích thước, vật liệu và số lượng, sau đó gửi yêu cầu. Xưởng KPM sẽ phản hồi báo giá cho bạn trong thời gian sớm nhất."
    },
    {
      question: "Tôi có thể thanh toán bằng những hình thức nào?",
      answer: "Chúng tôi hỗ trợ nhiều hình thức thanh toán bao gồm: Thanh toán qua cổng VNPay, Ví điện tử MoMo, Chuyển khoản ngân hàng (VietQR) và Thanh toán khi nhận hàng (COD)."
    },
    {
      question: "Phí vận chuyển và lắp đặt được tính như thế nào?",
      answer: "Phí vận chuyển mặc định là 150.000đ cho các đơn hàng dưới 5.000.000đ và miễn phí cho đơn hàng lớn hơn. Phí lắp đặt tại nhà sẽ tự động được hệ thống tính toán (khoảng 8% giá trị linh kiện) nếu bạn tích chọn yêu cầu lắp đặt khi thanh toán."
    },
    {
      question: "Sau khi thanh toán thành công, bao lâu tôi sẽ nhận được hàng?",
      answer: "Thời gian nhận hàng phụ thuộc vào loại hàng hóa. Với các linh kiện có sẵn, chúng tôi sẽ giao trong 1-3 ngày làm việc. Đối với hàng gia công theo yêu cầu, thời gian sản xuất và giao hàng dao động từ 5-10 ngày tùy thuộc vào độ phức tạp của bản vẽ."
    },
    {
      question: "Làm sao để biết khi nào đơn hàng của tôi đang được sản xuất?",
      answer: "Bạn có thể theo dõi tiến độ đơn hàng tại mục 'Lịch sử đơn hàng' trong Hồ sơ cá nhân. Trạng thái đơn hàng sẽ được cập nhật liên tục từ Chờ xử lý -> Đang sản xuất -> Đang giao hàng -> Hoàn thành."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-container/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[800px] mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-outline-variant/60">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 text-on-surface-variant font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-bold">Câu hỏi thường gặp</span>
        </div>

        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-on-surface uppercase tracking-wider mb-4">
            CÂU HỎI THƯỜNG GẶP (FAQ)
          </h1>
          <p className="text-on-surface-variant">
            Giải đáp các thắc mắc phổ biến về quy trình đặt hàng, gia công CNC và thanh toán tại KPM.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="p-6 rounded-2xl border border-outline-variant/60 hover:border-primary/30 hover:shadow-md transition-all bg-surface-container/10 group">
              <h3 className="text-lg font-bold text-on-surface mb-3 flex items-start gap-3">
                <span className="text-primary">Q:</span> 
                {faq.question}
              </h3>
              <p className="text-on-surface-variant leading-relaxed flex items-start gap-3">
                <span className="text-outline-variant font-black">A:</span>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 rounded-2xl p-6 text-center border border-primary/20">
          <h4 className="font-bold text-on-surface mb-2">Bạn vẫn còn thắc mắc?</h4>
          <p className="text-sm text-on-surface-variant mb-4">Hãy liên hệ với chúng tôi để được hỗ trợ trực tiếp.</p>
          <a href="mailto:support@kpm.com" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors">
            <MessageCircle className="w-4 h-4" /> Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
