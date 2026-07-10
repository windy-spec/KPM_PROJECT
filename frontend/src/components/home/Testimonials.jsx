import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const reviews = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      role: "Giám đốc Dự án, Công ty Xây dựng XYZ",
      content: "Hệ thống bóc tách vật tư tự động của KPM đã giúp chúng tôi tiết kiệm đến 40% thời gian xử lý hồ sơ thầu. Độ chính xác rất cao và giao diện dễ sử dụng.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=11"
    },
    {
      id: 2,
      name: "Trần Thị B",
      role: "Trưởng phòng Mua hàng, Tập đoàn ABC",
      content: "Chất lượng gia công thép tấm của KPM luôn đạt chuẩn. Thời gian giao hàng nhanh chóng, đúng cam kết. Tôi rất hài lòng với dịch vụ hỗ trợ khách hàng.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=5"
    },
    {
      id: 3,
      name: "Lê Hoàng C",
      role: "Kỹ sư Cơ khí, Xưởng gia công DEF",
      content: "Từ ngày chuyển sang dùng nền tảng của KPM để đặt hàng bản mã, công việc của tôi nhàn hơn hẳn. Các thông số được tùy chỉnh linh hoạt và báo giá tức thời.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?img=33"
    }
  ];

  return (
    <section id="testimonials" className="scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-[10px] bg-primary/10 text-primary font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
          Phản hồi từ khách hàng
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-on-surface uppercase tracking-tight mb-4 mt-3">
          Khách hàng nói gì về chúng tôi
        </h2>
        <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
          Hơn 1000+ doanh nghiệp đã tin tưởng và sử dụng hệ thống của KPM để tối ưu hóa quy trình gia công và cung ứng vật tư cơ khí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((review) => (
          <div key={review.id} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all relative">
            <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
            <div className="flex gap-1 mb-4">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-on-surface-variant text-sm italic mb-6 leading-relaxed line-clamp-4">
              "{review.content}"
            </p>
            <div className="flex items-center gap-3">
              <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">{review.name}</h4>
                <p className="text-[10px] text-on-surface-variant font-medium">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
