import React from 'react';
import {
  Factory,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Send,
  Globe
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1e2b2b] text-white pt-20 pb-8 mt-20 border-t border-white/[0.08] relative overflow-hidden">

      {/* Hiệu ứng background mờ - Giúp góc chân trang có ánh sáng Teal lung linh */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#008080]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#c6e9e9]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16">

        {/* CỘT 1: THƯƠNG HIỆU & GIỚI THIỆU */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 group-hover:border-[#008080] transition-all duration-300">
              <Factory className="w-7 h-7 text-[#008080] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight leading-none text-white">KPM</span>
              <span className="text-[10px] text-[#e3fffe] tracking-widest uppercase mt-1 font-bold">Mechanical</span>
            </div>
          </div>

          {/* Chuyển thành text-white hoàn toàn để sáng rõ nhất */}
          <p className="text-sm text-white leading-relaxed font-normal max-w-sm">
            Chuyên gia hàng đầu trong lĩnh vực giải pháp kết cấu thép cấu kiện cao cấp và gia công sắt mỹ thuật CNC chính xác.
          </p>

          {/* Mạng xã hội - Đổi màu icon mặc định sáng hơn */}
          <div className="flex gap-3 pt-2">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/groups/1212236082236816"
              className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:-translate-y-1 transition-all duration-300"
              title="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@MixiGaming3con"
              className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-[#FF0000] hover:border-[#FF0000] hover:-translate-y-1 transition-all duration-300"
              title="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Website/Globe */}
            <a
              href="#"
              className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-[#006565] hover:border-[#006565] hover:-translate-y-1 transition-all duration-300"
              title="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* CỘT 2: DỊCH VỤ */}
        <div className="lg:col-span-2">
          {/* Dùng màu xanh siêu sáng e3fffe của bạn làm tiêu đề */}
          <h4 className="font-black mb-6 uppercase text-xs tracking-widest text-[#e3fffe] border-b border-white/20 pb-2">
            Dịch vụ
          </h4>
          <ul className="flex flex-col gap-3.5 text-sm text-white font-normal">
            {['Cắt CNC theo yêu cầu', 'Gia công bản mã', 'Lắp dựng nhà tiền chế'].map((item, index) => (
              <li key={index}>
                {/* Khi hover sẽ đổi sang màu xanh sáng để tạo điểm nhấn tương tác */}
                <a href="#" className="hover:text-[#c6e9e9] flex items-center gap-1 group transition-all duration-300 hover:translate-x-1">
                  <ArrowRight className="w-0 h-3 opacity-0 group-hover:w-3 group-hover:opacity-100 text-[#c6e9e9] transition-all duration-300" />
                  <span>{item}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* CỘT 3: HỖ TRỢ */}
        <div className="lg:col-span-2">
          <h4 className="font-black mb-6 uppercase text-xs tracking-widest text-[#e3fffe] border-b border-white/20 pb-2">
            Hỗ trợ
          </h4>
          <ul className="flex flex-col gap-3.5 text-sm text-white font-normal">
            {['Quy trình đặt hàng', 'Chính sách vận chuyển', 'Bảo hành & Đổi trả'].map((item, index) => (
              <li key={index}>
                <a href="#" className="hover:text-[#c6e9e9] flex items-center gap-1 group transition-all duration-300 hover:translate-x-1">
                  <ArrowRight className="w-0 h-3 opacity-0 group-hover:w-3 group-hover:opacity-100 text-[#c6e9e9] transition-all duration-300" />
                  <span>{item}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* CỘT 4: LIÊN HỆ & NEWSLETTER */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <h4 className="font-black mb-1 uppercase text-xs tracking-widest text-[#e3fffe] border-b border-white/20 pb-2">
            Thông tin liên hệ
          </h4>

          <div className="space-y-4 text-sm text-white font-normal">
            <div className="flex items-start gap-3 group">
              <MapPin className="w-4 h-4 shrink-0 text-[#008080] mt-0.5 group-hover:scale-110 transition-transform" />
              <p className="hover:text-[#c6e9e9] transition-colors">123 Đường Số 4, TP. Hồ Chí Minh</p>
            </div>

            <a href="tel:0900123456" className="flex items-center gap-3 group hover:text-[#c6e9e9] transition-colors w-max">
              <Phone className="w-4 h-4 shrink-0 text-[#008080] group-hover:scale-110 transition-transform" />
              <span className="font-bold">0900 123 456</span>
            </a>

            <a href="mailto:contact@kpm.vn" className="flex items-center gap-3 group hover:text-[#c6e9e9] transition-colors w-max">
              <Mail className="w-4 h-4 shrink-0 text-[#008080] group-hover:scale-110 transition-transform" />
              <span>contact@kpm.vn</span>
            </a>
          </div>

          {/* Form đăng ký nhận tin tức */}
          <div className="mt-2 space-y-2">
            <p className="text-xs font-bold text-[#e3fffe]">Đăng ký nhận báo giá nhanh</p>
            <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center">
              <input
                type="email"
                placeholder="Email của bạn..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pr-12 text-xs text-white outline-none focus:border-[#008080] focus:bg-white/[0.15] transition-all placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 p-1.5 bg-[#008080] text-white rounded-lg hover:bg-[#006565] active:scale-95 transition-all"
                title="Gửi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* BẢN QUYỀN & CHÍNH SÁCH DƯỚI CÙNG */}
      <div className="max-w-[1280px] mx-auto px-5 mt-4 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#e3fffe] font-medium">
        <p>© {new Date().getFullYear()} KPM MECHANICAL. Bảo lưu mọi quyền.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;