const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMaterials() {
  try {
    // 1. Lấy hoặc tạo Types
    const typeNames = [
      { name: "Nhôm định hình", desc: "Nhôm Xingfa, nhôm hệ các loại" },
      { name: "Tôn & Tấm lợp", desc: "Tôn lạnh, tôn xốp, Polycarbonate, ngói" },
      { name: "Vật liệu lót sàn & vách", desc: "Cemboard, Gỗ MDF, Panel, Decking" },
      { name: "Lưới & Lam", desc: "Lưới B40, lưới thép hàn, lam nhôm/thép" },
      { name: "Thép hình & Sắt đặc", desc: "Thép I, U, V, H, Sắt đặc vuông, tròn" }
    ];

    const typeMap = {};
    for (const t of typeNames) {
      let type = await prisma.material_types.findFirst({ where: { type_name: t.name } });
      if (!type) {
        type = await prisma.material_types.create({
          data: { type_name: t.name, description: t.desc }
        });
        console.log(`+ Created Type: ${t.name}`);
      }
      typeMap[t.name] = type.id;
    }

    // Lấy ID của Sắt hộp mạ kẽm và Kính cường lực nếu có
    const satHopType = await prisma.material_types.findFirst({ where: { type_name: "Sắt hộp mạ kẽm" } });
    const satOngType = await prisma.material_types.findFirst({ where: { type_name: "Sắt ống mạ kẽm" } });
    const kinhType = await prisma.material_types.findFirst({ where: { type_name: "Kính cường lực" } });

    // 2. Lấy hoặc tạo Units
    const unitNames = ["Tấm", "Cây", "m dài", "m2", "Hộp", "Bộ", "Chai", "Túi", "Kg"];
    const unitMap = {};
    for (const u of unitNames) {
      let unit = await prisma.material_units.findFirst({ where: { unit_name: u } });
      if (!unit) {
        unit = await prisma.material_units.create({ data: { unit_name: u } });
        console.log(`+ Created Unit: ${u}`);
      }
      unitMap[u] = unit.id;
    }

    // 3. Update existing orphaned materials
    const updates = [
      { code: "THEP_I_200", typeId: typeMap["Thép hình & Sắt đặc"], unitId: unitMap["Cây"] },
      { code: "THEP_U_150", typeId: typeMap["Thép hình & Sắt đặc"], unitId: unitMap["Cây"] },
      { code: "TON_PANEL_EPS_50", typeId: typeMap["Tôn & Tấm lợp"], unitId: unitMap["m2"] },
      { code: "TON_MA_MAU", typeId: typeMap["Tôn & Tấm lợp"], unitId: unitMap["m2"] },
      { code: "CEMBOARD_18", typeId: typeMap["Vật liệu lót sàn & vách"], unitId: unitMap["Tấm"] },
      { code: "GRATING_30", typeId: typeMap["Vật liệu lót sàn & vách"], unitId: unitMap["m2"] }
    ];

    for (const u of updates) {
      await prisma.materials.updateMany({
        where: { material_code: u.code },
        data: { type_id: u.typeId, unit_id: u.unitId }
      });
    }
    console.log(`✅ Updated existing orphaned materials`);

    // 4. Create new materials
    const newMaterials = [
      { code: "NHOM_XF_55", name: "Nhôm Xingfa Hệ 55 (Dày 1.4-2.0mm)", type: typeMap["Nhôm định hình"], unit: unitMap["Cây"], price: 350000 },
      { code: "NHOM_XF_93", name: "Nhôm Xingfa Hệ 93 (Hệ Lùa)", type: typeMap["Nhôm định hình"], unit: unitMap["Cây"], price: 400000 },
      { code: "GO_MDF_18", name: "Gỗ công nghiệp MDF lõi xanh chống ẩm 18mm", type: typeMap["Vật liệu lót sàn & vách"], unit: unitMap["m2"], price: 250000 },
      { code: "GO_CAOSU_18", name: "Gỗ cao su ghép thanh phủ keo bóng 18mm", type: typeMap["Vật liệu lót sàn & vách"], unit: unitMap["m2"], price: 320000 },
      { code: "KINH_AT_638", name: "Kính dán an toàn 2 lớp 6.38mm", type: kinhType?.id || null, unit: unitMap["m2"], price: 350000 },
      { code: "POLY_5", name: "Tấm nhựa lấy sáng Polycarbonate đặc ruột 5mm", type: typeMap["Tôn & Tấm lợp"], unit: unitMap["m2"], price: 450000 },
      { code: "TON_DECKING_50", name: "Tôn đổ sàn Decking h50w1000 dày 0.75mm", type: typeMap["Vật liệu lót sàn & vách"], unit: unitMap["m2"], price: 180000 },
      { code: "LUOI_B40", name: "Lưới thép B40 bọc nhựa PVC", type: typeMap["Lưới & Lam"], unit: unitMap["m2"], price: 45000 },
      { code: "NAN_CUOC_ALU", name: "Nan cửa cuốn hợp kim nhôm khe thoáng", type: typeMap["Nhôm định hình"], unit: unitMap["m2"], price: 1200000 },
      { code: "LA_CUA_KEO", name: "Lá cửa kéo đài loan tôn mạ màu 0.6mm", type: typeMap["Tôn & Tấm lợp"], unit: unitMap["m2"], price: 450000 },
      { code: "ST_NHAM", name: "Sắt tấm nhám chống trượt dày 3mm", type: typeMap["Thép hình & Sắt đặc"], unit: unitMap["m2"], price: 650000 }
    ];

    for (const m of newMaterials) {
      const exist = await prisma.materials.findUnique({ where: { material_code: m.code } });
      if (!exist) {
        await prisma.materials.create({
          data: {
            material_code: m.code,
            material_name: m.name,
            type_id: m.type,
            unit_id: m.unit,
            base_price: m.price
          }
        });
        console.log(`+ Created Material: ${m.code}`);
      }
    }

    console.log("🚀 Quá trình chuẩn hóa Materials hoàn tất!");

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMaterials();
