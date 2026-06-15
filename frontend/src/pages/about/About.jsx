import React from "react";
import { Link } from "react-router-dom";
import {
    ShieldCheck,
    Cpu,
    Clock,
    Award,
    ChevronRight,
    Workflow,
    Sparkles
} from "lucide-react";

const About = () => {
    // Dữ liệu các con số ấn tượng
    const stats = [
        { value: "200+", label: "Năm kinh nghiệm" },
        { value: "500tr", label: "Dự án hoàn thành" },
        { value: "99%", label: "Khách hàng không hài lòng" },
        { value: "24/7", label: "Hỗ trợ kỹ thuật" },
    ];

    // Dữ liệu giá trị cốt lõi
    const coreValues = [
        {
            icon: ShieldCheck,
            title: "Chất lượng hàng đầu",
            description: "Mọi sản phẩm gia công cơ khí và vật tư đều trải qua quy trình kiểm duyệt chất lượng nghiêm ngặt trước khi xuất xưởng.",
        },
        {
            icon: Cpu,
            title: "Công nghệ tiên tiến",
            description: "Áp dụng hệ thống máy móc CNC, phần mềm tối ưu hóa hiện đại nhằm mang lại độ chính xác tuyệt đối trên từng milimet.",
        },
        {
            icon: Clock,
            title: "Tiến độ chuẩn xác",
            description: "Chúng tôi hiểu thời gian là vàng bạc. Cam kết bàn giao bản mã, sản phẩm cơ khí đúng thời hạn thỏa thuận.",
        },
        {
            icon: Award,
            title: "Giải pháp tối ưu",
            description: "Tư vấn kỹ thuật chuyên sâu, hỗ trợ bóc tách bản vẽ giúp doanh nghiệp tiết kiệm tối đa chi phí vật tư.",
        },
    ];

    return (
        <div className="min-h-screen bg-surface-container/10 text-on-surface">
            {/* 1. HERO SECTION */}
            <section className="relative overflow-hidden bg-white border-b border-outline-variant/60 py-20 px-5">
                <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                            <Sparkles className="w-3.5 h-3.5" /> Về chúng tôi
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-on-surface leading-tight">
                            Giải pháp gia công <br />
                            <span className="text-primary">Cơ khí chính xác</span>
                        </h1>
                        <p className="text-sm font-semibold text-on-surface-variant/80 leading-relaxed max-w-xl">
                            Được thành lập với sứ mệnh tiên phong trong lĩnh vực cơ khí chế tạo và cung ứng vật tư công nghiệp, chúng tôi tự hào là đối tác chiến lược tin cậy của hàng trăm doanh nghiệp lớn nhỏ trong và ngoài nước.
                        </p>
                        <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-xl">
                            Chúng tôi không chỉ cung cấp sản phẩm, chúng tôi mang đến những giải pháp công nghệ toàn diện giúp tối ưu hóa hiệu suất, nâng cao độ bền và giảm thiểu chi phí vận hành cho hệ thống sản xuất của bạn.
                        </p>
                    </div>

                    {/* Khối hình ảnh minh họa bên phải */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-600 rounded-3xl blur opacity-15"></div>
                        <div className="relative bg-surface-container/30 border border-outline-variant/60 rounded-3xl p-8 h-[350px] flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Workflow className="w-64 h-64 text-on-surface" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-black uppercase tracking-widest text-primary/70">Dịch vụ cốt lõi</span>
                                <h3 className="text-xl font-black uppercase tracking-wide">Gia công CNC & Bản mã</h3>
                                <p className="text-xs text-on-surface-variant/80 max-w-sm">Hệ thống máy cắt Laser fiber, CNC Plasma hiện đại đem lại mạch cắt sắc nét, không bavia.</p>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <span className="bg-white border border-outline-variant/60 px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant">#CơKhíChínhXác</span>
                                <span className="bg-white border border-outline-variant/60 px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant">#BảnMãCNC</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. STATS SECTION */}
            <section className="bg-white border-b border-outline-variant/40 py-12 px-5">
                <div className="max-w-[1280px] mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="text-3xl lg:text-4xl font-black text-primary tracking-tight">
                                    {stat.value}
                                </div>
                                <div className="text-xs font-bold uppercase tracking-wide text-on-surface-variant/70">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. CORE VALUES */}
            <section className="max-w-[1280px] mx-auto py-20 px-5">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                    <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider text-on-surface">
                        Giá trị cốt lõi
                    </h2>
                    <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
                        Những nguyên tắc định hình nên uy tín thương hiệu của chúng tôi
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {coreValues.map((value, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1 duration-200"
                        >
                            <div className="w-12 h-12 rounded-xl bg-surface-container/50 border border-outline-variant/40 flex items-center justify-center mb-5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
                                <value.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-wide text-on-surface mb-2">
                                {value.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant/75 leading-relaxed">
                                {value.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. CALL TO ACTION (CTA) */}
            <section className="bg-white border-t border-outline-variant/60 py-16 px-5">
                <div className="max-w-[800px] mx-auto text-center space-y-6">
                    <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider text-on-surface">
                        Bạn đang có dự án cần triển khai?
                    </h2>
                    <p className="text-sm font-semibold text-on-surface-variant/80 leading-relaxed">
                        Gửi ngay bản vẽ kỹ thuật hoặc yêu cầu khối lượng vật tư cho chúng tôi. Đội ngũ kỹ sư chuyên môn cao sẽ bóc tách và phản hồi báo giá tối ưu nhất trong vòng 2 giờ làm việc.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/products"
                            className="w-full sm:w-auto bg-primary text-white py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            Xem sản phẩm mẫu <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={() => alert("Chức năng gửi yêu cầu báo giá đang được tích hợp!")}
                            className="w-full sm:w-auto border border-outline-variant/80 hover:bg-surface-container text-on-surface py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Yêu cầu báo giá ngay
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;