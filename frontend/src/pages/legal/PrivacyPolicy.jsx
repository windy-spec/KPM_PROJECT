import React, { useEffect } from 'react';
import { ShieldCheck, UserCheck, Eye, Database, Lock, MessageSquare } from 'lucide-react';

const PrivacyPolicy = () => {
    // Tự động cuộn lên đầu trang khi người dùng truy cập
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const policies = [
        {
            icon: UserCheck,
            title: '1. Dữ liệu chúng tôi thu thập',
            content: 'Để phục vụ việc xuất bảng bóc tách vật tư tự động chính xác, hệ thống sẽ lưu trữ: Thông số kích thước cấu kiện yêu cầu, thông tin loại thép, màu sơn tuyển chọn, địa chỉ email và số điện thoại nhận file báo giá PDF định kỳ của quý khách.'
        },
        {
            icon: Eye,
            title: '2. Mục đích xử lý thông tin kỹ thuật',
            content: 'Thông tin của bạn được sử dụng vào mục đích: Tính toán phôi vật liệu tối ưu tại xưởng, gửi bảng dự toán chi tiết, cập nhật tiến độ gia công CNC, liên hệ tư vấn chuyên sâu từ kỹ sư thiết kế kết cấu và ngăn chặn các hành vi spam hệ thống.'
        },
        {
            icon: Lock,
            title: '3. Bảo mật dữ liệu bản vẽ công trình',
            content: 'Mọi thông số kích thước, cấu hình thiết kế cổng cửa hay lan can thuộc về ngôi nhà của bạn đều được mã hóa bằng tiêu chuẩn SSL cao cấp. KPM Mechanical cam kết bảo mật tuyệt đối, không chia sẻ bản vẽ bóc tách hay thông tin liên hệ của bạn cho bất kỳ bên thứ ba nào.'
        },
        {
            icon: Database,
            title: '4. Hệ thống lưu trữ dữ liệu phôi',
            content: 'Dữ liệu tính toán cơ khí được lưu trữ an toàn trên hệ thống máy chủ cơ sở dữ liệu của KPM. Bạn hoàn toàn có quyền đăng nhập tài khoản để tra cứu lại lịch sử báo giá, chỉnh sửa cấu hình cũ hoặc yêu cầu hệ thống xóa vĩnh viễn dữ liệu thiết kế của bạn.'
        },
        {
            icon: MessageSquare,
            title: '5. Sử dụng Cookie phân tích trải nghiệm',
            content: 'Website sử dụng cookie kỹ thuật nhỏ để ghi nhớ các thông số may đo bạn đang nhập dở dang trên trình duyệt, giúp bạn không phải nhập lại từ đầu nếu vô tình tải lại trang trong quá trình thiết lập cấu kiện.'
        }
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/20 pb-20 pt-10">
            <div className="max-w-[1000px] mx-auto px-5">

                {/* ĐẦU TRANG - TIÊU ĐỀ CHÍNH */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-[10px] bg-primary/10 text-primary font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5 w-fit mx-auto">
                        <ShieldCheck className="w-3.5 h-3.5" /> Cam kết an toàn thông tin
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-on-surface uppercase tracking-tight mb-4 mt-3 leading-tight">
                        Chính sách bảo mật
                    </h1>
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                        Cập nhật lần cuối: Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                </div>

                {/* NỘI DUNG CHI TIẾT CÁC ĐIỀU KHOẢN BẢO MẬT */}
                <div className="space-y-8">
                    {policies.map((pol, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-outline-variant/60 rounded-2xl p-6 md:p-8 shadow-sm hover:border-primary/30 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 mb-4 border-b border-outline-variant/30 pb-3">
                                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                    <pol.icon className="w-5 h-5" />
                                </div>
                                <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-on-surface">
                                    {pol.title}
                                </h2>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                                {pol.content}
                            </p>
                        </div>
                    ))}
                </div>

                {/* THÔNG TIN TRỢ GIÚP DƯỚI CÙNG */}
                <div className="mt-12 p-6 bg-surface-container/50 border border-outline-variant rounded-2xl text-center max-w-xl mx-auto">
                    <p className="text-xs text-on-surface-variant font-bold">
                        An toàn thông tin của bạn là ưu tiên hàng đầu của chúng tôi. Mọi khiếu nại hoặc yêu cầu gỡ bỏ dữ liệu cá nhân, xin gửi trực tiếp về bộ phận Data Privacy qua Email:{' '}
                        <a href="mailto:privacy@kpm.vn" className="text-primary hover:underline">privacy@kpm.vn</a>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default PrivacyPolicy;