const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DrawingService {
  // 1. Lấy danh sách bản vẽ theo Product ID
  async getDrawingsByProduct(productId) {
    return await prisma.product_drawings.findMany({
      where: { product_id: productId, is_active: true },
      include: { drawing_parts: true },
      orderBy: { created_at: 'desc' }
    });
  }

  // 2. Lấy chi tiết 1 bản vẽ
  async getDrawingById(drawingId) {
    return await prisma.product_drawings.findUnique({
      where: { id: drawingId },
      include: { 
        drawing_parts: true,
        products: { select: { product_name: true, product_code: true } }
      }
    });
  }

  // 3. Tạo mới Bản vẽ + Danh sách linh kiện (Nested Create)
  async createDrawing(data) {
    const { product_id, drawing_name, drawing_type, main_image_url, blueprint_image_url, scale_ratio, parts } = data;
    
    return await prisma.product_drawings.create({
      data: {
        product_id,
        drawing_name,
        drawing_type: drawing_type || "ASSEMBLY",
        main_image_url,
        blueprint_image_url,
        scale_ratio,
        drawing_parts: {
          create: parts && parts.length > 0 ? parts.map(part => ({
            component_name: part.component_name,
            part_image_url: part.part_image_url,
            material_category: part.material_category
          })) : []
        }
      },
      include: { drawing_parts: true }
    });
  }

  // 4. Cập nhật bản vẽ (Transaction: Cập nhật thông tin chung + Cập nhật lại list linh kiện)
  async updateDrawing(drawingId, data) {
    const { drawing_name, drawing_type, main_image_url, blueprint_image_url, scale_ratio, is_active, parts } = data;

    return await prisma.$transaction(async (tx) => {
      // Cập nhật Master
      const master = await tx.product_drawings.update({
        where: { id: drawingId },
        data: { drawing_name, drawing_type, main_image_url, blueprint_image_url, scale_ratio, is_active }
      });

      // Cập nhật Parts (Xóa cũ, Thêm mới cho sạch sẽ)
      if (parts && Array.isArray(parts)) {
        await tx.drawing_parts.deleteMany({ where: { drawing_id: drawingId } });
        if (parts.length > 0) {
          await tx.drawing_parts.createMany({
            data: parts.map(p => ({
              drawing_id: drawingId,
              component_name: p.component_name,
              part_image_url: p.part_image_url,
              material_category: p.material_category
            }))
          });
        }
      }

      return await tx.product_drawings.findUnique({
        where: { id: drawingId },
        include: { drawing_parts: true }
      });
    });
  }

  // 5. Xóa bản vẽ (Cascade sẽ tự động xóa các parts bên trong)
  async deleteDrawing(drawingId) {
    return await prisma.product_drawings.delete({
      where: { id: drawingId }
    });
  }
}

module.exports = new DrawingService();