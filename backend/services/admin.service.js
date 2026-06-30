const prisma = require("../models/prisma");

class AdminService {
  async getDashboardStats() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Doanh thu tháng này
    const currentMonthTransactions = await prisma.transactions.aggregate({
      _sum: { amount: true },
      where: {
        status: "success",
        paid_at: { gte: currentMonthStart }
      }
    });
    const currentRevenue = currentMonthTransactions._sum.amount || 0;

    // Doanh thu tháng trước
    const lastMonthTransactions = await prisma.transactions.aggregate({
      _sum: { amount: true },
      where: {
        status: "success",
        paid_at: { gte: lastMonthStart, lt: currentMonthStart }
      }
    });
    const lastRevenue = lastMonthTransactions._sum.amount || 0;
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : "100";

    // Đơn hàng mới
    const newOrdersCount = await prisma.orders.count({
      where: { created_at: { gte: currentMonthStart } }
    });
    const lastMonthOrdersCount = await prisma.orders.count({
      where: { created_at: { gte: lastMonthStart, lt: currentMonthStart } }
    });
    const ordersChange = lastMonthOrdersCount > 0 ? ((newOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount * 100).toFixed(1) : "100";

    // Báo giá chờ duyệt
    const pendingQuotationsCount = await prisma.quotations.count({
      where: { status: "pending_admin" }
    });

    // Tổng khách hàng
    const totalUsersCount = await prisma.users.count();

    // Chart data (Giả lập 6 tháng gần nhất)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mTrans = await prisma.transactions.aggregate({
        _sum: { amount: true },
        where: {
          status: "success",
          paid_at: { gte: monthStart, lt: monthEnd }
        }
      });
      const monthLabel = `T${monthStart.getMonth() + 1}`;
      chartData.push({
        name: monthLabel,
        revenue: mTrans._sum.amount ? parseFloat(mTrans._sum.amount) : 0
      });
    }

    // Recent items (5 báo giá hoặc đơn hàng mới nhất)
    const recentOrders = await prisma.orders.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: { users: { select: { username: true } }, quotations: { include: { users: { select: { username: true } } } } }
    });

    const recentItems = recentOrders.map(o => ({
      id: o.id,
      title: o.order_code,
      user: o.users?.username || o.quotations?.users?.username || "Khách vãng lai",
      amount: o.total_amount ? parseFloat(o.total_amount) : 0,
      status: o.production_status,
      date: o.created_at
    }));

    return {
      stats: {
        revenue: { value: parseFloat(currentRevenue), change: parseFloat(revenueChange) },
        orders: { value: newOrdersCount, change: parseFloat(ordersChange) },
        pendingQuotations: { value: pendingQuotationsCount, change: 0 }, // ko cần change
        users: { value: totalUsersCount, change: 0 }
      },
      chartData,
      recentItems
    };
  }
}

module.exports = new AdminService();
