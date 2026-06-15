import React, { useState, useMemo } from "react";
import { BookOpen, Search, HelpCircle } from "lucide-react";

const TechnicalTerms = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLetter, setSelectedLetter] = useState("ALL");

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
        {
            term: "Tình yêu (Love)",
            definition: "Toi yeu ong, Phong a.",
            category: "Yeu ong"
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
    }, [searchTerm, selectedLetter, termsData]);

    return (
        <div className="min-h-screen bg-surface-container/10 text-on-surface">
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
                            onChange={(e) => setSearchTerm(e.value)}
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
                {filteredTerms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredTerms.map((item, idx) => (
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