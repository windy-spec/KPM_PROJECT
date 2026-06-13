import React from 'react';
import { PlayCircle, ShieldCheck, Cpu, Award } from 'lucide-react';
import factoryVideo from '../../assets/video/factory.mp4'

const HomeAbout = () => {
    return (
        <section id="home-about" className="py-16 px-4 max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* BÊN TRÁI: KHUNG VIDEO MP4 TỰ PHÁT TRỰC TIẾP TẠI TRANG CHỦ */}
                <div className="lg:col-span-6">
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant shadow-lg bg-black">
                        <video
                            controls
                            className="w-full h-full object-cover"
                            poster="https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?q=80&w=800" // Ảnh hiển thị trước khi chạy video
                            src={factoryVideo}
                        >
                            Trình duyệt của bạn không hỗ trợ thẻ video.
                        </video>
                    </div>
                </div>

                {/* BÊN PHẢI: MÔ TẢ NĂNG LỰC HỆ THỐNG */}
                <div className="lg:col-span-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Về chúng tôi</span>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-on-surface">
                            Giải pháp cơ khí chế tạo <br />
                            <span className="text-primary">Tự động hóa & Minh bạch</span>
                        </h2>
                    </div>

                    <p className="text-sm text-on-surface-variant/90 leading-relaxed font-medium">
                        Hệ thống cơ khí <span className="text-primary">KPM System</span> được xây dựng nhằm tối ưu hóa quy trình bóc tách khối lượng và báo giá vật tư tự động cho khách hàng. Chúng tôi kết hợp giữa tay nghề cơ khí chính xác truyền thống và giải pháp công nghệ AI thông minh, mang lại báo giá chi tiết từng milimet bản mã trong vòng 3 giây.
                    </p>

                    {/* Các điểm nổi bật (Ưu điểm) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                        <div className="p-4 bg-surface-container/40 border border-outline-variant/60 rounded-xl flex flex-col gap-2">
                            <Cpu className="w-5 h-5 text-primary" />
                            <h4 className="text-xs font-black text-on-surface uppercase">Bóc tách AI</h4>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">Tự động hóa kích thước phôi vật liệu.</p>
                        </div>

                        <div className="p-4 bg-surface-container/40 border border-outline-variant/60 rounded-xl flex flex-col gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <h4 className="text-xs font-black text-on-surface uppercase">Chính xác 99%</h4>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">Giảm thiểu sai sót hao hụt vật tư tại xưởng.</p>
                        </div>

                        <div className="p-4 bg-surface-container/40 border border-outline-variant/60 rounded-xl flex flex-col gap-2">
                            <Award className="w-5 h-5 text-primary" />
                            <h4 className="text-xs font-black text-on-surface uppercase">Chuẩn SS400</h4>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">Cam kết phôi thép đạt tiêu chuẩn công nghiệp.</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HomeAbout;