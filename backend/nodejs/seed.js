// seed4_quotes.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- BẮT ĐẦU NẠP QUOTATION (BÁO GIÁ MẪU) ---");

  // Lấy ngẫu nhiên vài vật tư, độ dày, và sơn để ráp báo giá
  const materials = await prisma.materials.findMany({ take: 20 });
  const thicknessList = await prisma.material_thickness.findMany({ take: 50 });
  const paints = await prisma.paint_types.findMany({ take: 20 });

  if (!materials.length || !thicknessList.length || !paints.length) {
    console.log("Vui lòng chạy file seed 1, 2, 3 trước khi chạy file này!");
    return;
  }

  // Khởi tạo 5 Quotation (Mỗi quotation có khoảng 4-5 items -> Khoảng 25 quotation_specs)
   for (let i = 1; i <= 5; i++) {
    const quote = await prisma.quotations.create({
      data: {
        total_quoted_price: 0, // Sẽ update sau
        status: i % 2 === 0 ? "approved" : "draft",
        // ĐÃ XÓA DÒNG `note` Ở ĐÂY VÌ BẢNG QUOTATIONS KHÔNG CÓ CỘT NÀY
      },
    });

    let totalPrice = 0;

    for (let j = 1; j <= 5; j++) {
      const mat = materials[Math.floor(Math.random() * materials.length)];
      // Lấy độ dày thuộc đúng material này
      const thick = await prisma.material_thickness.findFirst({
        where: { material_id: mat.id },
      });
      const paint = paints[Math.floor(Math.random() * paints.length)];

      if (!thick) continue;

      // Giả lập kích thước Dài x Rộng ngẫu nhiên
      const width = Math.floor(Math.random() * 3000) + 800; // 800mm - 3800mm
      const height = Math.floor(Math.random() * 2500) + 1200; // 1200mm - 3700mm
      const area = (width / 1000) * (height / 1000); // Đổi ra m2

      const materialCost =
        parseFloat(mat.base_price) * parseFloat(thick.price_multiplier);
      const paintCost = parseFloat(paint.price_per_sqm) * area;
      const snapshotPrice = materialCost + paintCost + 350000 * area; // Thêm 350k/m2 tiền nhân công

      await prisma.quotation_specs.create({
        data: {
          quotation_id: quote.id,
          material_id: mat.id,
          thickness_id: thick.id,
          paint_id: paint.id,
          dimensions: {
            width_mm: width,
            height_mm: height,
            area_sqm: area.toFixed(2),
            design_pattern: "Bản vẽ Cửa Cổng CNC đính kèm",
            extras: "Đã bao gồm ổ khóa và bản lề cối",
          },
          snapshot_price: snapshotPrice,
          note: `Hạng mục thi công số ${j} (Bảo hành 12 tháng)`, // <- Cột note nằm ở bảng Specs này là chuẩn xác rồi
        },
      });
      totalPrice += snapshotPrice;
    }

    // Cập nhật lại tổng tiền cho báo giá
    await prisma.quotations.update({
      where: { id: quote.id },
      data: { total_quoted_price: totalPrice },
    });
  }

  console.log(`✅ Đã nạp thành công các Báo giá mẫu và Specs chi tiết.`);
  console.log("--- HOÀN TẤT SEED 4 ---");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
