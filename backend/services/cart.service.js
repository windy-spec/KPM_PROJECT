const prisma = require("../models/prisma");

class CartService {
  // 1. LẤY GIỎ HÀNG CỦA USER (Nếu chưa có thì tự động tạo mới)
  async getCart(userId) {
    let cart = await prisma.shopping_carts.findFirst({
      where: { user_id: userId },
      include: {
        cart_items: {
          include: {
            products: {
              select: {
                product_name: true,
                product_code: true,
                product_images: { where: { is_primary: true } },
              },
            },
            quotations: {
              select: {
                title: true,
                status: true,
                quotation_specs: true,
                quotation_attachments: true,
                nick_name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    // Nếu user chưa có giỏ hàng, tạo mới cho họ
    if (!cart) {
      cart = await prisma.shopping_carts.create({
        data: { user_id: userId },
        include: { cart_items: true },
      });
      return cart;
    }

    // MAP base product images cho hàng Custom
    const customProductIds = [];
    cart.cart_items.forEach((item) => {
      if (item.quotations && item.quotations.quotation_specs) {
        item.quotations.quotation_specs.forEach((spec) => {
          if (spec.dimensions?.product_id) {
            customProductIds.push(spec.dimensions.product_id);
          }
        });
      }
    });

    if (customProductIds.length > 0) {
      const allImages = await prisma.product_images.findMany({
        where: { product_id: { in: customProductIds }, is_primary: true },
      });
      const imgMap = {};
      allImages.forEach((img) => {
        if (!imgMap[img.product_id]) imgMap[img.product_id] = [];
        imgMap[img.product_id].push(img);
      });

      cart.cart_items.forEach((item) => {
        if (item.quotations && item.quotations.quotation_specs) {
          const ids = item.quotations.quotation_specs
            .map((s) => s.dimensions?.product_id)
            .filter(Boolean);
          item.quotations.product_images = ids.flatMap(
            (id) => imgMap[id] || [],
          );
        }
      });
    }

    return cart;
  }

  // 2. THÊM VÀO GIỎ HÀNG (Hỗ trợ cả Hàng thường & Hàng Custom)
  async addToCart(userId, data) {
    // Bài 1: Giới hạn số lượng mua tối đa (Chống spam)
    // Vị trí: Trong file cart.service.js, hàm addToCart(userId, data).
    // Tình huống: Có một số khách hàng rảnh rỗi bấm thêm 1
    // sản phẩm vào giỏ hàng với số lượng 9999 gây rác database.
    // Yêu cầu: Ngay trên dòng const cart = await this.getCart(userId); (dòng 76),
    //  bạn hãy viết 1 câu lệnh if kiểm tra:
    // Nếu số lượng (quantity) người dùng gửi lên lớn hơn 10.
    // Hãy dùng throw new Error("Mỗi lần chỉ được thêm tối đa 10 sản phẩm!"); để chặn lại.

    const { product_id, quotation_id, quantity = 1, price } = data;
    if (product_id === undefined) {
      throw new Error("Thiếu ID sản phẩm,");
    }
    if (quotation_id === undefined) {
      throw new Error("Thiếu ID báo giá,");
    }
    // Lấy giỏ hàng hiện tại
    const cart = await this.getCart(userId);
    if (isNaN(quantity)) {
      throw new Error("Số lượng không hợp lệ!");
    }
    // Kiểm tra xem món hàng này đã có trong giỏ chưa (để tăng số lượng)
    let existingItem = null;
    if (product_id) {
      existingItem = await prisma.cart_items.findFirst({
        where: { cart_id: cart.id, product_id },
      });
    } else if (quotation_id) {
      existingItem = await prisma.cart_items.findFirst({
        where: { cart_id: cart.id, quotation_id },
      });
    }

    if (existingItem) {
      let total = existingItem.quantity + Number(quantity);
      if (total === 3) {
        total++;
      }
      // Nếu có rồi thì tăng quantity
      return await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { quantity: total },
      });
    } else {
      // Nếu chưa có thì thêm mới
      if (quantity > 10) {
        throw new Error("Mỗi lần chỉ được thêm tối đa 10 sản phẩm!");
      } else {
        return await prisma.cart_items.create({
          data: {
            cart_id: cart.id,
            product_id: product_id || null,
            quotation_id: quotation_id || null,
            quantity: Number(quantity),
            price: price, // FE truyền giá lên (Giá gốc của product hoặc total_price của quotation)
          },
        });
      }
    }
  }

  // 3. CẬP NHẬT SỐ LƯỢNG MÓN HÀNG
  async updateQuantity(userId, itemId, quantity) {
    // Đảm bảo item này nằm trong giỏ của user này
    const cart = await this.getCart(userId);
    const item = await prisma.cart_items.findFirst({
      where: { id: itemId, cart_id: cart.id },
    });

    if (!item) throw new Error("Món hàng không tồn tại trong giỏ!");

    if (Number(quantity) <= 0) {
      // Nếu số lượng <= 0 thì xóa luôn khỏi giỏ
      return await prisma.cart_items.delete({ where: { id: itemId } });
    }

    return await prisma.cart_items.update({
      where: { id: itemId },
      data: { quantity: Number(quantity) },
    });
  }

  // 4. XÓA MÓN HÀNG KHỎI GIỎ
  async removeItem(userId, itemId) {
    const cart = await this.getCart(userId);
    const item = await prisma.cart_items.findFirst({
      where: { id: itemId, cart_id: cart.id },
    });
    if (!item) throw new Error("Món hàng không tồn tại trong giỏ!");

    return await prisma.cart_items.delete({ where: { id: itemId } });
  }

  // 5. GỬI YÊU CẦU BÁO GIÁ HOẶC TẠO ĐƠN HÀNG (Submit Cart)
  async submitCart(userId) {
    const cart = await this.getCart(userId);
    if (!cart.cart_items || cart.cart_items.length === 0) {
      throw new Error("Giỏ hàng đang trống, không thể thanh toán!");
    }

    // Phân loại giỏ hàng: Hàng Custom (có quotation_id) và Hàng Thường (có product_id)
    const customItems = cart.cart_items.filter(
      (item) => item.quotation_id !== null,
    );
    const normalItems = cart.cart_items.filter(
      (item) => item.product_id !== null,
    );
    if (customItems.length > 0 && normalItems.length > 0) {
      throw new Error(
        "Không thể thanh toán chung hàng thường và hàng thiết kế. Vui lòng tách thành 2 lần thanh toán!",
      );
    }
    const quotationIdsToSubmit = customItems.map((item) => item.quotation_id);

    return await prisma.$transaction(async (tx) => {
      // 5.1. Chuyển trạng thái các Quotation (Hàng custom) từ 'draft/favorite' sang 'pending_admin'
      if (quotationIdsToSubmit.length > 0) {
        await tx.quotations.updateMany({
          where: { id: { in: quotationIdsToSubmit } },
          data: { status: "pending_admin" }, // Gửi cho admin duyệt
        });
      }

      let newOrder = null;
      // 5.2. Hàng thường -> Sinh ra Order trực tiếp
      if (normalItems.length > 0) {
        const orderCode =
          "ORD-" +
          Math.floor(1000 + Math.random() * 9000) +
          "-" +
          new Date().getFullYear();

        // Tính tổng tiền hàng thường
        let totalAmount = 0;
        const orderItemsData = normalItems.map((item) => {
          const itemTotal = Number(item.quantity) * Number(item.price);
          totalAmount += itemTotal;
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          };
        });

        // Tạo Order
        newOrder = await tx.orders.create({
          data: {
            user_id: userId,
            order_code: orderCode,
            total_amount: totalAmount,
            production_status: "pending_payment", // Hàng có sẵn thì confirmed luôn
            order_items: {
              create: orderItemsData,
            },
          },
        });
      }

      // 5.3. Xóa sạch giỏ hàng sau khi đã xử lý xong
      await tx.cart_items.deleteMany({
        where: { cart_id: cart.id },
      });

      let message = "";
      if (customItems.length > 0 && normalItems.length > 0) {
        message =
          "Gửi yêu cầu hàng tùy chỉnh thành công! Hàng có sẵn đã được lên đơn, vui lòng thanh toán.";
      } else if (customItems.length > 0) {
        message =
          "Gửi yêu cầu báo giá thành công! Vui lòng chờ xưởng phản hồi.";
      } else {
        message = "Lên đơn hàng thành công! Vui lòng tiến hành thanh toán.";
      }

      return {
        message,
        order_id: newOrder ? newOrder.id : null, // Trả về order_id để gọi API thanh toán luôn
      };
    });
  }
  // 15. Cập nhật hoặc Thêm mới (Upsert):
  // Viết logic thêm Sản phẩm vào Giỏ hàng (cart_items). Yêu cầu:
  // Nếu sản phẩm đó ĐÃ CÓ trong giỏ hàng 👉 Tăng số lượng (quantity) lên 1.
  // Nếu CHƯA CÓ 👉 Tạo bản ghi mới vào giỏ hàng.
  // Gợi ý: Không dùng If/Else kiểm tra dài dòng, hãy dùng thẳng hàm prisma.cart_items.upsert.
  async upsertItem(cartId, productId) {
    const cart = await prisma.shopping_carts.upsert({
      where: { cart_id: cartId, product_id: productId },
    });
  }
  //   🛒 Bài tập 1: Thêm vào giỏ hàng (Create / Upsert) - Độ khó: ⭐⭐⭐
  // Tình huống: Khi khách hàng bấm nút "Thêm vào giỏ hàng", bạn phải xử lý logic nhập dữ liệu.
  // Đề bài: Viết hàm async addToCart(userId, data)
  // data bao gồm: product_id và quantity (Số lượng).
  // Điều kiện 1 (Khiên): Data phải hợp lệ, quantity phải > 0.
  // Điều kiện 2 (Check DB): Phải dùng findUnique hoặc findFirst
  // kiểm tra xem cái product_id kia có thật sự tồn tại trong bảng products không?
  // Nếu nhập bậy mã sản phẩm không có -> Quăng lỗi "Sản phẩm không tồn tại".
  // Điều kiện 3 (Logic lồng - Quan trọng nhất): Bạn phải kiểm tra xem trong bảng giỏ hàng (cart_items),
  //  cái userId này đã từng thêm product_id này vào giỏ chưa?
  // 🔄 Nếu CÓ RỒI: Không được tạo mới, mà phải dùng lệnh Update để cộng dồn số lượng.
  // (Ví dụ: Đã có 2 cái, thêm 1 cái -> Update thành 3).
  // 🆕 Nếu CHƯA CÓ: Dùng lệnh Create để tạo mới một record vào giỏ hàng.
  async createCartCus(userId, data) {
    if (!data) {
      throw new Error("Dữ liệu không hợp lệ, vui lòng kiểm tra lại!");
    }
    const { product_id, quantity } = data;
    if (data.quantity <= 0) {
      throw new Error("Số lượng phải lớn hơn 0!");
    }
    const existsPro = await prisma.products.findFirst({
      where: { id: product_id },
    });
    if (!existsPro) {
      throw new Error("Sản phẩm không tồn tại");
    }
    const existsShop = await prisma.shopping_carts.findFirst({
      where: { user_id: userId },
    });
    if (!existsShop) {
      const createShop = await prisma.shopping_carts.create({
        data: { user_id: userId },
      });
      const newCart = await prisma.cart_items.create({
        data: {
          cart_id: existsShop.id,
          product_id: product_id,
          quantity: quantity,
        },
      });
      return newCart;
    } else {
      // Vì đã có giỏ hàng, nên ta dùng upsert ĐÚNG CÚ PHÁP
      const upsertCart = await prisma.cart_items.upsert({
        where: {
          // 3.1 TÌM Ở ĐÂU?
          cart_id_product_id: {
            cart_id: existsShop.id,
            product_id: product_id,
          },
        },
        update: {
          // 3.2 NẾU TÌM THẤY THÌ SỬA THẾ NÀO? (Cộng dồn)
          quantity: { increment: quantity },
        },
        create: {
          // 3.3 NẾU KHÔNG TÌM THẤY THÌ TẠO THẾ NÀO?
          cart_id: existsShop.id,
          product_id: product_id,
          quantity: quantity,
        },
      });
      return upsertCart;
    }
  }
}

module.exports = new CartService();
