import React, { useState, useMemo, useEffect } from "react";
import { BookOpen, Search, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

const TechnicalTerms = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLetter, setSelectedLetter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // DỮ LIỆU THUẬT NGỮ CƠ KHÍ & VẬT TƯ CÔNG NGHIỆP (ĐÃ ĐƯỢC LÀM GIÀU)
    const termsData = [
        {
            term: "Bản mã (Gusset Plate)",
            definition: "Tấm thép dày được cắt theo các hình dáng định hình (chữ nhật, hình thang, hình tròn...) dùng để liên kết các cấu kiện cố định hoặc định vị các thanh liên kết của hệ thống giàn khối, dầm cột.",
            category: "Gia công bản mã"
        },
        {
            term: "Bavia (Burr)",
            definition: "Phần kim loại thừa, cạnh sắc hoặc các gờ nhấp nhô còn sót lại trên cạnh của phôi sau khi thực hiện các quá trình cắt gọt, đột dập hoặc gia công cơ khí.",
            category: "Thuật ngữ gia công"
        },
        {
            term: "Chấn gấp CNC (CNC Bending)",
            definition: "Quá trình sử dụng máy chấn thủy lực hoặc CNC để uốn, gấp các tấm kim loại (thép tấm, inox) thành các biên dạng hình học mong muốn (chữ U, V, Z...) với độ chính xác cao.",
            category: "Gia công kim loại tấm"
        },
        {
            term: "Hàn TIG/MIG (TIG/MIG Welding)",
            definition: "Các phương pháp hàn hồ quang có khí bảo vệ. TIG thường dùng cho chi tiết yêu cầu thẩm mỹ cao, thành mỏng (inox). MIG cho tốc độ hàn nhanh, phù hợp cho thép kết cấu.",
            category: "Công nghệ hàn"
        },
        {
            term: "Biên dạng cắt (Cutting Profile)",
            definition: "Đường vạch bề mặt hoặc hình dáng hình học mà mỏ cắt (Laser, Plasma) hoặc dao cắt sẽ đi qua để tạo hình cho chi tiết sản phẩm trên tấm phôi.",
            category: "Kỹ thuật sản xuất"
        },
        {
            term: "Cắt Laser Fiber",
            definition: "Công nghệ cắt kim loại bằng tia laser nguồn sợi quang, đem lại tốc độ cắt cực nhanh, mạch cắt siêu nhỏ và bề mặt cắt nhẵn mịn, không bị biến dạng nhiệt.",
            category: "Công nghệ CNC"
        },
        {
            term: "Cắt Plasma CNC",
            definition: "Phương pháp sử dụng dòng khí ion hóa ở nhiệt độ cực cao để cắt các tấm kim loại dẫn điện (thép, inox, đồng, nhôm). Thích hợp cho các tấm thép có độ dày lớn.",
            category: "Công nghệ CNC"
        },
        {
            term: "Chấn dập (Press Braking)",
            definition: "Quá trình uốn cong hoặc làm biến dạng tấm kim loại theo các góc độ yêu cầu dựa trên lực ép của hệ thống chày dập và cối dập.",
            category: "Thuật ngữ gia công"
        },
        {
            term: "Dung sai (Tolerance)",
            definition: "Phạm vi sai lệch cho phép của kích thước, hình dạng hoặc vị trí của chi tiết máy so với kích thước thiết kế tiêu chuẩn lý thuyết.",
            category: "Kỹ thuật sản xuất"
        },
        {
            term: "Đột dập (Punching)",
            definition: "Phương pháp sử dụng lực cơ học lớn từ máy dập chuyên dụng phối hợp chày và cối để tạo lỗ, khe hoặc các rãnh định hình trên bề mặt tấm kim loại.",
            category: "Thuật ngữ gia công"
        },
        {
            term: "Độ nhám bề mặt (Surface Roughness)",
            definition: "Tập hợp những mấp mô hình học có độ bước tương đối nhỏ trên bề mặt chi tiết sau gia công, ảnh hưởng trực tiếp đến tính thẩm mỹ và độ khít khi lắp ráp.",
            category: "Kỹ thuật sản xuất"
        },
        {
            term: "Gia công CNC",
            definition: "Phương pháp gia công cơ khí sử dụng các máy móc công nghiệp được điều khiển tự động bằng hệ thống máy tính (Computer Numerical Control) nhằm đạt độ chính xác tối đa.",
            category: "Công nghệ CNC"
        },
        {
            term: "Mạch cắt (Kerf)",
            definition: "Độ rộng của phần vật liệu bị tiêu hao hoặc mất đi trong quá trình cắt (do độ dày của tia laser, tia plasma hoặc lưỡi cắt tạo ra).",
            category: "Kỹ thuật sản xuất"
        },
        {
            term: "Mạ kẽm nhúng nóng (Hot-dip Galvanizing)",
            definition: "Công nghệ phủ một lớp kẽm lên bề mặt chi tiết sắt thép bằng cách nhúng chúng vào bể kẽm nóng chảy ở nhiệt độ cao, giúp chống ăn mòn và chống rỉ sét tối đa.",
            category: "Xử lý bề mặt"
        },
        {
            term: "Phôi gia công (Blank/Workpiece)",
            definition: "Đoạn nguyên vật liệu thô (thép tấm, cây tròn, ống...) được cắt định hình sơ bộ trước khi đưa vào các công đoạn gia công tinh chi tiết.",
            category: "Kỹ thuật sản xuất"
        },
        {
            term: "Sơn tĩnh điện (Powder Coating)",
            definition: "Phương pháp phủ dung dịch chất dẻo dạng bột lên bề mặt chi tiết cơ khí bằng súng phun tĩnh điện, sau đó đem hấp nhiệt để tạo ra lớp bảo vệ cứng, bền màu.",
            category: "Xử lý bề mặt"
        },
        {
            term: "Thép cán nóng (Hot Rolled Steel)",
            definition: "Loại thép được cán mỏng ở nhiệt độ cao (trên 900°C), thường có bề mặt màu xanh đen xù xì, thích hợp làm phôi cho cấu kiện bản mã cỡ lớn hoặc kết cấu chịu lực.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Thép cán nguội (Cold Rolled Steel)",
            definition: "Thép được gia công cán ở nhiệt độ phòng từ phôi thép cán nóng. Có bề mặt mịn, láng bóng, độ dày chuẩn xác và cơ tính tốt hơn thép cán nóng.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Vát cạnh (Chamfering)",
            definition: "Công nghệ mài hoặc cắt bỏ cạnh sắc vuông góc của chi tiết phôi để tạo thành một bề mặt nghiêng (thường là góc 45 độ), đảm bảo an toàn và dễ lắp ráp.",
            category: "Thuật ngữ gia công"
        },
        // MỚI THÊM TỪ AI KNOWLEDGE
        {
            term: "Inox 304 / Inox 201",
            definition: "Các mác thép không gỉ phổ biến. Inox 304 chứa nhiều niken hơn, chống ăn mòn cực tốt ngoài trời. Inox 201 rẻ hơn nhưng dễ rỉ sét nếu tiếp xúc ẩm ướt kéo dài.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Thép SS400 / A36",
            definition: "Các mác thép kết cấu cacbon thông dụng. SS400 (tiêu chuẩn Nhật) và A36 (tiêu chuẩn Mỹ) có độ bền kéo cao, lý tưởng cho khung nhà tiền chế, dầm, cột chịu lực.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Sơn Epoxy 2 thành phần",
            definition: "Hệ sơn công nghiệp cao cấp gồm phần sơn và phần đóng rắn. Khi pha trộn tạo màng sơn cực cứng, bám dính siêu việt, chống hóa chất, dùng cho kết cấu thép chịu mài mòn cao.",
            category: "Xử lý bề mặt"
        },
        {
            term: "Kính dán an toàn (Laminated Glass)",
            definition: "Kính ghép từ 2 hay nhiều lớp kính phẳng, ở giữa là lớp phim PVB. Khi vỡ, các mảnh kính dính lại trên lớp phim, không văng ra ngoài gây sát thương.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Tôn PU cách nhiệt",
            definition: "Tôn lợp mái có lớp Polyurethane (PU) ở giữa giúp cách nhiệt, cách âm cực hiệu quả, làm mát công trình, thường dùng cho nhà xưởng hoặc nhà ở cao cấp.",
            category: "Vật liệu vật tư"
        },
        {
            term: "Bản lề cối tiện",
            definition: "Loại bản lề được tiện nguyên khối từ sắt hoặc Inox dày, xoay bằng bi, chịu được tải trọng rất lớn, chống xệ cửa, chuyên dùng cho cổng sắt nặng nguyên khối.",
            category: "Phụ kiện cơ khí"
        },
        {
            term: "Gỗ nhựa Composite (WPC)",
            definition: "Vật liệu tổng hợp từ bột gỗ, nhựa và phụ gia. Có vân gỗ tự nhiên nhưng chống nước 100%, không mối mọt cong vênh, chuyên dùng ốp cổng, ốp sàn ngoài trời.",
            category: "Vật liệu vật tư"
        }
    ];

    // TỰ ĐỘNG TẠO DANH SÁCH BẢNG CHỮ CÁI DỰA TRÊN CÁC TỪ HIỆN CÓ
    const alphabet = useMemo(() => {
        const letters = new Set();
        termsData.forEach((item) => {
            const firstLetter = item.term.trim().charAt(0).toUpperCase();
            if (firstLetter) letters.add(firstLetter);
        });
        // Sắp xếp theo thứ tự từ A đến Z và chèn chữ "ALL" lên đầu
        return ["ALL", ...Array.from(letters).sort()];
    }, [termsData]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedLetter]);

    // LOGIC TÌM KIẾM VÀ LỌC DỮ LIỆU
    const filteredTerms = useMemo(() => {
        return termsData.filter((item) => {
            const matchesSearch =
                item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.definition.toLowerCase().includes(searchTerm.toLowerCase());

            if (selectedLetter === "ALL") return matchesSearch;

            const firstLetter = item.term.trim().charAt(0).toUpperCase();
            return firstLetter === selectedLetter && matchesSearch;
        });
    }, [searchTerm, selectedLetter]); // termsData is static inside component

    const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);
    const paginatedTerms = filteredTerms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="min-h-screen bg-surface-container/10 text-on-surface pb-16">
            {/* HERO BANNER */}
            <section className="bg-white border-b border-outline-variant/60 py-12 px-5">
                <div className="max-w-[1280px] mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                        <BookOpen className="w-3.5 h-3.5" /> Tra cứu kỹ thuật
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-on-surface">
                        Thuật ngữ chuyên ngành
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 max-w-xl mx-auto">
                        Hệ thống giải nghĩa chi tiết các khái niệm kỹ thuật cơ khí, gia công cắt gọt và tiêu chuẩn vật tư công nghiệp
                    </p>

                    {/* Thanh tìm kiếm */}
                    <div className="max-w-md mx-auto pt-4 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thuật ngữ hoặc định nghĩa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-container/40 border border-outline-variant/70 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all text-on-surface"
                        />
                    </div>
                </div>
            </section>

            {/* FILTERS */}
            <section className="max-w-[1280px] mx-auto px-5 pt-8">
                <div className="flex flex-wrap items-center justify-center gap-2 pb-4 border-b border-outline-variant/40">
                    {alphabet.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => setSelectedLetter(letter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${selectedLetter === letter
                                ? "bg-primary text-white shadow-sm"
                                : "bg-white border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary"
                                }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </section>

            {/* LIST */}
            <section className="max-w-[1280px] mx-auto px-5 py-10">
                {paginatedTerms.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {paginatedTerms.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className="text-base font-black text-on-surface group-hover:text-primary transition-colors">
                                            {item.term}
                                        </h3>
                                        <span className="shrink-0 bg-surface-container/60 border border-outline-variant/50 text-on-surface-variant/80 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                                            {item.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                                        {item.definition}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Pagination UI */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant border border-outline-variant/60 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                
                                <div className="flex items-center gap-1.5 px-3">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                                                currentPage === i + 1 
                                                    ? 'bg-primary text-white shadow-sm' 
                                                    : 'text-on-surface-variant hover:bg-surface-container'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant border border-outline-variant/60 hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white border border-outline-variant/60 rounded-2xl max-w-md mx-auto p-6 space-y-3">
                        <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant/40 mx-auto">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wide">Không tìm thấy kết quả</h4>
                        <p className="text-xs text-on-surface-variant/70">
                            Không tìm thấy thuật ngữ nào khớp với nội dung tra cứu của bạn.
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedLetter("ALL");
                            }}
                            className="text-xs font-bold text-primary underline cursor-pointer"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TechnicalTerms;