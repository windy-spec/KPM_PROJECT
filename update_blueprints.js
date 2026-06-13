const CATEGORY_BLUEPRINTS = {
  // --- NHÓM NHÀ TIỀN CHẾ ---
  "NhaTienChe-nha-xuong-tien-che": [
    { name: "Khung kèo thép", length: 20000, width: 10000, height: 6000, unit: "mm", default_material: "THEP_I_200", allow_paint: true, allowed_materials: ["THEP_I_200", "THEP_U_150", "SH_50100_K"] },
    { name: "Tôn lợp mái", length: 20000, width: 10000, height: 0, unit: "mm", default_material: "TON_MA_MAU", allow_paint: false, allowed_materials: ["TON_MA_MAU", "TON_PANEL_EPS_50", "POLY_5"] },
    { name: "Tôn bao che vách", length: 20000, width: 6000, height: 0, unit: "mm", default_material: "TON_MA_MAU", allow_paint: false, allowed_materials: ["TON_MA_MAU", "TON_PANEL_EPS_50"] }
  ],
  "NhaTienChe-nha-kho-lap-ghep": [
    { name: "Khung sườn chịu lực", length: 15000, width: 8000, height: 5000, unit: "mm", default_material: "THEP_I_200", allow_paint: true, allowed_materials: ["THEP_I_200", "THEP_U_150"] },
    { name: "Sàn lửng/Tầng lửng", length: 15000, width: 4000, height: 0, unit: "mm", default_material: "CEMBOARD_18", allow_paint: false, allowed_materials: ["CEMBOARD_18", "TON_DECKING_50"] },
    { name: "Vách ngăn Panel", length: 15000, width: 5000, height: 0, unit: "mm", default_material: "TON_PANEL_EPS_50", allow_paint: false, allowed_materials: ["TON_PANEL_EPS_50"] }
  ],
  "NhaTienChe-quan-cafe-khung-thep": [
    { name: "Khung chính chịu lực", length: 10000, width: 5000, height: 3500, unit: "mm", default_material: "THEP_I_200", allow_paint: true, allowed_materials: ["THEP_I_200", "THEP_U_150", "SH_50100_K"] },
    { name: "Sàn Decking", length: 10000, width: 5000, height: 0, unit: "mm", default_material: "TON_DECKING_50", allow_paint: false, allowed_materials: ["TON_DECKING_50", "CEMBOARD_18"] },
    { name: "Hệ mái che (Kính/Tôn)", length: 10000, width: 5000, height: 0, unit: "mm", default_material: "POLY_5", allow_paint: false, allowed_materials: ["POLY_5", "KINH_AT_638", "TON_MA_MAU"] }
  ],

  // --- NHÓM HÀNG RÀO ---
  "HangRao-hang-rao-sat-hop": [
    { name: "Thân hàng rào", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "SH_3060_K", allow_paint: true, allowed_materials: ["SH_2040_K", "SH_3060_K", "SH_4040_K", "INOX_H2040_304"] },
    { name: "Mũi chông sắt", length: 1000, width: 0, height: 0, unit: "mm", default_material: "SO_D21_K", allow_paint: true, allowed_materials: ["SO_D21_K", "ST_TRON", "INOX_O21_304"] }
  ],
  "HangRao-hang-rao-cnc": [
    { name: "Khung viền bao", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "SH_4080_K", allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Tấm thép cắt CNC", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "ST_TRON", allow_paint: true, allowed_materials: ["ST_TRON", "ST_NHAM"] }
  ],
  "HangRao-hang-rao-chong-trom": [
    { name: "Thân hàng rào", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "SH_3060_K", allow_paint: true, allowed_materials: ["SH_2040_K", "SH_3060_K"] },
    { name: "Mũi giáo uốn cong", length: 1000, width: 0, height: 0, unit: "mm", default_material: "ST_TRON", allow_paint: true, allowed_materials: ["SO_D21_K", "ST_TRON"] }
  ],
  "HangRao-hang-rao-luoi": [
    { name: "Khung cột", length: 2000, width: 0, height: 0, unit: "mm", default_material: "SO_D60_K", allow_paint: true, allowed_materials: ["SO_D60_K", "SO_D90_K", "SH_4080_K"] },
    { name: "Lưới thép/B40", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "LUOI_B40", allow_paint: false, allowed_materials: ["LUOI_B40", "GRATING_30"] }
  ],

  // --- NHÓM CỬA / CỬA SỔ ---
  "Cua-cua-sat": [
    { name: "Khung bao cửa", length: 2200, width: 1000, height: 0, unit: "mm", default_material: "SH_4080_K", allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Cánh sắt", length: 2150, width: 950, height: 0, unit: "mm", default_material: "SH_4040_K", allow_paint: true, allowed_materials: ["SH_4080_K", "SH_4040_K"] }
  ],
  "Cua-cua-nhom-xingfa": [
    { name: "Khung bao nhôm", length: 2200, width: 1000, height: 0, unit: "mm", default_material: "NHOM_XF_55", allow_paint: false, allowed_materials: ["NHOM_XF_55", "NHOM_XF_93"] }, 
    { name: "Cánh nhôm", length: 2150, width: 950, height: 0, unit: "mm", default_material: "NHOM_XF_55", allow_paint: false, allowed_materials: ["NHOM_XF_55", "NHOM_XF_93"] },
    { name: "Kính cường lực", length: 2000, width: 800, height: 0, unit: "mm", default_material: "KINH_CL_8", allow_paint: false, allowed_materials: ["KINH_CL_8", "KINH_CL_10", "KINH_CL_12", "KINH_AT_638"] }
  ],
  "Cua-cua-keo-ai-loan": [
    { name: "Khung bao cửa", length: 2200, width: 1000, height: 0, unit: "mm", default_material: "SH_4080_K", allow_paint: true, allowed_materials: ["SH_4080_K", "SH_50100_K"] },
    { name: "Lá cửa kéo", length: 2000, width: 100, height: 0, unit: "mm", default_material: "LA_CUA_KEO", allow_paint: true, allowed_materials: ["LA_CUA_KEO"] },
    { name: "Nhíp chéo", length: 2000, width: 100, height: 0, unit: "mm", default_material: "ST_TRON", allow_paint: true, allowed_materials: ["ST_TRON"] }
  ],
  "Cua-cua-cuon": [
    { name: "Trục cuốn", length: 1000, width: 0, height: 0, unit: "mm", default_material: "SO_D90_K", allow_paint: false, allowed_materials: ["SO_D90_K"] },
    { name: "Nan cửa", length: 2000, width: 1000, height: 0, unit: "mm", default_material: "NAN_CUOC_ALU", allow_paint: true, allowed_materials: ["NAN_CUOC_ALU", "LA_CUA_KEO"] },
    { name: "Hộp che kỹ thuật", length: 1000, width: 300, height: 300, unit: "mm", default_material: "ST_TRON", allow_paint: true, allowed_materials: ["ST_TRON", "TON_MA_MAU"] }
  ],
  "Cua-cua-1-canh": [
    { name: "Khung bao cửa", length: 2200, width: 1000, height: 0, unit: "mm", default_material: "SH_4080_K", allow_paint: true, allowed_materials: ["SH_4080_K"] },
    { name: "Cánh cửa", length: 2150, width: 950, height: 0, unit: "mm", default_material: "SH_4040_K", allow_paint: true, allowed_materials: ["SH_4040_K", "ST_TRON"] }
  ],
  "CuaSo-cua-so-1-canh": [
    { name: "Khung bao cửa sổ", length: 1200, width: 800, height: 0, unit: "mm", default_material: "SH_3060_K", allow_paint: true, allowed_materials: ["SH_3060_K"] },
    { name: "Cánh cửa sổ", length: 1150, width: 750, height: 0, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_2040_K"] }
  ],
  "CuaSo-cua-so-2-canh": [
    { name: "Khung bao cửa sổ", length: 1200, width: 1200, height: 0, unit: "mm", default_material: "SH_3060_K", allow_paint: true, allowed_materials: ["SH_3060_K", "SH_4080_K"] },
    { name: "Cánh cửa trái", length: 1150, width: 550, height: 0, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_2040_K"] },
    { name: "Cánh cửa phải", length: 1150, width: 550, height: 0, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_2040_K"] }
  ],
  "CuaSo-khung-sat-bao-ve": [
    { name: "Khung bảo vệ chống trộm", length: 1200, width: 1200, height: 0, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_1414_K", "SH_2040_K", "SO_D21_K", "INOX_H2040_304"] }
  ],

  // --- NHÓM MÁI NHÀ ---
  "MaiNha-mai-ton": [
    { name: "Khung sườn chịu lực", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "SH_50100_K", allow_paint: true, allowed_materials: ["SH_50100_K", "SH_4080_K", "THEP_I_200"] },
    { name: "Tấm lợp tôn", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "TON_MA_MAU", allow_paint: false, allowed_materials: ["TON_MA_MAU", "TON_PANEL_EPS_50"] }
  ],
  "MaiNha-mai-kinh": [
    { name: "Khung sườn đỡ kính", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "SH_50100_K", allow_paint: true, allowed_materials: ["SH_50100_K", "SH_4080_K", "THEP_I_200"] },
    { name: "Kính cường lực lấy sáng", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "KINH_AT_638", allow_paint: false, allowed_materials: ["KINH_CL_10", "KINH_CL_12", "KINH_AT_638"] }
  ],
  "MaiNha-mai-vom": [
    { name: "Khung sườn uốn vòm", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "SO_D60_K", allow_paint: true, allowed_materials: ["SO_D42_K", "SO_D60_K"] },
    { name: "Tấm lợp (Poly/Tôn)", length: 5000, width: 3000, height: 0, unit: "mm", default_material: "POLY_5", allow_paint: false, allowed_materials: ["POLY_5", "TON_MA_MAU"] }
  ],

  // --- NHÓM VẬT DỤNG ---
  "VatDung-ban-lam-viec": [
    { name: "Khung chân bàn", length: 1200, width: 600, height: 750, unit: "mm", default_material: "SH_3060_K", allow_paint: true, allowed_materials: ["SH_3060_K", "SH_4040_K", "INOX_H3060_304"] },
    { name: "Mặt bàn", length: 1200, width: 600, height: 0, unit: "mm", default_material: "GO_MDF_18", allow_paint: false, allowed_materials: ["GO_MDF_18", "GO_CAOSU_18", "ST_TRON", "KINH_CL_8"] }
  ],
  "VatDung-ghe-sat": [
    { name: "Khung chân ghế", length: 400, width: 400, height: 450, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_2040_K", "SH_1414_K", "SO_D21_K"] },
    { name: "Mặt ngồi", length: 400, width: 400, height: 0, unit: "mm", default_material: "GO_CAOSU_18", allow_paint: false, allowed_materials: ["GO_MDF_18", "GO_CAOSU_18", "ST_TRON", "ST_NHAM"] }
  ],
  "VatDung-ke-trang-tri": [
    { name: "Khung kệ đỡ", length: 1000, width: 300, height: 1500, unit: "mm", default_material: "SH_2040_K", allow_paint: true, allowed_materials: ["SH_2040_K", "SH_1414_K", "INOX_H2040_304"] },
    { name: "Mặt đợt (Tầng)", length: 1000, width: 300, height: 0, unit: "mm", default_material: "GO_MDF_18", allow_paint: false, allowed_materials: ["GO_MDF_18", "GO_CAOSU_18", "ST_TRON", "KINH_CL_8"] }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CATEGORY_BLUEPRINTS;
} else {
  export { CATEGORY_BLUEPRINTS };
}
