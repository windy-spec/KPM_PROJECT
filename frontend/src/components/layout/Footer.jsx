import React from 'react';
// Thay Facebook -> FacebookIcon, Youtube -> YoutubeIcon hoặc dùng các icon cơ bản
import { Factory, Mail, Phone, MapPin, Share2, PlayCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8 mt-20">
      <div className="max-w-[1280px] mx-auto px-5 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Cột 1 */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Factory className="w-8 h-8 text-primary-container" />
            <span className="text-3xl font-bold tracking-tighter">KPM</span>
          </div>
          <p className="text-sm text-outline-variant leading-relaxed">
            Chuyên gia giải pháp kết cấu thép và sắt mỹ thuật.
          </p>
          <div className="flex gap-4">
            <div className="p-2 bg-white/10 rounded-full hover:bg-primary cursor-pointer">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="p-2 bg-white/10 rounded-full hover:bg-primary cursor-pointer">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Cột 2 & 3 & 4*/}
        <div>
          <h4 className="font-bold mb-6 uppercase text-sm border-b border-white/10 pb-2">Dịch vụ</h4>
          <ul className="flex flex-col gap-3 text-sm text-outline-variant">
            <li>Cắt CNC theo yêu cầu</li>
            <li>Gia công bản mã</li>
            <li>Lắp dựng nhà tiền chế</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 uppercase text-sm border-b border-white/10 pb-2">Hỗ trợ</h4>
          <ul className="flex flex-col gap-3 text-sm text-outline-variant">
            <li>Quy trình đặt hàng</li>
            <li>Chính sách vận chuyển</li>
            <li>Bảo hành & Đổi trả</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-bold mb-6 uppercase text-sm border-b border-white/10 pb-2">Liên hệ</h4>
          <div className="flex items-start gap-3 text-sm text-outline-variant">
            <MapPin className="w-5 h-5 shrink-0 text-primary-container" />
            <p>123 Đường Số 4, TP.HCM</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-outline-variant">
            <Phone className="w-5 h-5 shrink-0 text-primary-container" />
            <p>0900 123 456</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto px-5 mt-16 pt-8 border-t border-white/5 text-center text-xs text-outline-variant">
        <p>© 2026 KPM MECHANICAL.</p>
      </div>
    </footer>
  );
};

export default Footer;