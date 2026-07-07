const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log("🚀 Starting Material Thickness Migration...");

  try {
    // 1. Fetch all materials
    const materials = await prisma.materials.findMany();
    let migratedCount = 0;

    for (const mat of materials) {
      // Tìm các vật tư có tên chứa độ dày (VD: Tôn lợp 0.4mm, Tôn dày 0.75mm)
      const match = mat.material_name.match(/(?:dày\s*)?(\d+(?:\.\d+)?\s*mm)/i);
      
      if (match) {
        const thicknessStr = match[1]; // VD: "0.4mm"
        const thicknessNumberStr = thicknessStr.replace(/mm/i, '').trim(); // Lấy số "0.4"
        let newMaterialName = mat.material_name.replace(match[0], "").trim();
        // Xoá các dấu phẩy, gạch nối thừa ở cuối
        newMaterialName = newMaterialName.replace(/[,\-]\s*$/, "");

        console.log(`\n⏳ Migrating: [${mat.material_name}] -> [${newMaterialName}] (Thickness: ${thicknessNumberStr}mm)`);

        // A. Tạo material_thickness row
        const thicknessRow = await prisma.material_thickness.upsert({
          where: {
            material_id_thickness_value: {
              material_id: mat.id,
              thickness_value: thicknessNumberStr
            }
          },
          update: {},
          create: {
            material_id: mat.id,
            thickness_value: thicknessNumberStr,
            price_multiplier: 1.00
          }
        });

        // B. Cập nhật các bảng liên quan đang có material_id này
        await prisma.inventory.updateMany({
          where: { material_id: mat.id },
          data: { thickness_id: thicknessRow.id }
        });

        await prisma.inventory_logs.updateMany({
          where: { material_id: mat.id },
          data: { thickness_id: thicknessRow.id }
        });

        await prisma.material_import_requests.updateMany({
          where: { material_id: mat.id },
          data: { thickness_id: thicknessRow.id }
        });

        await prisma.quotation_specs.updateMany({
          where: { material_id: mat.id },
          data: { thickness_id: thicknessRow.id }
        });

        // C. Cập nhật lại Tên Vật Tư
        await prisma.materials.update({
          where: { id: mat.id },
          data: { material_name: newMaterialName }
        });

        console.log(`   ✅ Success! Migrated to thickness_id: ${thicknessRow.id}`);

        migratedCount++;
      }
    }

    console.log(`\n🎉 Migration Complete! Successfully migrated ${migratedCount} materials.`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
