const prisma = require("../models/prisma");

class ProductService {
  // 1. TẠO SẢN PHẨM MỚI
  async createProduct(data) {
    const { category_id, product_code, product_name, default_specs } = data;

    if (!category_id) throw new Error("Vui lòng chọn danh mục (category_id)!");

    // Kiểm tra danh mục có tồn tại không
    const categoryExists = await prisma.product_categories.findUnique({
      where: { id: category_id },
    });
    if (!categoryExists) throw new Error("Danh mục không tồn tại!");

    // Kiểm tra trùng mã sản phẩm
    const existing = await prisma.products.findUnique({
      where: { product_code },
    });
    if (existing) throw new Error(`Mã sản phẩm '${product_code}' đã tồn tại!`);

    return await prisma.products.create({
      data: { category_id, product_code, product_name, default_specs },
    });
  }

  // 2. LẤY DANH SÁCH (CÓ PHÂN TRANG, TÌM KIẾM, FILTER & ẢNH CHÍNH)
  async getProducts(query) {
    const { page = 1, limit = 10, search = "", category_id } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build điều kiện query linh hoạt
    const whereCondition = {};
    if (category_id) whereCondition.category_id = category_id;
    if (search) {
      whereCondition.OR = [
        { product_code: { contains: search, mode: "insensitive" } },
        { product_name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Lấy data và tổng số lượng cùng lúc (Tối ưu tốc độ)
    const [products, totalItem] = await prisma.$transaction([
      prisma.products.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          product_categories: { select: { category_name: true } },
          product_images: {
            where: { is_primary: true }, // Chỉ lấy ảnh được set làm Thumbnail
            take: 1,
            select: { id: true, image_url: true },
          },
        },
      }),
      prisma.products.count({ where: whereCondition }),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItem,
        totalPage: Math.ceil(totalItem / Number(limit)),
      },
    };
  }

  // 3. CẬP NHẬT SẢN PHẨM
  async updateProduct(id, data) {
    const { category_id, product_code, product_name, default_specs } = data;

    const existing = await prisma.products.findUnique({ where: { id } });
    if (!existing) throw new Error("Sản phẩm không tồn tại");

    if (product_code && product_code !== existing.product_code) {
      const codeConflict = await prisma.products.findUnique({
        where: { product_code },
      });
      if (codeConflict)
        throw new Error("Mã sản phẩm mới đã bị trùng với sản phẩm khác!");
    }

    return await prisma.products.update({
      where: { id },
      data: { category_id, product_code, product_name, default_specs },
    });
  }

  // 4. XÓA SẢN PHẨM
  async deleteProduct(id) {
    const existing = await prisma.products.findUnique({ where: { id } });
    if (!existing) throw new Error("Sản phẩm không tồn tại");

    return await prisma.products.delete({ where: { id } });
  }

  // 5. THÊM ẢNH CHO SẢN PHẨM (SAU KHI UPLOAD LÊN CLOUDINARY)
  async addProductImage(productId, imageUrl, isPrimary = false) {
    const product = await prisma.products.findUnique({
      where: { id: productId },
    });
    if (!product) throw new Error("Sản phẩm không tồn tại!");

    // Nếu ảnh này làm ảnh chính, phải gỡ cờ 'primary' của các ảnh cũ
    if (isPrimary) {
      await prisma.product_images.updateMany({
        where: { product_id: productId },
        data: { is_primary: false },
      });
    }

    return await prisma.product_images.create({
      data: {
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary,
      },
    });
  }
  
}

module.exports = new ProductService();
