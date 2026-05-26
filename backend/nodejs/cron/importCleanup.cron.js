const cron = require("node-cron");
const prisma = require("../models/prisma");

// Chạy vào đúng 00:00 (Nửa đêm) mỗi ngày
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("[CRON-JOB] Bắt đầu quét và dọn dẹp các lô Import rác...");

    // 1. Tính mốc thời gian: 30 ngày trước
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    // 2. Tìm ID của các lô được tạo trước mốc 30 ngày
    const oldBatches = await prisma.import_batches.findMany({
      where: {
        created_at: { lt: oneMonthAgo },
      },
      select: { id: true },
    });

    if (oldBatches.length > 0) {
      const batchIds = oldBatches.map((b) => b.id);

      await prisma.$transaction(async (tx) => {
        // Xóa sạch chi tiết đệm
        await tx.product_imports_tmp.deleteMany({
          where: { batch_id: { in: batchIds } },
        });

        // Xóa sạch các lô cha
        await tx.import_batches.deleteMany({
          where: { id: { in: batchIds } },
        });
      });

      console.log(
        `[CRON-JOB] Đã dọn dẹp thành công ${batchIds.length} lô dữ liệu quá hạn 1 tháng.`,
      );
    } else {
      console.log("[CRON-JOB] DB sạch sẽ, không có lô cũ nào cần dọn.");
    }
  } catch (error) {
    console.error("[CRON-JOB] Lỗi trong quá trình dọn dẹp:", error);
  }
});
