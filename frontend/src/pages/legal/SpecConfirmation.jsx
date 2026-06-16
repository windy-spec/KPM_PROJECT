import React from 'react';
import { Link } from 'react-router-dom';
import { Hammer, ShieldAlert, ArrowLeft, ShieldCheck } from 'lucide-react';

const SpecConfirmation = () => {
    return (
        <div className="min-h-screen bg-surface selection:bg-primary/20 py-12 md:py-20 text-on-surface">
            <div className="max-w-[1140px] mx-auto px-6 md:px-12">
                {/* Tiêu đề chính */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10 border-b border-outline-variant/30 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Hammer className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-on-surface">
                            Thỏa thuận Tiêu chuẩn Vật tư & Linh kiện Gia công
                        </h1>
                        <p className="text-sm font-bold text-primary uppercase tracking-widest mt-1">
                            Chính sách cam kết chất lượng phôi KPM
                        </p>
                    </div>
                </div>

                {/* Khối mô tả chung */}
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-4 mb-10">
                    <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                        Để bảo vệ quyền lợi tối đa cho khách hàng và duy trì tính minh bạch tuyệt đối khi bóc tách vật tư tự động từ hệ thống AI, KPM quy định rõ ràng các điều khoản ràng buộc về mặt cấu trúc phôi vật liệu và linh kiện cấu thành như sau:
                    </p>
                </div>

                {/* Nội dung các điều khoản */}
                <div className="grid grid-cols-1 gap-6">

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            1. Chủng loại Vật liệu & Mác thép tiêu chuẩn
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
                            <li>
                                <strong className="text-on-surface">Vật liệu lõi:</strong> Quý khách đồng ý với chủng loại vật liệu sắt thép đã chủ động lựa chọn (Thép hộp mạ kẽm, Thép đen, Inox 304, Thép tấm SS400,...). KPM cam kết sử dụng phôi chính hãng 100% có đầy đủ chứng chỉ CO/CQ xuất xưởng từ các thương hiệu lớn như Hòa Phát, Hoa Sen, Posco.
                            </li>
                            <li>
                                <strong className="text-on-surface">Độ dày phôi (Thickness):</strong> Độ dày quý khách cấu hình là độ dày danh nghĩa ban đầu của nhà sản xuất thép. Dung sai phôi thô đầu vào sẽ dao động tuân theo tiêu chuẩn kỹ thuật cho phép của nhà máy phôi thép (thường từ <span className="text-on-surface font-bold">±3% đến ±5%</span>).
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            2. Tiêu chuẩn Bề mặt phủ & Hệ màu sắc bảo vệ
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
                            <li>
                                Khi lựa chọn công nghệ phủ chống gỉ (Sơn tĩnh điện cao cấp hoặc Sơn công nghiệp Epoxy), quý khách chấp thuận rằng hệ màu hiển thị trên các thiết bị điện tử kỹ thuật số (hệ màu màn hình RGB) sẽ có độ lệch sắc độ thực tế từ <span className="text-on-surface font-bold">2% - 5%</span> so với thanh thép thực tế sau khi sấy nhiệt tại xưởng do góc độ ánh sáng môi trường.
                            </li>
                            <li>
                                KPM cam kết phun phủ đủ số lớp lót, lớp nền bảo vệ tiêu chuẩn để cấu kiện đạt hiệu năng chống chịu oxy hóa tốt nhất trước điều kiện thời tiết ngoài trời.
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white border border-outline-variant p-6 md:p-8 rounded-2xl shadow-sm">
                        <h2 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            3. Quy chuẩn Linh kiện phụ trợ & Chất lượng mối liên kết hàn
                        </h2>
                        <ul className="list-disc pl-5 space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
                            <li>
                                Các chi tiết liên kết đi kèm như bulông chịu lực, đai ốc, long đền hoặc các bản mã đục lỗ phụ trợ phụ (được thuật toán AI tính toán đồng bộ) sẽ tự động sử dụng loại có cấp bền tương thích cao nhất với cấu kiện chính.
                            </li>
                            <li>
                                Mối hàn cơ khí (liên kết ghép nối khung hộp) được gia công hoàn thiện bởi thợ hàn lành nghề hoặc robot hàn xung tự động, đảm bảo độ sâu ngấu cốt thép, không rỗ khí xỉ mặt hàn, đáp ứng hoàn hảo bài toán chịu tải trọng thực tế của công trình.
                            </li>
                        </ul>
                    </section>

                </div>

            </div>
        </div>
    );
};

export default SpecConfirmation;