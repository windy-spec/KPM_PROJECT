const prisma = require("../models/prisma");

class CategoryService {
  // 1. TẠO MỚI DANH MỤC
  async createCategory(data) {
    const { category_code, category_name, description } = data;

    const existing = await prisma.product_categories.findUnique({
      where: { category_code },
    });
    if (existing) throw new Error(`Mã danh mục '${category_code}' đã tồn tại!`);

    return await prisma.product_categories.create({
      data: { category_code, category_name, description },
    });
  }

  // 2. LẤY TẤT CẢ DANH MỤC
  async getAllCategories() {
    return await prisma.product_categories.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  // 3. CẬP NHẬT DANH MỤC (SỬA)
  async updateCategory(id, data) {
    const { category_code, category_name, description } = data;

    // Kiểm tra danh mục có tồn tại không
    const existing = await prisma.product_categories.findUnique({
      where: { id },
    });
    if (!existing) throw new Error("Danh mục không tồn tại!");

    // Nếu muốn đổi mã Code, phải kiểm tra xem mã mới có trùng với danh mục khác không
    if (category_code && category_code !== existing.category_code) {
      const codeConflict = await prisma.product_categories.findUnique({
        where: { category_code },
      });
      if (codeConflict)
        throw new Error("Mã danh mục mới đã bị trùng với một danh mục khác!");
    }

    return await prisma.product_categories.update({
      where: { id },
      data: { category_code, category_name, description },
    });
  }

  // 4. XÓA DANH MỤC (XÓA)
  async deleteCategory(id) {
    // Chốt chặn bảo vệ: Kiểm tra xem có sản phẩm nào đang bám vào danh mục này không
    const linkedProducts = await prisma.products.findFirst({
      where: { category_id: id },
    });

    if (linkedProducts) {
      throw new Error(
        "Không thể xóa! Đang có sản phẩm thuộc danh mục này. Vui lòng chuyển sản phẩm sang danh mục khác trước khi xóa.",
      );
    }

    return await prisma.product_categories.delete({
      where: { id },
    });
  }
}

module.exports = new CategoryService();
