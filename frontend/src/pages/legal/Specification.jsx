import React from 'react';
import { Link } from 'react-router-dom';
import { Ruler, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

const Specification = () => {
    return (
        <div className="min-h-screen bg-surface selection:bg-primary/20 py-12 md:py-20 text-on-surface">
            <div className="max-w-[1140px] mx-auto px-6 md:px-12">
                {/* Tiêu đề chính */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10 border-b border-outline-variant/30 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Ruler className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-on-surface">
                            Quy chuẩn Xác nhận Thông số Kỹ thuật Động
                        </h1>
                        <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">
                            Hệ thống May đo Cơ khí Tự động KPM
                        </p>
                    </div>
                </div>

                {/* Khối mô tả chung */}
                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4 mb-10">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                        Hệ thống KPM vận hành trên nền tảng bóc tách khối lượng và tính toán phôi tự động theo thời gian thực (Real-time AI Blueprint). Khi quý khách tích chọn <span className="font-bold text-on-surface">"Tôi đã kiểm tra đủ các thông số"</span>, điều này cấu thành một cam kết kỹ thuật có hiệu lực ràng buộc đối với tiến trình gia công.
                    </p>
                </div>

                {/* Nội dung các điều khoản */}
                <div className="grid grid-cols-1 gap-6">

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            1. Độ chính xác của kích thước hình học hình khối
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
                            <li>
                                Quý khách hoàn toàn chịu trách nhiệm về các thông số biến thiên như: <strong className="text-on-surface">Chiều dài, Chiều rộng, Chiều cao, Độ bo góc (Radius), hoặc Bán kính lỗ khoét</strong> đã nhập trực tiếp trên thanh kéo/ô nhập liệu của trang chi tiết sản phẩm.
                            </li>
                            <li>
                                Sai số gia công thực tế tại xưởng cơ khí KPM luôn tuân thủ nghiêm ngặt tiêu chuẩn chế tạo cơ khí kỹ thuật dân dụng và công nghiệp (dao động trong khoảng <span className="text-on-surface font-bold">±0.5mm đến ±1.5mm</span> tùy thuộc vào từng loại cấu kiện). Hệ thống máy CNC sẽ tự động cắt phôi dựa chính xác trên con số quý khách đã gửi đi.
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            2. Trách nhiệm đối với việc nhập sai kích thước
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
                            <li>
                                Nếu cấu kiện sau khi xưởng hoàn thiện gia công nhưng không thể lắp đặt vừa vặn do lỗi nhập liệu từ phía quý khách (ví dụ: <strong className="text-on-surface">nhầm lẫn đơn vị giữa Milimét và Centimét</strong>), KPM rất tiếc sẽ không thể hỗ trợ thu hồi hoặc hoàn trả chi phí phôi thép thô đã phá dỡ cấu trúc cắt.
                            </li>
                            <li>
                                Hệ thống chỉ chấp nhận lệnh hủy đơn hoặc sửa đổi cấu hình thủ công <strong>trước khi</strong> tiến trình đơn hàng của quý khách chuyển sang trạng thái <strong className="text-on-surface">"Đang cắt phôi / Lên dây chuyền gia công"</strong> trên hệ thống quản lý đơn.
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            3. Đo đạc và Khảo sát không gian thực tế
                        </h2>
                        <p className="text-sm text-on-surface-variant font-medium leading-relaxed pl-7">
                            Việc bấm xác nhận đồng nghĩa với tuyên bố quý khách hoặc đơn vị thầu thi công đã tiến hành đo đạc thực địa tại công trình, đảm bảo sản phẩm cơ khí sau khi xuất xưởng theo đúng bản vẽ phác thảo mô phỏng trong trang <span className="font-bold text-on-surface">Product Detail</span> sẽ đáp ứng hoàn hảo tính chịu lực và tính thẩm mỹ tại vị trí lắp đặt.
                        </p>
                    </section>

                </div>

            </div>
        </div>
    );
};

export default Specification;