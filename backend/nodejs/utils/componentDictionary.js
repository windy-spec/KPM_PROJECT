// Danh sách ánh xạ (Mapping) từ Danh mục con -> Mảng các bộ phận (Components)
const COMPONENT_DICT = {
  // ==========================================
  // 1. HÀNG RÀO
  // ==========================================
  "Hàng rào sắt hộp": [
    { name: "Thân hàng rào", is_required: true },
    { name: "Mũi chông sắt", is_required: false },
  ],
  "Hàng rào CNC": [
    { name: "Khung viền bao", is_required: true },
    { name: "Tấm thép cắt CNC", is_required: true },
  ],
  "Hàng rào chống trộm": [
    { name: "Thân hàng rào", is_required: true },
    { name: "Mũi giáo uốn cong", is_required: true },
  ],
  "Hàng rào lưới": [
    { name: "Khung cột", is_required: true },
    { name: "Lưới thép/B40", is_required: true },
  ],

  // ==========================================
  // 2. CỬA
  // ==========================================
  "Cửa sắt": [
    { name: "Khung bao cửa", is_required: true },
    { name: "Cánh sắt", is_required: true },
  ],
  "Cửa nhôm Xingfa": [
    { name: "Khung bao nhôm", is_required: true },
    { name: "Cánh nhôm", is_required: true },
    { name: "Kính cường lực", is_required: true },
  ],
  "Cửa kéo Đài Loan": [
    { name: "Khung bao cửa", is_required: true },
    { name: "Lá cửa cuốn/kéo", is_required: true },
    { name: "Nhíp chéo", is_required: true },
  ],
  "Cửa cuốn": [
    { name: "Trục cuốn", is_required: true },
    { name: "Nan cửa", is_required: true },
    { name: "Hộp che kỹ thuật", is_required: false },
  ],
  "Cửa 1 cánh": [
    { name: "Khung bao cửa", is_required: true },
    { name: "Cánh cửa", is_required: true },
  ],

  // ==========================================
  // 3. CỬA SỔ
  // ==========================================
  "Cửa sổ 1 cánh": [
    { name: "Khung bao cửa sổ", is_required: true },
    { name: "Cánh cửa sổ", is_required: true },
  ],
  "Cửa sổ 2 cánh": [
    { name: "Khung bao cửa sổ", is_required: true },
    { name: "Cánh cửa trái", is_required: true },
    { name: "Cánh cửa phải", is_required: true },
  ],
  "Khung sắt bảo vệ": [{ name: "Khung bảo vệ chống trộm", is_required: true }],

  // ==========================================
  // 4. MÁI NHÀ
  // ==========================================
  "Mái tôn": [
    { name: "Khung sườn chịu lực", is_required: true },
    { name: "Tấm lợp tôn", is_required: true },
  ],
  "Mái kính": [
    { name: "Khung sườn đỡ kính", is_required: true },
    { name: "Kính cường lực lấy sáng", is_required: true },
  ],
  "Mái vòm": [
    { name: "Khung sườn uốn vòm", is_required: true },
    { name: "Tấm lợp (Poly/Tôn)", is_required: true },
  ],

  // ==========================================
  // 5. VẬT DỤNG
  // ==========================================
  "Bàn làm việc": [
    { name: "Khung chân bàn", is_required: true },
    { name: "Mặt bàn", is_required: true },
  ],
  "Ghế sắt": [
    { name: "Khung chân ghế", is_required: true },
    { name: "Mặt ngồi", is_required: true },
  ],
  "Kệ trang trí": [
    { name: "Khung kệ đỡ", is_required: true },
    { name: "Mặt đợt (Tầng)", is_required: true },
  ],

  // ==========================================
  // DỰ PHÒNG: NẾU DANH MỤC LẠ KHÔNG CÓ TRONG TỪ ĐIỂN
  // ==========================================
  DEFAULT: [{ name: "Thân sản phẩm chính", is_required: true }],
};

module.exports = COMPONENT_DICT;
