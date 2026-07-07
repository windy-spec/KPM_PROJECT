const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/services/warehouse.service.js');
let content = fs.readFileSync(filePath, 'utf8');

const injection = `
  // Lấy tất cả thông tin tồn kho
  async getAllInventory() {
    return await prisma.inventory.findMany({
      include: {
        materials: {
          select: {
            material_code: true,
            material_name: true,
            base_price: true,
          },
        },
        material_thickness: true,
      },
      orderBy: { updated_at: "desc" },
    });
  }

  // Lấy danh sách lịch sử phiếu xuất kho`;

content = content.replace(/\/\/ Lấy danh sách lịch sử phiếu xuất kho/g, injection);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Restored getAllInventory");
