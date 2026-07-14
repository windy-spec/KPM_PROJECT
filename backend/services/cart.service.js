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
              select: { title: true, status: true, quotation_specs: true, quotation_attachments: true, nick_name: true },
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
    cart.cart_items.forEach(item => {
      if (item.quotations && item.quotations.quotation_specs) {
        item.quotations.quotation_specs.forEach(spec => {
          if (spec.dimensions?.product_id) {
            customProductIds.push(spec.dimensions.product_id);
          }
        });
      }
    });

    if (customProductIds.length > 0) {
      const allImages = await prisma.product_images.findMany({
        where: { product_id: { in: customProductIds }, is_primary: true }
      });
      const imgMap = {};
      allImages.forEach(img => {
        if (!imgMap[img.product_id]) imgMap[img.product_id] = [];
        imgMap[img.product_id].push(img);
      });

      cart.cart_items.forEach(item => {
        if (item.quotations && item.quotations.quotation_specs) {
          const ids = item.quotations.quotation_specs
            .map(s => s.dimensions?.product_id)
            .filter(Boolean);
          item.quotations.product_images = ids.flatMap(id => imgMap[id] || []);
        }
      });
    }

    return cart;
  }

  // 2. THÊM VÀO GIỎ HÀNG (Hỗ trợ cả Hàng thường & Hàng Custom)
  async addToCart(userId, data) {
    const { product_id, quotation_id, quantity = 1, price } = data;

    // Lấy giỏ hàng hiện tại
    const cart = await this.getCart(userId);

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
      // Nếu có rồi thì tăng quantity
      return await prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      // Nếu chưa có thì thêm mới
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
}

module.exports = new CartService();
