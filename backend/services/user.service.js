const prisma = require("../models/prisma");

class UserService {
  async getProfileStats(userId) {
    // 1. Lấy số lượng tư vấn AI
    const countAI = await prisma.ai_chat_sessions.count({
      where: { user_id: userId },
    });
    // 2. Lấy 5 đơn hàng mới nhất của user
    const getFiveOrders = await prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        order_code: true,
        production_status: true,
        created_at: true,
      },
    });
    // 3. Lấy 5 báo giá mới nhất của user
    const getFiveQuotations = await prisma.quotations.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, status: true, title: true, created_at: true },
    });
    // 4. Map dữ liệu thành format Activity chung
    const activities = [];
    getFiveOrders.forEach((orders) => {
      activities.push({
        id: `order-${orders.id}`,
        title: `Đơn hàng ${orders.order_code}, đã cập nhật trạng thái ${orders.production_status}`,
        time: orders.created_at,
        status: orders.production_status === "completed" ? "success" : "info",
      });
    });
    getFiveQuotations.forEach((quotations) => {
      activities.push({
        id: `quotation-${quotations.id}`,
        title: `Báo giá ${quotations.title || "Mới"}, đã cập nhật trạng thái ${quotations.status}`,
        time: quotations.created_at,
        status: "default",
      });
    });
    // 5. Trộn (Merge) và sắp xếp mảng theo thời gian mới nhất, sau đó lấy Top 5
    const mergedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);
    const ordersCount = await prisma.orders.count({
      where: {
        OR: [{ user_id: userId }, { quotations: { user_id: userId } }],
      },
    });

    const transactions = await prisma.transactions.aggregate({
      _sum: { amount: true },
      where: {
        status: "success",
        OR: [
          { orders: { user_id: userId } },
          { quotations: { user_id: userId } },
        ],
      },
    });
    const totalSpent = transactions._sum.amount
      ? parseFloat(transactions._sum.amount)
      : 0;

    const pendingQuotationsCount = await prisma.quotations.count({
      where: {
        user_id: userId,
        status: { in: ["pending", "pending_admin"] },
      },
    });

    return {
      totalOrders: ordersCount,
      totalSpent: totalSpent,
      pendingQuotations: pendingQuotationsCount,
      aiConsultations: countAI,
      recentActivities: mergedActivities,
    };
  }
}

module.exports = new UserService();
