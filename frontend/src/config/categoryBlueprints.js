export const CATEGORY_BLUEPRINTS = {
  // 1: Hàng rào sắt hộp
  "HangRao-hang-rao-sat-hop": [
    { name: "Thân hàng rào", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K", "SH_3060_K", "SH_4040_K", "INOX_H2040_304"] },
    { name: "Mũi chông sắt", is_required: false, allow_paint: true, allowed_materials: ["SO_D21_K", "ST_TRON", "INOX_O21_304"] }
  ],
  // 2: Hàng rào CNC
  "HangRao-hang-rao-cnc": [
    { name: "Khung viền bao", is_required: true, allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Tấm thép cắt CNC", is_required: true, allow_paint: true, allowed_materials: ["ST_TRON"] }
  ],
  // 3: Hàng rào chống trộm
  "HangRao-hang-rao-chong-trom": [
    { name: "Thân hàng rào", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K", "SH_3060_K"] },
    { name: "Mũi giáo uốn cong", is_required: true, allow_paint: true, allowed_materials: ["SO_D21_K", "ST_TRON"] }
  ],
  // 4: Hàng rào lưới
  "HangRao-hang-rao-luoi": [
    { name: "Khung cột", is_required: true, allow_paint: true, allowed_materials: ["SO_D60_K", "SO_D90_K", "SH_4080_K"] },
    { name: "Lưới thép/B40", is_required: true, allow_paint: false, allowed_materials: ["ST_TRON"] }
  ],
  // 5: Cửa sắt
  "Cua-cua-sat": [
    { name: "Khung bao cửa", is_required: true, allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Cánh sắt", is_required: true, allow_paint: true, allowed_materials: ["SH_4080_K", "SH_4040_K"] }
  ],
  // 6: Cửa nhôm xingfa
  "Cua-cua-nhom-xingfa": [
    { name: "Khung bao nhôm", is_required: true, allow_paint: false, allowed_materials: ["SH_4080_K"] }, // Tạm dùng mã sắt hộp vì chưa có nhôm
    { name: "Cánh nhôm", is_required: true, allow_paint: false, allowed_materials: ["SH_4040_K"] },
    { name: "Kính cường lực", is_required: true, allow_paint: false, allowed_materials: ["KINH_CL_8", "KINH_CL_10", "KINH_CL_12"] }
  ],
  // 7: Cửa kéo Đài Loan
  "Cua-cua-keo-ai-loan": [
    { name: "Khung bao cửa", is_required: true, allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Lá cửa kéo", is_required: true, allow_paint: true, allowed_materials: ["ST_TRON"] },
    { name: "Nhíp chéo", is_required: true, allow_paint: true, allowed_materials: ["ST_TRON"] }
  ],
  // 8: Cửa cuốn
  "Cua-cua-cuon": [
    { name: "Trục cuốn", is_required: true, allow_paint: false, allowed_materials: ["SO_D90_K"] },
    { name: "Nan cửa", is_required: true, allow_paint: true, allowed_materials: ["ST_TRON"] },
    { name: "Hộp che kỹ thuật", is_required: false, allow_paint: true, allowed_materials: ["ST_TRON"] }
  ],
  // 9: Cửa 1 cánh
  "Cua-cua-1-canh": [
    { name: "Khung bao cửa", is_required: true, allow_paint: true, allowed_materials: ["SH_4080_K"] },
    { name: "Cánh cửa", is_required: true, allow_paint: true, allowed_materials: ["SH_4040_K", "ST_TRON"] }
  ],
  // 10: Cửa sổ 1 cánh (Tạm map)
  "CuaSo-cua-so-1-canh": [
    { name: "Khung bao cửa sổ", is_required: true, allow_paint: true, allowed_materials: ["SH_3060_K"] },
    { name: "Cánh cửa sổ", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K"] }
  ],
  // 11: Cửa sổ 2 cánh
  "CuaSo-cua-so-2-canh": [
    { name: "Khung bao cửa sổ", is_required: true, allow_paint: true, allowed_materials: ["SH_3060_K", "SH_4080_K"] },
    { name: "Cánh cửa trái", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K"] },
    { name: "Cánh cửa phải", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K"] }
  ],
  // 12: Khung sắt bảo vệ
  "CuaSo-khung-sat-bao-ve": [
    { name: "Khung bảo vệ chống trộm", is_required: true, allow_paint: true, allowed_materials: ["SH_1414_K", "SH_2040_K", "SO_D21_K", "INOX_H2040_304"] }
  ],
  // 13: Mái tôn
  "MaiNha-mai-ton": [
    { name: "Khung sườn chịu lực", is_required: true, allow_paint: true, allowed_materials: ["SH_50100_K", "SH_4080_K"] },
    { name: "Tấm lợp tôn", is_required: true, allow_paint: false, allowed_materials: ["ST_TRON"] }
  ],
  // 14: Mái kính
  "MaiNha-mai-kinh": [
    { name: "Khung sườn đỡ kính", is_required: true, allow_paint: true, allowed_materials: ["SH_50100_K", "SH_4080_K"] },
    { name: "Kính cường lực lấy sáng", is_required: true, allow_paint: false, allowed_materials: ["KINH_CL_10", "KINH_CL_12", "KINH_AT_638"] }
  ],
  // 15: Mái vòm
  "MaiNha-mai-vom": [
    { name: "Khung sườn uốn vòm", is_required: true, allow_paint: true, allowed_materials: ["SO_D42_K", "SO_D60_K"] },
    { name: "Tấm lợp (Poly/Tôn)", is_required: true, allow_paint: false, allowed_materials: ["ST_TRON"] }
  ],
  // 16: Bàn làm việc
  "VatDung-ban-lam-viec": [
    { name: "Khung chân bàn", is_required: true, allow_paint: true, allowed_materials: ["SH_3060_K", "SH_4040_K", "INOX_H3060_304"] },
    { name: "Mặt bàn", is_required: true, allow_paint: false, allowed_materials: ["ST_TRON"] }
  ],
  // 17: Ghế sắt
  "VatDung-ghe-sat": [
    { name: "Khung chân ghế", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K", "SH_1414_K", "SO_D21_K"] },
    { name: "Mặt ngồi", is_required: true, allow_paint: true, allowed_materials: ["ST_TRON", "ST_NHAM"] }
  ],
  // 18: Kệ trang trí
  "VatDung-ke-trang-tri": [
    { name: "Khung kệ đỡ", is_required: true, allow_paint: true, allowed_materials: ["SH_2040_K", "SH_1414_K", "INOX_H2040_304"] },
    { name: "Mặt đợt (Tầng)", is_required: true, allow_paint: false, allowed_materials: ["ST_TRON", "KINH_CL_8"] }
  ]
};
