const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

// Sử dụng Object để ghi nhớ và tái sử dụng UUID thật, đảm bảo chuẩn UUID v4 và đúng Khóa ngoại
const idMap = {};
const genId = (key) => {
  if (!idMap[key]) {
    idMap[key] = crypto.randomUUID();
  }
  return idMap[key];
};

async function main() {
  console.log("Bắt đầu dọn dẹp dữ liệu cũ...");

  // Xóa theo thứ tự Ràng buộc Khóa ngoại (Con trước, Cha sau)
  await prisma.quotation_specs.deleteMany({});
  await prisma.material_thickness.deleteMany({});
  await prisma.materials.deleteMany({});
  await prisma.material_types.deleteMany({});
  await prisma.material_units.deleteMany({});
  await prisma.labor_rates.deleteMany({});
  await prisma.labor_categories.deleteMany({});
  await prisma.labor_pricing_models.deleteMany({});
  await prisma.paint_types.deleteMany({});

  console.log("Đã xóa sạch dữ liệu cũ. Bắt đầu nạp Seed Data...");

  // ---------------------------------------------------------
  // 1. NẠP ĐƠN VỊ TÍNH (material_units)
  // ---------------------------------------------------------
  const unitsData = [
    { id: genId("u1"), unit_name: "Cây" },
    { id: genId("u2"), unit_name: "Mét" },
    { id: genId("u3"), unit_name: "m2" },
    { id: genId("u4"), unit_name: "Kg" },
    { id: genId("u5"), unit_name: "Cái" },
    { id: genId("u6"), unit_name: "Bộ" },
    { id: genId("u7"), unit_name: "Hộp" },
    { id: genId("u8"), unit_name: "Vỉ" },
    { id: genId("u9"), unit_name: "Lít" },
    { id: genId("u10"), unit_name: "Cuộn" },
    { id: genId("u11"), unit_name: "Chai" },
    { id: genId("u12"), unit_name: "Túi" },
  ];
  await prisma.material_units.createMany({ data: unitsData });

  // ---------------------------------------------------------
  // 2. NẠP PHÂN LOẠI VẬT TƯ (material_types)
  // ---------------------------------------------------------
  const typesData = [
    {
      id: genId("t1"),
      type_name: "Sắt/Thép hộp",
      description: "Các loại sắt thép hộp vuông, chữ nhật (đen, mạ kẽm)",
    },
    {
      id: genId("t2"),
      type_name: "Sắt/Thép ống",
      description: "Các loại ống thép tròn đen, mạ kẽm",
    },
    {
      id: genId("t3"),
      type_name: "Sắt/Thép tấm",
      description: "Thép tấm trơn, nhám, la, V, U, I",
    },
    {
      id: genId("t4"),
      type_name: "Vật tư Inox",
      description: "Inox hộp, ống, tấm chuẩn 201, 304",
    },
    {
      id: genId("t5"),
      type_name: "Kính cường lực",
      description: "Kính cường lực, kính an toàn, kính ốp bếp",
    },
    {
      id: genId("t6"),
      type_name: "Phụ kiện & Vật tư phụ",
      description: "Bản lề, khóa, que hàn, đá cắt, ốc vít",
    },
  ];
  await prisma.material_types.createMany({ data: typesData });

  // ---------------------------------------------------------
  // 3. NẠP VẬT TƯ CHI TIẾT (materials)
  // ---------------------------------------------------------
  const materialsData = [
    // --- T1: Sắt/Thép hộp (Bán theo Cây 6m) ---
    {
      id: genId("m1"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_1414_K",
      material_name: "Sắt hộp mạ kẽm 14x14",
      base_price: 55000,
    },
    {
      id: genId("m2"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_2040_K",
      material_name: "Sắt hộp mạ kẽm 20x40",
      base_price: 115000,
    },
    {
      id: genId("m3"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_3060_K",
      material_name: "Sắt hộp mạ kẽm 30x60",
      base_price: 175000,
    },
    {
      id: genId("m4"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_4080_K",
      material_name: "Sắt hộp mạ kẽm 40x80",
      base_price: 255000,
    },
    {
      id: genId("m5"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_50100_K",
      material_name: "Sắt hộp mạ kẽm 50x100",
      base_price: 360000,
    },
    {
      id: genId("m6"),
      type_id: genId("t1"),
      unit_id: genId("u1"),
      material_code: "SH_4040_K",
      material_name: "Sắt hộp mạ kẽm 40x40",
      base_price: 180000,
    },

    // --- T2: Sắt/Thép ống (Bán theo Cây 6m) ---
    {
      id: genId("m7"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D21_K",
      material_name: "Thép ống mạ kẽm Φ21",
      base_price: 75000,
    },
    {
      id: genId("m8"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D27_K",
      material_name: "Thép ống mạ kẽm Φ27",
      base_price: 105000,
    },
    {
      id: genId("m9"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D34_K",
      material_name: "Thép ống mạ kẽm Φ34",
      base_price: 135000,
    },
    {
      id: genId("m10"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D42_K",
      material_name: "Thép ống mạ kẽm Φ42",
      base_price: 165000,
    },
    {
      id: genId("m11"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D60_K",
      material_name: "Thép ống mạ kẽm Φ60",
      base_price: 245000,
    },
    {
      id: genId("m12"),
      type_id: genId("t2"),
      unit_id: genId("u1"),
      material_code: "SO_D90_K",
      material_name: "Thép ống mạ kẽm Φ90",
      base_price: 450000,
    },

    // --- T3: Sắt/Thép tấm (Bán theo Kg hoặc m2) ---
    {
      id: genId("m13"),
      type_id: genId("t3"),
      unit_id: genId("u4"),
      material_code: "ST_TRON",
      material_name: "Thép tấm trơn SS400",
      base_price: 16500,
    },
    {
      id: genId("m14"),
      type_id: genId("t3"),
      unit_id: genId("u4"),
      material_code: "ST_NHAM",
      material_name: "Thép tấm nhám chống trượt",
      base_price: 17500,
    },
    {
      id: genId("m15"),
      type_id: genId("t3"),
      unit_id: genId("u1"),
      material_code: "SV_4040",
      material_name: "Thép V mạ kẽm V40x40",
      base_price: 125000,
    },
    {
      id: genId("m16"),
      type_id: genId("t3"),
      unit_id: genId("u1"),
      material_code: "SV_5050",
      material_name: "Thép V mạ kẽm V50x50",
      base_price: 185000,
    },
    {
      id: genId("m17"),
      type_id: genId("t3"),
      unit_id: genId("u1"),
      material_code: "SLA_30",
      material_name: "Thép La mạ kẽm 30mm",
      base_price: 90000,
    },

    // --- T4: Vật tư Inox 304 (Bán theo Cây 6m hoặc Kg) ---
    {
      id: genId("m18"),
      type_id: genId("t4"),
      unit_id: genId("u1"),
      material_code: "INOX_H2040_304",
      material_name: "Inox hộp 304 20x40",
      base_price: 350000,
    },
    {
      id: genId("m19"),
      type_id: genId("t4"),
      unit_id: genId("u1"),
      material_code: "INOX_H3060_304",
      material_name: "Inox hộp 304 30x60",
      base_price: 520000,
    },
    {
      id: genId("m20"),
      type_id: genId("t4"),
      unit_id: genId("u1"),
      material_code: "INOX_H4080_304",
      material_name: "Inox hộp 304 40x80",
      base_price: 780000,
    },
    {
      id: genId("m21"),
      type_id: genId("t4"),
      unit_id: genId("u1"),
      material_code: "INOX_O21_304",
      material_name: "Inox ống 304 Φ21",
      base_price: 210000,
    },
    {
      id: genId("m22"),
      type_id: genId("t4"),
      unit_id: genId("u1"),
      material_code: "INOX_O42_304",
      material_name: "Inox ống 304 Φ42",
      base_price: 430000,
    },
    {
      id: genId("m23"),
      type_id: genId("t4"),
      unit_id: genId("u4"),
      material_code: "INOX_TAM_304",
      material_name: "Inox tấm 304 Bóng BA",
      base_price: 65000,
    },

    // --- T5: Kính cường lực (Bán theo m2) ---
    {
      id: genId("m24"),
      type_id: genId("t5"),
      unit_id: genId("u3"),
      material_code: "KINH_CL_8",
      material_name: "Kính cường lực 8 ly (mm)",
      base_price: 450000,
    },
    {
      id: genId("m25"),
      type_id: genId("t5"),
      unit_id: genId("u3"),
      material_code: "KINH_CL_10",
      material_name: "Kính cường lực 10 ly (mm)",
      base_price: 550000,
    },
    {
      id: genId("m26"),
      type_id: genId("t5"),
      unit_id: genId("u3"),
      material_code: "KINH_CL_12",
      material_name: "Kính cường lực 12 ly (mm)",
      base_price: 700000,
    },
    {
      id: genId("m27"),
      type_id: genId("t5"),
      unit_id: genId("u3"),
      material_code: "KINH_AT_638",
      material_name: "Kính dán an toàn 6.38 ly",
      base_price: 420000,
    },
    {
      id: genId("m28"),
      type_id: genId("t5"),
      unit_id: genId("u3"),
      material_code: "KINH_OB",
      material_name: "Kính màu ốp bếp 8 ly",
      base_price: 750000,
    },

    // --- T6: Phụ kiện & Vật tư phụ ---
    {
      id: genId("m29"),
      type_id: genId("t6"),
      unit_id: genId("u7"),
      material_code: "PK_QH_SAT",
      material_name: "Que hàn sắt Kim Tín 2.5mm (Hộp 20kg)",
      base_price: 450000,
    },
    {
      id: genId("m30"),
      type_id: genId("t6"),
      unit_id: genId("u7"),
      material_code: "PK_QH_INOX",
      material_name: "Que hàn Inox 2.5mm (Hộp 2kg)",
      base_price: 250000,
    },
    {
      id: genId("m31"),
      type_id: genId("t6"),
      unit_id: genId("u7"),
      material_code: "PK_DA_CAT",
      material_name: "Đá cắt sắt Hải Dương 100mm (Hộp 50v)",
      base_price: 250000,
    },
    {
      id: genId("m32"),
      type_id: genId("t6"),
      unit_id: genId("u7"),
      material_code: "PK_DA_MAI",
      material_name: "Đá mài sắt Hải Dương 100mm (Hộp 25v)",
      base_price: 300000,
    },
    {
      id: genId("m33"),
      type_id: genId("t6"),
      unit_id: genId("u5"),
      material_code: "PK_BL_COI",
      material_name: "Bản lề cối tiện 1 trụ (D20)",
      base_price: 25000,
    },
    {
      id: genId("m34"),
      type_id: genId("t6"),
      unit_id: genId("u6"),
      material_code: "PK_KHOA_CG",
      material_name: "Khóa tay gạt cửa cổng Inox",
      base_price: 350000,
    },
    {
      id: genId("m35"),
      type_id: genId("t6"),
      unit_id: genId("u11"),
      material_code: "PK_SILICON",
      material_name: "Keo Silicon Apollo A500",
      base_price: 65000,
    },
    {
      id: genId("m36"),
      type_id: genId("t6"),
      unit_id: genId("u12"),
      material_code: "PK_VIT_TK",
      material_name: "Vít tự khoan (Túi 1000 con)",
      base_price: 120000,
    },
  ];
  await prisma.materials.createMany({ data: materialsData });

  // ---------------------------------------------------------
  // 4. NẠP CẤP BẬC NHÂN CÔNG & MÔ HÌNH TÍNH GIÁ
  // ---------------------------------------------------------
  const laborCategories = [
    {
      id: genId("lc1"),
      category_name: "Phụ việc",
      description: "Lau chùi, bưng bê, dọn dẹp",
    },
    {
      id: genId("lc2"),
      category_name: "Thợ phụ",
      description: "Cắt sắt, mài, phụ hàn",
    },
    {
      id: genId("lc3"),
      category_name: "Thợ chính",
      description: "Hàn tig/mig, ra bản vẽ, ráp khung định hình",
    },
    {
      id: genId("lc4"),
      category_name: "Thầu/Quản lý",
      description: "Kỹ thuật viên đo đạc, giám sát thi công",
    },
  ];
  await prisma.labor_categories.createMany({ data: laborCategories });

  const laborModels = [
    { id: genId("lm1"), model_name: "Tính theo ngày công" },
    { id: genId("lm2"), model_name: "Khoán theo m2" },
  ];
  await prisma.labor_pricing_models.createMany({ data: laborModels });

  const laborRates = [
    {
      id: genId("lr1"),
      category_id: genId("lc1"),
      model_id: genId("lm1"),
      rate_amount: 300000,
    },
    {
      id: genId("lr2"),
      category_id: genId("lc2"),
      model_id: genId("lm1"),
      rate_amount: 450000,
    },
    {
      id: genId("lr3"),
      category_id: genId("lc3"),
      model_id: genId("lm1"),
      rate_amount: 600000,
    },
    {
      id: genId("lr4"),
      category_id: genId("lc4"),
      model_id: genId("lm1"),
      rate_amount: 800000,
    },
    {
      id: genId("lr5"),
      category_id: genId("lc2"),
      model_id: genId("lm2"),
      rate_amount: 150000,
    },
    {
      id: genId("lr6"),
      category_id: genId("lc3"),
      model_id: genId("lm2"),
      rate_amount: 350000,
    },
  ];
  await prisma.labor_rates.createMany({ data: laborRates });

  // ---------------------------------------------------------
  // 5. NẠP BẢNG LOẠI SƠN (paint_types)
  // ---------------------------------------------------------
  const paintTypes = [
    {
      id: genId("p1"),
      paint_name: "Không sơn",
      price_per_sqm: 0,
      description: "Áp dụng cho Inox hoặc giữ nguyên bản mạ kẽm",
    },
    {
      id: genId("p2"),
      paint_name: "Sơn chống rỉ 1 lớp",
      price_per_sqm: 35000,
      description: "Sơn lót đỏ/ghi mờ",
    },
    {
      id: genId("p3"),
      paint_name: "Sơn xịt tay (Lót + Màu)",
      price_per_sqm: 75000,
      description: "Sơn Epoxy 2 thành phần phun tay",
    },
    {
      id: genId("p4"),
      paint_name: "Sơn tĩnh điện trong nhà",
      price_per_sqm: 120000,
      description: "Bề mặt bền, mịn, nung nhiệt",
    },
    {
      id: genId("p5"),
      paint_name: "Sơn tĩnh điện ngoài trời",
      price_per_sqm: 160000,
      description: "Chống tia UV, chống trầy xước cao",
    },
    {
      id: genId("p6"),
      paint_name: "Sơn mạ kẽm nguội",
      price_per_sqm: 90000,
      description: "Chấm hàn hoặc phủ toàn bộ mấu nối",
    },
  ];
  await prisma.paint_types.createMany({ data: paintTypes });

  // ---------------------------------------------------------
  // 6. NẠP HỆ SỐ ĐỘ DÀY (material_thickness)
  // ---------------------------------------------------------
  const thicknessData = [];
  let tCounter = 1;

  const thicknessLevels = [
    { val: "0.8mm", mul: 0.8 },
    { val: "1.0mm", mul: 1.0 },
    { val: "1.2mm", mul: 1.2 },
    { val: "1.4mm", mul: 1.4 },
    { val: "1.8mm", mul: 1.8 },
    { val: "2.0mm", mul: 2.0 },
  ];

  for (let i = 1; i <= 6; i++) {
    for (const t of thicknessLevels) {
      thicknessData.push({
        id: genId(`th${tCounter++}`),
        material_id: genId(`m${i}`),
        thickness_value: t.val,
        price_multiplier: t.mul,
      });
    }
  }

  for (let i = 7; i <= 12; i++) {
    for (const t of thicknessLevels) {
      thicknessData.push({
        id: genId(`th${tCounter++}`),
        material_id: genId(`m${i}`),
        thickness_value: t.val,
        price_multiplier: t.mul,
      });
    }
  }

  const plateThicknesses = [
    { val: "2.0mm", mul: 1.0 },
    { val: "3.0mm", mul: 1.5 },
    { val: "5.0mm", mul: 2.5 },
    { val: "8.0mm", mul: 4.0 },
    { val: "10.0mm", mul: 5.0 },
  ];

  for (let i = 13; i <= 14; i++) {
    for (const t of plateThicknesses) {
      thicknessData.push({
        id: genId(`th${tCounter++}`),
        material_id: genId(`m${i}`),
        thickness_value: t.val,
        price_multiplier: t.mul,
      });
    }
  }

  await prisma.material_thickness.createMany({ data: thicknessData });

  console.log("✅ Seed dữ liệu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Có lỗi xảy ra trong quá trình seed dữ liệu:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
