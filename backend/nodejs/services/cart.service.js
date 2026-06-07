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
              select: { title: true, status: true, quotation_specs: true },
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

  // 5. GỬI YÊU CẦU BÁO GIÁ CHO ADMIN CHỐT (Submit Cart)
  async submitCart(userId) {
    const cart = await this.getCart(userId);
    if (!cart.cart_items || cart.cart_items.length === 0) {
      throw new Error("Giỏ hàng đang trống, không thể gửi yêu cầu!");
    }

    // Tách riêng các ID của Hàng Custom để update
    const quotationIdsToSubmit = cart.cart_items
      .filter((item) => item.quotation_id !== null)
      .map((item) => item.quotation_id);

    return await prisma.$transaction(async (tx) => {
      // 5.1. Chuyển trạng thái các Quotation (Hàng custom) từ 'draft/favorite' sang 'pending'
      if (quotationIdsToSubmit.length > 0) {
        await tx.quotations.updateMany({
          where: { id: { in: quotationIdsToSubmit } },
          data: { status: "pending" },
        });
      }

      // 5.2. Đối với các Sản phẩm thường (Chỉ có product_id), FE có thể tạo quotation lúc add vào giỏ,
      // Hoặc tạo mới một quotation chung cho các sản phẩm thường ở đây.
      // Tạm thời luồng này: Gửi các custom quotation cho xưởng trước.

      // 5.3. Xóa sạch giỏ hàng sau khi đã gửi đi
      await tx.cart_items.deleteMany({
        where: { cart_id: cart.id },
      });

      return {
        message: "Gửi yêu cầu báo giá thành công! Vui lòng chờ xưởng phản hồi.",
      };
    });
  }
}

module.exports = new CartService();
