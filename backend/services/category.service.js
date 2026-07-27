const prisma = require("../models/prisma");

class CategoryService {
  async createCategory(data) {
    const { category_code, category_name, description, parent_id } = data;

    const existing = await prisma.product_categories.findUnique({
      where: { category_code },
    });
    if (existing) throw new Error(`Mã danh mục '${category_code}' đã tồn tại!`);

    if (parent_id) {
      const parentCat = await prisma.product_categories.findUnique({
        where: { id: parent_id },
      });
      if (!parentCat) throw new Error("Danh mục cha không tồn tại!");
      if (parentCat.parent_id)
        throw new Error("Chỉ hỗ trợ tối đa 2 cấp danh mục!");
    }

    return await prisma.product_categories.create({
      data: {
        category_code,
        category_name,
        description,
        parent_id: parent_id || null,
      },
    });
  }

  async getAllCategories() {
    // Lấy danh sách danh mục, lồng luôn danh mục con vào trong danh mục cha
    return await prisma.product_categories.findMany({
      where: { parent_id: null }, // Lấy gốc
      include: { sub_categories: true },
      orderBy: { created_at: "desc" },
    });
  }

  async updateCategory(id, data) {
    const { category_code, category_name, description, parent_id } = data;

    const existing = await prisma.product_categories.findUnique({
      where: { id },
    });
    if (!existing) throw new Error("Danh mục không tồn tại!");

    if (category_code && category_code !== existing.category_code) {
      const codeConflict = await prisma.product_categories.findUnique({
        where: { category_code },
      });
      if (codeConflict) throw new Error("Mã danh mục mới đã bị trùng!");
    }

    if (parent_id) {
      if (parent_id === id)
        throw new Error("Danh mục không thể là cha của chính nó!");
      const parentCat = await prisma.product_categories.findUnique({
        where: { id: parent_id },
      });
      if (!parentCat) throw new Error("Danh mục cha không tồn tại!");
      if (parentCat.parent_id)
        throw new Error("Chỉ hỗ trợ tối đa 2 cấp danh mục!");

      const hasSub = await prisma.product_categories.findFirst({
        where: { parent_id: id },
      });
      if (hasSub)
        throw new Error(
          "Không thể chuyển thành danh mục con vì danh mục này đang chứa các danh mục con khác!",
        );
    }

    return await prisma.product_categories.update({
      where: { id },
      data: {
        category_code,
        category_name,
        description,
        parent_id: parent_id || null,
      },
    });
  }

  async deleteCategory(id) {
    const linkedProducts = await prisma.products.findFirst({
      where: { category_id: id },
    });
    if (linkedProducts)
      throw new Error("Không thể xóa! Đang có sản phẩm thuộc danh mục này.");

    // Kiểm tra xem có danh mục con không
    const hasSub = await prisma.product_categories.findFirst({
      where: { parent_id: id },
    });
    if (hasSub)
      throw new Error("Không thể xóa! Hãy xóa các danh mục con trước.");

    return await prisma.product_categories.delete({ where: { id } });
  }
  // 3. Thêm mới dữ liệu: Viết logic tạo một Danh mục sản phẩm mới (product_categories).
  // Yêu cầu: Nếu tên danh mục đã tồn tại trong DB thì báo lỗi, không cho tạo.
  async createCategoryUnique(data) {
    const { category_code, category_name } = data;
    const exists = await prisma.product_categories.findFirst({
      where: { category_name: category_name },
    });
    if (exists) {
      throw new Error(`Tên danh mục '${category_name}' đã tồn tại!`);
    }
    const newCate = await prisma.product_categories.create({
      data: {
        category_code: category_code,
        category_name: category_name,
      },
    });
    return newCate;
  }
  // 📝 Bài tập 1: Thêm Mới (Create) - Mức độ Cơ bản
  // Tình huống: Cần viết một hàm tạo mới Danh mục sản phẩm (Category).
  // Đề bài: Viết hàm async createCategory(data)
  // Lấy category_code và category_name ra từ biến data.
  // Yêu cầu bảo vệ: Phải bắt buộc có CẢ HAI trường này.
  // Nếu người dùng (Frontend) quên gửi tên hoặc quên gửi mã,
  // lập tức quăng lỗi (throw Error): "Vui lòng điền đầy đủ Mã và Tên danh mục!".
  // Nếu đầy đủ, dùng prisma.product_categories.create(...) để lưu vào DB và trả về kết quả.
  async createCus(data) {
    const { category_code, category_name } = data;
    if (data.category_code === undefined || data.category_name === undefined) {
      {
        throw new Error("Vui lòng điền đầy đủ Mã và Tên danh mục!");
      }
    }
    const newCate = await prisma.product_categories.create({
      data: {
        category_code: category_code,
        category_name: category_name,
      },
    });
    return newCate;
  }
}

module.exports = new CategoryService();
