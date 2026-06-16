const prisma = require("../models/prisma");

class OrderService {
  async getAllOrders() {
    return await prisma.orders.findMany({
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
            quotation_specs: true,
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getOrderById(id) {
    return await prisma.orders.findUnique({
      where: { id: id }, // Đã xóa parseInt(id)
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
            quotation_specs: true,
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
    });
  }

  async getMyOrders(userId) {
    return await prisma.orders.findMany({
      where: {
        OR: [{ user_id: userId }, { quotations: { user_id: userId } }],
      },
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: true,
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });
  }
  async createDirectOrder(userId, payload) {
    const { product_id, quantity, price } = payload;

    // 1. Tạo đơn hàng mới thẳng vào DB
    const newOrder = await prisma.orders.create({
      data: {
        users: { connect: { id: userId } },
        total_amount: price * quantity,
        order_code: `KPM-ORD-${Date.now()}`,
        production_status: "pending",
      },
    });

    // 2. Tạo chi tiết đơn hàng
    await prisma.order_items.create({
      data: {
        orders: { connect: { id: newOrder.id } },
        products: { connect: { id: product_id } },
        quantity: quantity,
        price: price,
      },
    });

    return newOrder;
  } // THÊM MỚI: Cập nhật thông tin giao hàng & các loại phí trước khi thanh toán
  async updateCheckoutInfo(orderId, userId, payload) {
    const {
      customer_name,
      customer_phone,
      shipping_address,
      order_notes,
      shipping_fee,
      installation_fee,
      final_total,
    } = payload;

    // Kiểm tra xem đơn hàng có tồn tại không
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error("Không tìm thấy đơn hàng để thanh toán!");

    // Cập nhật thông tin Snapshot vào DB
    return await prisma.orders.update({
      where: { id: orderId },
      data: {
        customer_name,
        customer_phone,
        shipping_address,
        order_notes,
        shipping_fee: shipping_fee || 0,
        installation_fee: installation_fee || 0,
        total_amount: final_total, // Trọng tâm: Cập nhật đè tổng tiền để MoMo/VNPay lấy đúng số này!
      },
    });
  }
}

module.exports = new OrderService();
