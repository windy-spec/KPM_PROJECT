import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Settings, AlertTriangle, FileText, CheckCircle2, PhoneCall } from 'lucide-react';

const WarrantyPolicy = () => {
    const navigate = useNavigate();

    // 1. Dữ liệu các gói bảo hành theo danh mục sản phẩm
    const warrantyCategories = [
        {
            title: "Chi tiết máy gia công chính xác CNC",
            duration: "12 Tháng",
            description: "Áp dụng cho các sản phẩm phay/tiện CNC, cụm chi tiết máy đồ gá (Jig), khuôn mẫu cao cấp.",
            items: [
                "Bảo hành độ ổn định kích thước trong điều kiện làm việc tiêu chuẩn.",
                "Hỗ trợ sửa lỗi bề mặt, ba-via nếu phát sinh do sai sót gia công.",
                "Cam kết độ đồng đều vật liệu theo chứng chỉ CO/CQ đi kèm."
            ],
            icon: Settings,
            color: "border-primary bg-primary/5 text-primary"
        },
        {
            title: "Sản phẩm Cắt kết cấu & Bản mã",
            duration: "06 Tháng",
            description: "Áp dụng cho thép tấm cắt Laser, Plasma, bản mã đục lỗ, chấn dập định hình số lượng lớn.",
            items: [
                "Bảo hành độ phẳng và dung sai biên dạng cắt theo đúng bản vẽ thỏa thuận.",
                "Bảo hành lớp mạ kẽm/sơn chống rỉ không bong tróc (đối với gói có xử lý bề mặt).",
                "Hỗ trợ vát mép, xử lý nhiệt luyện đạt chuẩn yêu cầu chịu lực."
            ],
            icon: ShieldCheck,
            color: "border-secondary bg-secondary/5 text-secondary"
        }
    ];

    // 2. Dữ liệu quy trình bảo hành các bước
    const steps = [
        { step: "01", title: "Tiếp nhận thông tin", desc: "Khách hàng gửi hình ảnh/video sản phẩm lỗi kèm mã đơn hàng qua Hotline hoặc Zalo kỹ thuật." },
        { step: "02", title: "Thẩm định kỹ thuật", desc: "Phòng QC bóc tách bản vẽ đối chiếu với sản phẩm thực tế để xác định nguyên nhân trong vòng 2 giờ." },
        { step: "03", title: "Phương án xử lý", desc: "KPM chủ động thu hồi hàng lỗi. Tiến hành sửa đổi hoặc gia công mới hoàn toàn miễn phí." },
        { step: "04", title: "Bàn giao lại", desc: "Sản phẩm sau bảo hành được đo kiểm CMM nghiêm ngặt và giao tận nơi cho quý khách." }
    ];

    return (
        <div className="min-h-screen bg-surface-container-lowest/30 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Tiêu đề chính */}
                <div className="text-center mb-16">
                    <span className="text-[11px] font-black uppercase text-primary tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                        Cam kết chất lượng
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-on-surface uppercase tracking-wide mt-4 mb-3">
                        Chính sách bảo hành & Đổi trả
                    </h1>
                    <p className="text-sm text-on-surface-variant/70 max-w-2xl mx-auto font-medium">
                        Tại KPM, chúng tôi đặt uy tín và độ chính xác kỹ thuật lên hàng đầu. Mọi sản phẩm xuất xưởng đều được bảo hộ bởi chính sách hậu mãi minh bạch, bảo vệ quyền lợi tuyệt đối cho doanh nghiệp.
                    </p>
                </div>

                {/* Khối 1: Thời hạn bảo hành chia theo danh mục */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {warrantyCategories.map((cat, idx) => (
                        <div key={idx} className={`border-2 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between ${cat.color.split(' ')[0]}`}>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${cat.color.split(' ')[1]} ${cat.color.split(' ')[2]}`}>
                                        <cat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider">
                                        <Clock className="w-3.5 h-3.5" />
                                        {cat.duration}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-on-surface uppercase tracking-wide mb-2">{cat.title}</h3>
                                <p className="text-xs text-on-surface-variant/80 font-medium mb-6 leading-relaxed">{cat.description}</p>

                                <ul className="space-y-3">
                                    {cat.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Khối 2: Điều khoản từ chối bảo hành */}
                <div className="bg-white border border-outline-variant/60 rounded-2xl p-6 sm:p-8 shadow-sm mb-16">
                    <div className="flex items-center gap-3 text-amber-600 mb-4">
                        <AlertTriangle className="w-6 h-6" />
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wide">Trường hợp không áp dụng bảo hành</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant/70 font-medium mb-6">
                        Chúng tôi rất tiếc phải từ chối nghĩa vụ bảo hành miễn phí trong các trường hợp tác động khách quan từ phía người sử dụng:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-container/30 border border-outline-variant/30 text-sm font-medium text-on-surface-variant">
                            ⚠️ Chi tiết gia công bị thay đổi kết cấu, mài dũa hoặc tự ý chỉnh sửa kích thước so với bản vẽ gốc sau khi nghiệm thu.
                        </div>
                        <div className="p-4 rounded-xl bg-surface-container/30 border border-outline-variant/30 text-sm font-medium text-on-surface-variant">
                            ⚠️ Sản phẩm bị móp méo, rỉ sét, biến dạng nặng do lỗi bảo quản sai quy cách hoặc vận hành quá tải công suất máy.
                        </div>
                    </div>
                </div>

                {/* Khối 3: Quy trình 4 bước xử lý sự cố */}
                <div className="mb-16">
                    <div className="text-center mb-10">
                        <div className="inline-flex p-2 rounded-xl bg-primary/5 text-primary mb-2">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-on-surface uppercase tracking-wide">Quy trình xử lý khiếu nại kĩ thuật</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {steps.map((item, index) => (
                            <div key={index} className="bg-white border border-outline-variant/50 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary transition-all">
                                <span className="absolute -right-2 -top-4 text-6xl font-black text-neutral-100 group-hover:text-primary/5 transition-colors select-none">
                                    {item.step}
                                </span>
                                <h4 className="text-sm font-black text-on-surface uppercase tracking-wide mb-2 mt-2 relative z-10">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-on-surface-variant/70 font-medium leading-relaxed relative z-10">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Khối 4: Liên hệ khẩn cấp */}
                <div className="bg-neutral-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-xl bg-white/10 text-primary flex-shrink-0 animate-pulse">
                            <PhoneCall className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-base sm:text-lg font-black uppercase tracking-wide">Đường dây nóng phản ánh chất lượng</h4>
                            <p className="text-xs text-white/60 font-medium mt-1">
                                Nếu phát hiện sai số kỹ thuật hàng loạt hoặc thái độ nghiệm thu không đạt chuẩn, vui lòng gọi ngay phòng giám đốc kỹ thuật.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <a
                            href="tel:0900000000"
                            className="px-5 py-3 bg-white text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-100 transition-all text-center"
                        >
                            Hotline: 090.XXX.XXXX
                        </a>
                        <button
                            type="button"
                            onClick={() => navigate('/contact')}
                            className="px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all text-center"
                        >
                            Gửi yêu cầu hỗ trợ
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WarrantyPolicy;