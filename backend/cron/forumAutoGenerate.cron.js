const cron = require("node-cron");
const forumService = require("../services/forum.service");

// Chạy vào lúc 09:00 sáng, các ngày Thứ 2 (1), Thứ 4 (3), Thứ 6 (5)
// Cú pháp: 0 9 * * 1,3,5
cron.schedule("0 9 * * 1,3,5", async () => {
  console.log("🕒 [CRON] Bắt đầu tự động tạo bài viết Diễn đàn bằng AI...");
  const result = await forumService.generateForumPost();
  if (result.success) {
    console.log(`✅ [CRON] Tạo bài viết thành công! ID: ${result.post.id}`);
  } else {
    console.error(`❌ [CRON] Tạo bài viết thất bại:`, result.error || result.message);
  }
});

console.log("✅ Cron job auto-generate Forum Post initialized. (Schedule: 09:00 Mon, Wed, Fri)");
