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
  }
}

module.exports = new OrderService();
