import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, MessageSquare, ShieldCheck, Truck, DollarSign } from 'lucide-react';

const FAQ = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeId, setActiveId] = useState(null);

    // Bộ dữ liệu các câu hỏi thường gặp (được biên soạn theo ngành cơ khí / gia công)
    const faqData = [
        {
            id: 1,
            category: 'Gia công & Kỹ thuật',
            icon: HelpCircle,
            question: 'Bên mình nhận gia công những phương pháp CNC nào và độ chính xác ra sao?',
            answer: 'Chúng tôi sở hữu hệ thống máy móc hiện đại, đáp ứng đầy đủ các dịch vụ bao gồm: Phay CNC (3-axis, 4-axis), Tiện CNC, Cắt dây EDM, Cắt Laser béc phun cao áp. Độ chính xác gia công cơ khí chính xác đạt từ ±0.005mm đến ±0.01mm tùy thuộc vào yêu cầu vật liệu và biên dạng chi tiết của quý khách.'
        },
        {
            id: 2,
            category: 'Gia công & Kỹ thuật',
            icon: HelpCircle,
            question: 'Công ty có nhận gia công các đơn hàng số lượng ít hoặc làm mẫu (Prototype) không?',
            answer: 'Có, chúng tôi hỗ trợ tối đa cho doanh nghiệp và kỹ sư nghiên cứu. KPM nhận gia công từ đơn hàng 1 sản phẩm mẫu để test layout/thiết kế, cho đến các đơn hàng sản xuất hàng loạt (Mass Production) số lượng hàng nghìn chi tiết với chính sách giá ưu đãi tăng dần theo số lượng.'
        },
        {
            id: 3,
            category: 'Gia công & Kỹ thuật',
            icon: HelpCircle,
            question: 'Nhà xưởng có thể gia công những loại vật liệu cứng nào?',
            answer: 'Chúng tôi gia công đa dạng vật liệu bao gồm: Kim loại (Thép hợp kim S45C, SKD11, SKD61, Inox 304, Inox 316, Nhôm A6061, A7075, Đồng đỏ, Đồng thau) và các loại nhựa kỹ thuật cao cấp (POM, Teflon/PTFE, Bakelite, MC Nylon).'
        },
        {
            id: 4,
            category: 'Báo giá & Thanh toán',
            icon: DollarSign,
            question: 'Để nhận báo giá gia công nhanh nhất, tôi cần cung cấp những thông tin gì?',
            answer: 'Quý khách vui lòng gửi file thiết kế định dạng 3D (STEP, STP, IGS) để tính toán phôi chính xác nhất, kèm theo bản vẽ 2D (PDF, DWG, DXF) có chỉ định rõ ràng về dung sai kỹ thuật, độ nhám bề mặt và yêu cầu xử lý nhiệt luyện/xi mạ (nếu có).'
        },
        {
            id: 5,
            category: 'Báo giá & Thanh toán',
            icon: DollarSign,
            question: 'Thời gian phản hồi báo giá thường mất bao lâu?',
            answer: 'Đối với các chi tiết đơn lẻ hoặc cắt bản mã thông thường, chúng tôi sẽ phản hồi báo giá trong vòng 2 - 4 giờ làm việc. Đối với các cụm chi tiết máy phức tạp hoặc dự án lắp ráp lớn, phòng kỹ thuật sẽ bóc tách khối lượng và gửi bảng báo giá chi tiết trong vòng 24 giờ.'
        },
        {
            id: 6,
            category: 'Vận chuyển & Giao hàng',
            icon: Truck,
            question: 'Công ty có hỗ trợ giao hàng tận nơi không? Chi phí tính thế nào?',
            answer: 'Chúng tôi hỗ trợ giao hàng miễn phí nội thành cho các đơn hàng đạt giá trị tối thiểu theo chính sách hiện hành. Đối với các tỉnh thành khác hoặc hàng cồng kềnh/nặng (như thép tấm bản mã mạ kẽm lớn), chúng tôi sẽ liên kết với các đơn vị vận tải chuyên dụng để đảm bảo chi phí tối ưu nhất cho quý khách.'
        },
        {
            id: 7,
            category: 'Chính sách bảo hành & Đổi trả',
            icon: ShieldCheck,
            question: 'Quy trình xử lý như thế nào nếu sản phẩm bàn giao bị sai dung sai hoặc lỗi kỹ thuật?',
            answer: 'Tất cả sản phẩm trước khi xuất xưởng đều đi qua phòng QC đo kiểm bằng thước điện tử, máy đo CMM. Trong trường hợp hiếm hoi sản phẩm lỗi do phía nhà sản xuất (sai kích thước bản vẽ, lộn vật liệu), KPM cam kết thu hồi sản phẩm lỗi và tiến hành gia công lại hoàn toàn MIỄN PHÍ hoặc hoàn tiền trong vòng 3 - 5 ngày làm việc.'
        },
        {
            id: 8,
            category: 'Báo giá & Thanh toán',
            icon: DollarSign,
            question: 'Phương thức thanh toán và công nợ áp dụng cho khách hàng doanh nghiệp ra sao?',
            answer: 'Thông thường đơn hàng sẽ chia làm 2 đợt: Tạm ứng trước 30% - 50% sau khi chốt bản vẽ vẽ ký hợp đồng, thanh toán phần còn lại sau khi nghiệm thu nhận hàng đầy đủ giấy tờ (Hóa đơn VAT, Phiếu xuất kho, Biên bản đo kiểm QC). Với đối tác chiến lược hoặc đơn hàng định kỳ, chúng tôi có chính sách xét duyệt hạn mức công nợ từ 15 đến 30 ngày.'
        }
    ];

    // Lọc câu hỏi theo từ khóa nhập vào thanh tìm kiếm
    const filteredFaqs = faqData.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAccordion = (id) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-surface-container-lowest/30 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Tiêu đề trang */}
                <div className="text-center mb-12">
                    <span className="text-[11px] font-black uppercase text-primary tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                        Trung tâm hỗ trợ
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-on-surface uppercase tracking-wide mt-4 mb-3">
                        Các câu hỏi thường gặp
                    </h1>
                    <p className="text-sm text-on-surface-variant/70 max-w-xl mx-auto font-medium">
                        Tìm kiếm nhanh câu trả lời cho các thắc mắc của bạn về dịch vụ gia công cơ khí chính xác, tiến độ giao hàng và chính sách nghiệm thu vật liệu.
                    </p>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="relative max-w-xl mx-auto mb-16 shadow-sm rounded-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-on-surface-variant/40" />
                    </div>
                    <input
                        type="text"
                        placeholder="Nhập từ khóa tìm kiếm (Ví dụ: CNC, Báo giá, Inox, Dung sai...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-2xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-on-surface placeholder:text-on-surface-variant/40"
                    />
                </div>

                {/* Danh sách câu hỏi */}
                <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq) => {
                            const isOpen = activeId === faq.id;

                            return (
                                <div
                                    key={faq.id}
                                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen
                                        ? 'border-primary shadow-md shadow-primary/5'
                                        : 'border-outline-variant/60 hover:border-outline-variant shadow-sm'
                                        }`}
                                >
                                    {/* Thanh nút bấm câu hỏi */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(faq.id)}
                                        className="w-full flex items-start justify-between p-5 text-left gap-4"
                                    >
                                        <div className="flex gap-4">
                                            <div className={`p-2 rounded-xl mt-0.5 transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant/70'}`}>
                                                <faq.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-primary tracking-wider block mb-1">
                                                    {faq.category}
                                                </span>
                                                <h3 className="text-sm sm:text-base font-black text-on-surface tracking-wide">
                                                    {faq.question}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className={`p-1 rounded-full bg-surface-container/60 mt-1 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    {/* Phần câu trả lời bung ra */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] border-t border-outline-variant/30 bg-surface-container/5 p-5' : 'max-h-0'
                                            }`}
                                    >
                                        <p className="text-sm text-on-surface-variant/90 leading-relaxed font-medium pl-12">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-outline-variant/60 rounded-3xl bg-surface-container/10">
                            <MessageSquare className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                            <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-wide">
                                Không tìm thấy câu hỏi nào khớp với từ khóa của bạn
                            </p>
                        </div>
                    )}
                </div>

                {/* Chân trang tư vấn thêm */}
                <div className="mt-16 text-center border border-outline-variant/40 rounded-2xl p-6 bg-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                        <h4 className="text-sm font-black text-on-surface uppercase tracking-wide">Vẫn còn thắc mắc kỹ thuật khác?</h4>
                        <p className="text-xs text-on-surface-variant/70 font-medium mt-1">Đội ngũ kỹ sư cơ khí của chúng tôi sẵn sàng giải đáp và hỗ trợ bóc tách bản vẽ thiết kế 24/7.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/contact')}
                        className="px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/10 whitespace-nowrap active:scale-[0.98]"
                    >
                        Liên hệ kỹ thuật viên
                    </button>
                </div>

            </div>
        </div>
    );
};

export default FAQ;