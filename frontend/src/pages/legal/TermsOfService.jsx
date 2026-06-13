import React, { useEffect } from 'react';
import { ShieldAlert, Scale, Calculator, FileText, ClipboardCheck, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
    // Tự động cuộn lên đầu trang khi người dùng truy cập
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            icon: Scale,
            title: '1. Quy định chung',
            content: 'Bằng việc truy cập và sử dụng hệ thống may đo cơ khí KPM Mechanical, quý khách hàng mặc nhiên đồng ý với các điều khoản, điều kiện và lưu ý pháp lý được quy định tại đây. Chúng tôi có quyền cập nhật, chỉnh sửa nội dung điều khoản bất kỳ lúc nào để phù hợp với tiêu chuẩn kỹ thuật vận hành mà không cần báo trước.'
        },
        {
            icon: Calculator,
            title: '2. Sử dụng hệ thống bóc tách vật tư AI',
            content: 'Hệ thống AI của KPM hỗ trợ tính toán khối lượng, chiều dài phôi và độ dày dựa trên thông số (Dài x Rộng x Cao) do người dùng tự nhập. Người dùng có trách nhiệm đảm bảo tính chính xác của số liệu thực tế tại công trình. KPM cung cấp công cụ May đo để tham khảo khối lượng sơ bộ trước khi cán bộ kỹ thuật đến đo đạc thực tế.'
        },
        {
            icon: FileText,
            title: '3. Giá trị pháp lý của Báo giá tự động',
            content: 'Các bảng báo giá xuất ra từ website có giá trị ước tính chi phí vật tư dự kiến dựa trên đơn giá thép (SS400/A36) và giá nhân công tại thời điểm hiện tại. Báo giá này sẽ chính thức có hiệu lực pháp lý sau khi có sự xác nhận biên bản khảo sát hiện trạng và ký kết hợp đồng kinh tế giữa hai bên.'
        },
        {
            icon: ClipboardCheck,
            title: '4. Bản quyền thiết kế & Cấu kiện',
            content: 'Toàn bộ giao diện hệ thống, giải thuật tính toán phôi bản mã, hình ảnh mẫu cửa sắt mỹ thuật, lan can CNC hiển thị trên website thuộc sở hữu trí tuệ độc quyền của KPM Mechanical. Mọi hành vi sao chép cấu trúc dữ liệu hoặc mã nguồn bất hợp pháp đều vi phạm pháp luật.'
        },
        {
            icon: AlertTriangle,
            title: '5. Giới hạn trách nhiệm hình học',
            content: 'KPM miễn trừ trách nhiệm đối với các trường hợp hệ thống tính toán sai lệch do người dùng cố tình nhập các thông số vật lý vượt quá giới hạn chịu lực an toàn của cấu kiện (sai lệch kích thước hình học chuẩn). Chúng tôi luôn có cảnh báo kỹ thuật đối với các thông số bất thường.'
        }
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/20 pb-20 pt-10">
            <div className="max-w-[1000px] mx-auto px-5">

                {/* ĐẦU TRANG - TIÊU ĐỀ CHÍNH */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-[10px] bg-primary/10 text-primary font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5 w-fit mx-auto">
                        <ShieldAlert className="w-3.5 h-3.5" /> Văn bản pháp lý KPM
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight mb-4 mt-3 leading-tight">
                        Điều khoản dịch vụ
                    </h1>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                        Cập nhật lần cuối: Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                </div>

                {/* NỘI DUNG CHI TIẾT CÁC ĐIỀU KHOẢN */}
                <div className="space-y-8">
                    {sections.map((sec, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-outline-variant/60 rounded-2xl p-6 md:p-8 shadow-sm hover:border-primary/30 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 mb-4 border-b border-outline-variant/30 pb-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                    <sec.icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-on-surface">
                                    {sec.title}
                                </h2>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                                {sec.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* THÔNG TIN TRỢ GIÚP DƯỚI CÙNG */}
                <div className="mt-12 p-6 bg-surface-container/50 border border-outline-variant rounded-2xl text-center max-w-xl mx-auto">
                    <p className="text-xs text-on-surface-variant font-bold">
                        Nếu có bất kỳ thắc mắc nào liên quan đến điều khoản kỹ thuật hoặc pháp lý quy trình vận hành, vui lòng liên hệ Hội đồng kỹ thuật KPM qua Email:{' '}
                        <a href="mailto:legal@kpm.vn" className="text-primary hover:underline">legal@kpm.vn</a>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default TermsOfService;