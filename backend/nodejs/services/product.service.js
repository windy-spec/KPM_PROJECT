const prisma = require("../models/prisma");

class ProductService {
  async createProduct(data) {
    // THÊM: Bắt lấy trường components từ req.body
    const {
      category_id,
      product_code,
      product_name,
      default_specs,
      components,
      base_price,
    } = data;

    if (!category_id) throw new Error("Vui lòng chọn danh mục (category_id)!");

    const categoryExists = await prisma.product_categories.findUnique({
      where: { id: category_id },
    });
    if (!categoryExists) throw new Error("Danh mục không tồn tại!");

    const existing = await prisma.products.findUnique({
      where: { product_code },
    });
    if (existing) throw new Error(`Mã sản phẩm '${product_code}' đã tồn tại!`);
    const formattedComponents = (components || []).map((comp) => ({
      ...comp,
      waste_rate: comp.waste_rate ? parseFloat(comp.waste_rate) : 0, // Mặc định hao phí là 0%
    }));
    return await prisma.products.create({
      data: {
        category_id,
        product_code,
        product_name,
        default_specs,
        components: formattedComponents || [], // Nhét components vào đây!
        base_price: base_price ? parseFloat(base_price) : 0,
      },
    });
  }

  async getProducts(query) {
    const { page = 1, limit = 10, search = "", category_id } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereCondition = {
      AND: [],
    };

    if (category_id && category_id !== "null" && category_id !== "undefined") {
      const categories = category_id.split(",");
      if (categories.length > 0) {
        whereCondition.AND.push({
          OR: [
            { category_id: { in: categories } },
            { product_categories: { parent_id: { in: categories } } },
          ],
        });
      }
    }
    if (search) {
      whereCondition.AND.push({
        OR: [
          { product_code: { contains: search, mode: "insensitive" } },
          { product_name: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (whereCondition.AND.length === 0) {
      delete whereCondition.AND;
    }

    const [products, totalItem] = await prisma.$transaction([
      prisma.products.findMany({
        where: whereCondition,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          product_categories: {
            select: {
              category_name: true,
              parent_id: true,
              parent_category: {
                select: { category_name: true },
              },
            },
          },
          product_images: {
            select: { id: true, image_url: true, is_primary: true },
            orderBy: { is_primary: "desc" },
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

  async updateProduct(id, data) {
    const {
      category_id,
      product_code,
      product_name,
      default_specs,
      components,
      base_price,
    } = data;

    const existing = await prisma.products.findUnique({ where: { id } });
    if (!existing) throw new Error("Sản phẩm không tồn tại");
    const formattedComponents = (components || []).map((comp) => ({
      ...comp,
      waste_rate: comp.waste_rate ? parseFloat(comp.waste_rate) : 0, // Mặc định hao phí là 0%
    }));
    return await prisma.products.update({
      where: { id },
      data: {
        category_id,
        product_code,
        product_name,
        default_specs,
        components: formattedComponents,
        base_price:
          base_price !== undefined ? parseFloat(base_price) : undefined,
      },
    });
  }

  async deleteProduct(id) {
    await prisma.products.findUniqueOrThrow({ where: { id } });
    return await prisma.products.delete({ where: { id } });
  }

  async addProductImage(productId, imageUrl, isPrimary = false) {
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

  async deleteProductImage(productId, imageId) {
    const image = await prisma.product_images.findFirst({
      where: { id: imageId, product_id: productId },
    });
    if (!image) throw new Error("Không tìm thấy ảnh!");

    // Nếu là ảnh chính, không cho xóa trực tiếp bằng route này (hoặc có thể tự xử lý logic)
    if (image.is_primary) {
      throw new Error("Không thể xóa ảnh chính của sản phẩm!");
    }

    return await prisma.product_images.delete({
      where: { id: imageId },
    });
  }

  async getProductById(id) {
    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        product_categories: true,
        product_images: { orderBy: { is_primary: "desc" } },
      },
    });
    if (!product) throw new Error("Không tìm thấy sản phẩm!");
    return product;
  }
}

module.exports = new ProductService();
