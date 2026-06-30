const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const startSessionCleanupCron = () => {
  // Cài đặt chạy tự động vào lúc 03:00 sáng mỗi ngày (0 3 * * *)
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 [CRONJOB] Bắt đầu dọn dẹp Database lúc nửa đêm...");
    try {
      // 1. Tính toán thời điểm của 3 ngày trước
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // 2. Tìm và xóa các session VÔ DANH (user_id = null) và QUÁ HẠN (> 3 ngày)
      const deletedSessions = await prisma.ai_chat_sessions.deleteMany({
        where: {
          user_id: null,
          started_at: {
            lt: threeDaysAgo, // lt: less than (nhỏ hơn / cũ hơn 3 ngày)
          },
        },
      });

      console.log(
        `✅ [CRONJOB] Đã dọn dẹp thành công ${deletedSessions.count} phiên chat rác vô danh!`,
      );
    } catch (error) {
      console.error("❌ [CRONJOB] Lỗi khi dọn dẹp Database:", error);
    }
  });

  console.log(
    "⏰ [CRONJOB] Đã thiết lập lịch dọn dẹp AI Sessions rác (03:00 sáng hàng ngày).",
  );
};

module.exports = startSessionCleanupCron;
