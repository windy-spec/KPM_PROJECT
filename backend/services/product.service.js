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
      waste_configs: comp.waste_configs || {}, // Lưu nguyên object cấu hình tiêu hao tuyệt đối
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

  // 50spham => 11 -> từ trên xuống 1 -> 50 => 11 -> 50
  // lấy danh sách sắp xếp ngày bth => skip 10 -> take 11-> 50

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
    // 8. Tìm kiếm chuỗi (Search): Sửa lại hàm lấy danh sách sản phẩm sao cho hỗ trợ
    // tìm kiếm gần đúng (nhập "bàn" sẽ ra "Bàn làm việc"). Gợi ý: Dùng contains.
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
          product_drawings: {
            include: {
              drawing_parts: true,
            },
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
      waste_configs: comp.waste_configs || {}, // Lưu nguyên object cấu hình tiêu hao tuyệt đối
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
  // 5. Xoá dữ liệu an toàn: Viết hàm xoá một Sản phẩm (products).
  // Trước khi xoá, hãy kiểm tra xem sản phẩm đó có đang nằm trong đơn hàng nào không,
  // nếu có thì chặn không cho xoá và ném ra lỗi throw new Error(...).
  async safeDelete(id) {
    const exists = await prisma.products.findUnique({
      where: { id: id },
      include: {
        order_items: true,
      },
    });
    if (exists.order_items.length > 0) {
      throw new Error("Sản phẩm đang tồn tại trong đơn hàng, không thể xoá!");
    }
    const deletePro = await prisma.products.delete({
      where: { id: id },
    });
    return deletePro;
  }
  // 7. Nested Select (Chọn lọc dữ liệu): Viết một hàm lấy danh sách Sản phẩm.
  // Yêu cầu: Chỉ lấy cột id, product_name, base_price và mảng hình ảnh (product_images)
  // nhưng chỉ lấy đường link ảnh (image_url). KHÔNG được lấy các cột thừa thãi khác.
  async getProductsWithImages() {
    const products = await prisma.products.findMany({
      select: {
        base_price: true,
        product_name: true,
        id: true,
        product_images: {
          select: {
            image_url: true,
          },
        },
      },
    });
    return products;
  }
  // 8. Tìm kiếm chuỗi (Search):
  // Sửa lại hàm lấy danh sách sản phẩm sao cho hỗ trợ tìm kiếm gần đúng
  // (nhập "bàn" sẽ ra "Bàn làm việc"). Gợi ý: Dùng contains.
  async getProductContain(keyword) {
    const products = await prisma.products.findMany({
      where: {
        product_name: { contains: keyword, mode: "insensitive" },
      },
    });
    return products;
  }
  // 14. Lọc phức tạp (AND / OR):
  // Viết API tìm kiếm Sản phẩm (products) thỏa mãn ĐỒNG THỜI 2 điều kiện:
  // Giá cơ bản (base_price) lớn hơn 100,000.
  // Tên sản phẩm chứa chữ "Gỗ" HOẶC chứa chữ "Kính".
  // Gợi ý: Bọc điều kiện trong mảng AND: [ { ... }, { OR: [...] } ].
  async filterProducts() {
    const productss = await prisma.products.findMany({
      where: {
        AND: [
          { base_price: { gt: 100000 } },
          {
            OR: [
              { product_name: { contains: "Gỗ", mode: "insensitive" } },
              { product_name: { contains: "Kính", mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        base_price: true,
        product_name: true,
      },
    });
    if (productss.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào thỏa mãn điều kiện!");
    }
    return productss;
  }
  async getAllP1() {
    const products = await prisma.products.findMany({
      select: {
        id: true,
        product_name: true,
      },
    });
    return products;
  }
  async getAllP2() {
    const products = await prisma.products.findMany({
      take: 3,
      select: {
        id: true,
        product_name: true,
      },
    });
    return products;
  }
  // Lấy mảng product, sau đó lọc qua có điều kiện => rồi trả về mảng xong return
  async getProductConditionAndReturn() {
    const list = await prisma.products.findMany({});
    if (list.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào thỏa mãn điều kiện!");
    } else {
      const A = [];
      for (const product of list) {
        if (product.base_price > 100000) {
          A.push(product);
        }
      }
      return A;
    }
  }
  // Update product với những thông số tuỳ chỉnh
  async updateProductCustom(data) {
    const { id, product_code, product_name, description, base_price } = data;
    if (data === null || data === undefined) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    const exists = await prisma.products.findUnique({
      where: { id: id },
    });
    if (!exists) {
      throw new Error("Sản phẩm không tồn tại");
    }
    const update = await prisma.products.update({
      where: { id: id },
      data: {
        product_code: product_code,
        product_name: product_name,
        description: description,
        base_price: base_price,
      },
    });
    return update;
  }
  // 🔍 Bài tập 2: Đọc dữ liệu linh hoạt (Read / Lọc dữ liệu) - Độ khó: ⭐⭐⭐
  // Tình huống: Viết tính năng lọc sản phẩm ở trang danh sách (Có thanh tìm kiếm, và bộ lọc giá).
  // Đề bài: Viết hàm async getProductsWithFilter(query)
  // query là dữ liệu lấy từ URL, có thể có hoặc không có các trường sau: search (từ khóa),
  // min_price (giá thấp nhất), max_price (giá cao nhất).
  // Yêu cầu: Hãy tạo ra một cái object tên là whereCondition (hoặc where tuỳ bạn đặt).
  // Bạn dùng lệnh if để nhét dần các điều kiện vào cái Object đó:
  // Nếu query có gửi chữ search: Tìm các sản phẩm có product_name chứa từ khóa đó
  // (Gợi ý Prisma: Dùng lệnh contains).
  // Nếu query có gửi min_price: Điều kiện giá >= min_price (Gợi ý Prisma: gte).
  // Nếu query có gửi max_price: Điều kiện giá <= max_price (Gợi ý Prisma: lte).
  // Cuối cùng, nhét cái biến whereCondition đó vào lệnh
  // prisma.products.findMany({ where: whereCondition }) và trả về kết quả.
  async readProCus(query) {
    if (!query) {
      throw new Error("Query không hợp lệ!");
    }
    const { search, min_price, max_price } = query;
    const Con = [];
    if (search) {
      Con.product_name = { contains: search, mode: "insensitive" };
    }
    if (min_price || max_price) {
      Con.base_price = {};
    }
    if (min_price) {
      Con.base_price = { gte: parseFloat(min_price) };
    }
    if (max_price) {
      Con.base_price = { lte: parseFloat(max_price) };
    }
    const getQuerry = await prisma.products.findMany({
      where: Con,
    });
    return getQuerry;
  }
  async getProductandCate() {
    const proCate = await prisma.products.findMany({
      take: 3,
      select: {
        id: true,
        product_name: true,
        include: {
          product_categories: {},
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    return proCate;
  }
  async updatePro(id, data) {
    if (!data) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    const { product_code, product_name, description, base_price } = data;
    const exists = await prisma.products.findUnique({
      where: { id: id },
    });
    if (!exists) {
      throw new Error("Sản phẩm không tồn tại");
    }
    const update = await prisma.products.update({
      where: { id: id },
      data: {
        product_code: product_code, // product_code:undefined => posstman: product_id
        product_name: product_name, // 2
        description: description, // 3
        base_price: base_price, // undefined, undefined
      },
    });
    return update;
  }
  async createPro(data) {
    if (!data) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    const { category_id, product_code, product_name, description, base_price } =
      data;
    if (!category_id) throw new Error("Vui lòng chọn danh mục (category_id)!");
    const categoryExists = await prisma.product_categories.findUnique({
      where: { id: category_id },
    });
    if (!categoryExists) throw new Error("Danh mục không tồn tại!");
    const existing = await prisma.products.findUnique({
      where: { product_code },
    });
    if (existing) throw new Error("Mã sản phẩm đã tồn tại!");
    const product = await prisma.products.create({
      data: {
        category_id,
        product_code,
        product_name,
        description,
        base_price: base_price ? parseFloat(base_price) : 0,
      },
    });
    return product;
  }
  //
  async createPro1(data) {
    if (!data) {
      throw new Error("Dữ liệu không hợp lệ!");
    }
    const { product_code, product_name, description } = data;
    const exists = await prisma.products.findUnique({
      where: { product_code: product_code },
    });
    if (exists) {
      throw new Error("Mã sản phẩm đã tồn tại!");
    }
    const create = await prisma.products.create({
      data: {
        product_code: product_code,
        product_name: product_name,
        description: description,
      },
    });
    return create;
  }
}

module.exports = new ProductService();

// upsert => where -> create -> update
// unique -> tìm 1 -> where
// many -> lấy hết hoặc điều kiện
// update -> where
// create
// delete -> where
