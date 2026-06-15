const prisma = require("../models/prisma");

class UserService {
  async getProfileStats(userId) {
    const ordersCount = await prisma.orders.count({
      where: {
        OR: [
          { user_id: userId },
          { quotations: { user_id: userId } }
        ]
      }
    });

    const transactions = await prisma.transactions.aggregate({
      _sum: { amount: true },
      where: {
        status: "success",
        OR: [
          { orders: { user_id: userId } },
          { quotations: { user_id: userId } }
        ]
      }
    });
    const totalSpent = transactions._sum.amount ? parseFloat(transactions._sum.amount) : 0;

    const pendingQuotationsCount = await prisma.quotations.count({
      where: {
        user_id: userId,
        status: { in: ["pending", "pending_admin"] }
      }
    });

    return {
      totalOrders: ordersCount,
      totalSpent: totalSpent,
      pendingQuotations: pendingQuotationsCount
    };
  }
}

module.exports = new UserService();
