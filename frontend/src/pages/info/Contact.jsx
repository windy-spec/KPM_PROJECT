import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import feedbackService from '../../services/feedback.service'
import { toast } from 'react-toastify';

const Contact = () => {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackService.createFeedback(formData);
      toast.success('Gửi góp ý thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setFormData({ category: '', title: '', content: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại sau.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-16 md:pb-24">
      {/* Header Banner */}
      <div className="w-full bg-primary py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-[1280px] mx-auto px-5 relative z-10 text-center">
          <span className="text-[10px] bg-white/20 text-white font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/30 mb-4 inline-block">
            Kết nối với KPM
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-sm md:text-base text-primary-100 font-medium max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn về dịch vụ gia công, bóc tách vật tư và hệ thống của KPM.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-5 mt-[-40px] relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-outline-variant/30 h-full">
              <h2 className="text-xl font-black text-on-surface uppercase tracking-tight mb-6">
                Thông tin liên hệ
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Trụ sở chính</h3>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      123 Đường Công Nghệ, Khu CNC, Quận 9, TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Điện thoại</h3>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      Hotline: 1900 1234<br />
                      Hỗ trợ kỹ thuật: 090 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Email</h3>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      contact@kpm-system.vn<br />
                      support@kpm-system.vn
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Giờ làm việc</h3>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                      Thứ 2 - Thứ 6: 08:00 - 17:30<br />
                      Thứ 7: 08:00 - 12:00
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links (Mock) */}
              <div className="mt-8 pt-8 border-t border-outline-variant/30">
                <h3 className="text-sm font-bold text-on-surface mb-4">Kết nối qua mạng xã hội</h3>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-on-surface-variant">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-on-surface-variant">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-on-surface-variant">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-outline-variant/30 h-full">
              <h2 className="text-xl font-black text-on-surface uppercase tracking-tight mb-2">
                Gửi tin nhắn cho chúng tôi
              </h2>
              <p className="text-sm text-on-surface-variant font-medium mb-8">
                Điền vào biểu mẫu dưới đây, đội ngũ hỗ trợ của KPM sẽ phản hồi bạn trong thời gian sớm nhất.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Chủ đề <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium text-on-surface"
                  >
                    <option value="" disabled>Chọn chủ đề bạn cần hỗ trợ</option>
                    <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                    <option value="Tư vấn dịch vụ & Báo giá">Tư vấn dịch vụ & Báo giá</option>
                    <option value="Thanh toán & Hóa đơn">Thanh toán & Hóa đơn</option>
                    <option value="Vấn đề khác">Vấn đề khác</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tiêu đề <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề góp ý"
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Nội dung tin nhắn <span className="text-error">*</span>
                  </label>
                  <textarea
                    placeholder="Chi tiết vấn đề bạn đang gặp phải..."
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows="5"
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-primary text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto mt-2"
                >
                  <Send className="w-4 h-4" /> Gửi yêu cầu
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Map Placeholder */}
      <div className="max-w-[1280px] mx-auto w-full px-5 mt-12">
        <div className="w-full h-[400px] bg-surface-container-low rounded-3xl border border-outline-variant/30 overflow-hidden relative group">
          {/* Giả lập bản đồ, trong thực tế sẽ nhúng iframe Google Maps vào đây */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074')] opacity-40 bg-cover bg-center grayscale mix-blend-multiply group-hover:grayscale-0 transition-all duration-700"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl shadow-black/10 flex items-center gap-3 border border-outline-variant/50">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-on-surface">KPM System - Trụ sở chính</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
