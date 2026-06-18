const { PrismaClient } = require('./backend/nodejs/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Đang lấy danh sách sản phẩm...");
  const products = await prisma.products.findMany();
  
  let updatedCount = 0;

  for (const product of products) {
    if (!product.components) continue;
    
    let components = [];
    try {
      // Handle stringified JSON or object JSON
      components = typeof product.components === 'string' ? JSON.parse(product.components) : product.components;
      
      if (!Array.isArray(components)) {
        components = [];
      }
    } catch (e) {
      console.log(`Lỗi parse components của sản phẩm ${product.product_code}`);
      continue;
    }

    if (components.length === 0) continue;

    let hasChanges = false;
    const newComponents = components.map(comp => {
      const name = (comp.component_name || comp.name || "").toLowerCase();
      const material = (comp.default_material || "").toLowerCase();
      
      let waste_rate = 0;

      // Logic của thợ sắt lành nghề (làm tròn số chẵn)
      if (name.includes('khung') || name.includes('đố') || name.includes('cánh')) {
        // Khung bao, đố cửa, khung cánh (thường dùng sắt hộp 40x80, 40x40, 50x100) 
        // Phải cắt góc 45 độ, nối, hoặc hao hụt đầu cây sắt dài 6m
        waste_rate = 6; 
      } else if (name.includes('nan') || name.includes('thanh') || name.includes('sắt hộp') || name.includes('thép hộp')) {
        // Nan dọc, nan ngang, chông (thường cắt đoạn ngắn nhiều, hao hụt cao hơn xíu)
        waste_rate = 8;
      } else if (name.includes('hoa văn') || name.includes('cnc') || name.includes('uốn')) {
        // Sắt nghệ thuật, CNC, cắt laser tôn tấm (hao tôn vát góc, hình thù phức tạp)
        waste_rate = 14; 
      } else if (name.includes('pano') || name.includes('tôn') || name.includes('tấm')) {
        // Bịt tôn, pano (cắt tấm to, dư viền)
        waste_rate = 10;
      } else if (name.includes('bản lề') || name.includes('khóa') || name.includes('chốt') || name.includes('tay nắm') || name.includes('ray') || name.includes('bánh xe')) {
        // Phụ kiện, linh kiện đúc sẵn (hao phí gần như không có, mua cái nào gắn cái đó)
        waste_rate = 0;
      } else {
        // Mặc định cho các loại linh kiện sắt khác
        waste_rate = 6;
      }

      // Có thể vật tư ghi đè logic
      if (material.includes('cnc') || material.includes('tấm')) {
        waste_rate = 12; // Ưu tiên material nếu là dạng cắt tấm
      }

      if (comp.waste_rate !== waste_rate) {
        hasChanges = true;
      }

      return {
        ...comp,
        waste_rate: waste_rate
      };
    });

    if (hasChanges) {
      await prisma.products.update({
        where: { id: product.id },
        data: {
          components: newComponents
        }
      });
      console.log(`Đã cập nhật sản phẩm ${product.product_code} (${product.product_name}) - ${newComponents.length} linh kiện`);
      updatedCount++;
    }
  }

  console.log(`Hoàn tất! Đã cập nhật hao phí cho ${updatedCount} sản phẩm.`);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
