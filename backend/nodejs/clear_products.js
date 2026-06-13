const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearProducts() {
  try {
    const deletedProducts = await prisma.products.deleteMany({});
    console.log(`✅ Đã xóa thành công ${deletedProducts.count} sản phẩm.`);
    console.log(`✅ Toàn bộ hình ảnh đi kèm (product_images) cũng đã tự động bị xóa (nhờ thiết lập onDelete: Cascade trong DB).`);
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearProducts();
