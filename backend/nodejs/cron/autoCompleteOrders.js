const cron = require("node-cron");
const prisma = require("../models/prisma");

// Chạy vào đúng 00:00 mỗi ngày
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[CRON-JOB] Bắt đầu kiểm tra và tự động hoàn thành đơn hàng sau 3 ngày giao...");

    // Lấy các đơn hàng đang ở trạng thái delivering
    const deliveringOrders = await prisma.orders.findMany({
      where: {
        production_status: "delivering",
      },
      include: {
        order_tracking: {
          orderBy: {
            tracked_at: "desc",
          },
          take: 1, // Lấy lịch sử trạng thái mới nhất (chính là lúc chuyển sang delivering)
        },
      },
    });

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    let completedCount = 0;

    for (const order of deliveringOrders) {
      const latestTracking = order.order_tracking[0];
      if (latestTracking && latestTracking.tracked_at) {
        const deliveredAt = new Date(latestTracking.tracked_at);

        // Nếu thời điểm chuyển sang delivering đã trôi qua >= 3 ngày
        if (deliveredAt <= threeDaysAgo) {
          await prisma.$transaction(async (tx) => {
            // Cập nhật trạng thái
            await tx.orders.update({
              where: { id: order.id },
              data: { production_status: "completed" },
            });

            // Ghi log trạng thái rõ ràng
            await tx.order_tracking.create({
              data: {
                order_id: order.id,
                stage_name: "completed",
                stage_description: "Hệ thống tự động hoàn thành đơn hàng sau 3 ngày giao.",
                tracked_at: new Date(),
              },
            });
          });
          completedCount++;
        }
      }
    }

    if (completedCount > 0) {
      console.log(`[CRON-JOB] Đã tự động hoàn thành ${completedCount} đơn hàng.`);
    } else {
      console.log("[CRON-JOB] Không có đơn hàng nào cần tự động hoàn thành.");
    }
  } catch (error) {
    console.error("[CRON-JOB] Lỗi trong quá trình tự động hoàn thành đơn hàng:", error);
  }
});
