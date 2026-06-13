const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndCheck() {
  try {
    // 1. Delete the 3 old subcategories of NhaTienChe
    const codesToDelete = [
      'NhaTienChe-xuong-kho-bai',
      'NhaTienChe-khong-gian-dich-vu',
      'NhaTienChe-hang-muc-san'
    ];

    const deleteResult = await prisma.product_categories.deleteMany({
      where: {
        category_code: {
          in: codesToDelete
        }
      }
    });
    console.log(`✅ Đã xóa ${deleteResult.count} danh mục cũ của Nhà Tiền Chế.`);

    // 2. Check product images
    const images = await prisma.product_images.findMany({
      include: {
        products: {
          select: {
            product_code: true
          }
        }
      }
    });

    console.log(`\n🔎 Đang kiểm tra ${images.length} hình ảnh trong database...`);
    let errors = 0;
    
    for (const img of images) {
      if (!img.image_url || img.image_url.trim() === '') {
        console.log(`- ⚠️ Sản phẩm [${img.products?.product_code}] có ID ảnh [${img.id}] bị trống URL.`);
        errors++;
      } else if (!img.image_url.startsWith('http://') && !img.image_url.startsWith('https://')) {
        console.log(`- ⚠️ Sản phẩm [${img.products?.product_code}] có URL ảnh không hợp lệ (không chứa http/https): ${img.image_url}`);
        errors++;
      }
    }

    if (errors === 0) {
      console.log('✅ Tuyệt vời! Tất cả hình ảnh hiện tại đều có URL hợp lệ.');
    } else {
      console.log(`❌ Phát hiện ${errors} lỗi hình ảnh.`);
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndCheck();
