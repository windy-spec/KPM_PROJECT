const prisma = require("../models/prisma");

class OrderService {
  async getAllOrders() {
    return await prisma.orders.findMany({
      include: {
        users: { select: { id: true, username: true, email: true, phone: true } },
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true, phone: true } },
            quotation_specs: true
          }
        },
        order_items: {
          include: {
            products: true
          }
        },
        transactions: true,
        invoices: true,
        order_tracking: true
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getOrderById(id) {
    return await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: { select: { id: true, username: true, email: true, phone: true } },
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true, phone: true } },
            quotation_specs: true
          }
        },
        order_items: {
          include: {
            products: true
          }
        },
        transactions: true,
        invoices: true,
        order_tracking: true
      }
    });
  }

  async getMyOrders(userId) {
    return await prisma.orders.findMany({
      where: { 
        OR: [
          { user_id: userId },
          { quotations: { user_id: userId } }
        ]
      },
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, username: true, email: true, phone: true } },
        quotations: true,
        order_items: {
          include: {
            products: true
          }
        }
      }
    });
  }
}

module.exports = new OrderService();
