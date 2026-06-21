const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedInventory() {
  console.log("🌱 Bắt đầu tạo dữ liệu kho (Seeding Inventory)...");
  try {
    // 1. Lấy tất cả vật liệu (materials)
    const materials = await prisma.materials.findMany();
    console.log(`Tìm thấy ${materials.length} vật liệu trong DB.`);

    let addedCount = 0;

    for (const material of materials) {
      // Kiểm tra xem vật liệu đã có trong kho chưa
      const existingInventory = await prisma.inventory.findUnique({
        where: { material_id: material.id },
      });

      if (!existingInventory) {
        // Tạo số lượng ngẫu nhiên
        const randomQuantity = Math.floor(Math.random() * (500 - 50 + 1)) + 50; // 50 - 500
        const randomLeftover = Math.floor(Math.random() * (50 - 5 + 1)) + 5; // 5 - 50

        await prisma.inventory.create({
          data: {
            material_id: material.id,
            quantity: randomQuantity,
            leftover_amount: randomLeftover,
          },
        });

        // Ghi lại log nhập kho lần đầu
        await prisma.inventory_logs.create({
          data: {
            material_id: material.id,
            action_type: "IMPORT",
            quantity_change: randomQuantity,
            created_at: new Date(),
            note: "Hệ thống tự động khởi tạo dữ liệu kho (Seed)",
          },
        });

        addedCount++;
        console.log(`+ Đã thêm tồn kho cho vật liệu: ${material.material_name} (Số lượng: ${randomQuantity}, Vụn: ${randomLeftover})`);
      }
    }

    console.log(`✅ Hoàn thành! Đã tạo dữ liệu tồn kho cho ${addedCount} vật liệu mới.`);
  } catch (error) {
    console.error("❌ Lỗi khi seed inventory:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInventory();
