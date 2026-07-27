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
  //1. Tìm kiếm cơ bản: Viết một hàm lấy ra danh sách tất cả các người dùng (users) có role là "warehouse".
  async getAllUserWarehouse() {
    const users = await prisma.users.findMany({
      take: 3,
      include: {
        roles: {
          where: { role_name: "USER" },
        },
      },
    });
    return users;
  }
  // 9. Sắp xếp và Giới hạn: Viết hàm lấy ra Top 3 người dùng (users)
  // tạo tài khoản gần đây nhất (Sắp xếp theo created_at giảm dần).
  async getTop3Users() {
    const getTop3 = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      take: 3,
      orderBy: {
        created_at: "desc",
      },
    });
    return getTop3;
  }
  //    Bài tập 3 (Boss): Cập nhật (Update) - Mức độ Suy luận (Hardcore)
  // Tình huống: Cập nhật thông tin Hồ sơ người dùng (User Profile),
  // nhưng đi kèm điều kiện nghiệp vụ rất gắt.
  // Đề bài: Viết hàm async updateUserProfile(userId, data)
  // Người dùng có thể đổi Tên (first_name), Họ (last_name), và Số điện thoại (phone_number).
  //  Bất cứ trường nào cũng có thể gửi hoặc không gửi.
  // Điều kiện chông gai: NẾU trong data người dùng có gửi lên phone_number mới để cập nhật,
  // bạn phải kiểm tra xem dưới Database đã có ai xài cái số điện thoại này chưa (Dùng lệnh findFirst).
  // Nếu số đó đã có người xài, quăng lỗi: "Số điện thoại này đã được đăng ký cho tài khoản khác!".
  // Nếu số đó chưa ai xài (hoặc người ta không gửi phone_number lên để đổi),
  //  thì dùng lệnh prisma.user_profiles.update(...) để cập nhật như bình thường.
  async updateProfileCus(userId, data) {
    const { first_name, middle_name, last_name, phone_number } = data;
    if (!data) {
      throw new Error("Vui lòng điền đầy đủ thông tin!");
    }
    if (phone_number) {
      const ExistsP = await prisma.user_profiles.findFirst({
        where: { phone_number: phone_number },
        user_id: { not: userId },
      });
      if (ExistsP)
        throw new Error(
          "Số điện thoại này đã được đăng ký cho tài khoản khác!",
        );
    }
    const updateProfile = await prisma.user_profiles.update({
      where: { user_id: userId },
      data: {
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        phone_number: phone_number,
      },
    });
    return updateProfile;
  }
  
}

module.exports = new UserService();
