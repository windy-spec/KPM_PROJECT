const prisma = require("../models/prisma");
const mailer = require("../utils/mailer.utils");
const fs = require("fs");
const path = require("path");

// Đọc danh sách từ khóa vi phạm 1 lần khi khởi tạo service
const profanityFilePath = path.join(__dirname, "..", "docs", "vietnamese_profanity.txt");
let profanityList = [];
try {
  const data = fs.readFileSync(profanityFilePath, "utf8");
  profanityList = data.split(",").map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
} catch (error) {
  console.error("Không thể đọc file vietnamese_profanity.txt:", error);
}

class feedbackService {
  // THÊM FEEDBACK MỚI VÀ GỬI EMAIL CẢM ƠN NGAY SAU KHI TẠO
  async createFeedback(userId, data) {
    if (data.content.length < 20) {
      throw new Error("Góp ý phải có ít nhất 20 ký tự!");
    }

    // --- BỘ LỌC TỪ NGỮ VI PHẠM (PROFANITY FILTER) ---
    // Chuẩn bị chuỗi: Chuyển chữ thường, thay các dấu câu/xuống dòng bằng khoảng trắng, thêm khoảng trắng 2 đầu
    // Mục đích thêm khoảng trắng 2 đầu là để tránh lọc nhầm (ví dụ: chữ "b" trong chữ "bạn")
    const cleanText = (text) => " " + (text || "").toLowerCase().replace(/[.,!?;:\n\r]/g, " ") + " ";
    const contentCheck = cleanText(data.content);
    const titleCheck = cleanText(data.title);

    for (const word of profanityList) {
      const searchWord = " " + word + " "; // Tìm từ độc lập
      if (contentCheck.includes(searchWord) || titleCheck.includes(searchWord)) {
        throw new Error(`Bạn đang vi phạm chửi thề, và chữ mà bạn chửi là "${word}" không phù hợp với tiêu chuẩn mà chúng tôi đề ra, xin kiểm soát lại ngôn từ!`);
      }
    }
    // -------------------------------------------------
    const feedback = await prisma.feedbacks.create({
      data: {
        user_id: userId,
        title: data.title,
        category: data.category,
        content: data.content,
      },
      include: {
        users: {
          include: {
            user_profiles: true,
          },
        },
      },
    });
    const userEmail = feedback.users?.email;
    const userName =
      feedback.users?.user_profiles?.first_name ||
      feedback.users?.user_profiles?.last_name ||
      feedback.users?.username;
    if (userEmail && userName) {
      await mailer.sendFeedbackThanksEmail(userEmail, userName).catch((err) => {
        console.error("Error sending feedback thanks email:", err);
      });
    }
    
    return feedback;
  }
  // XOÁ FEEDBACK
  async deleteFeedback(id) {
    const deletedFeedback = await prisma.feedbacks.delete({
      where: { id },
    });
    return deletedFeedback;
  }
  // SỬA FEEDBACK
  async updateFeedback(id, data) {
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
      },
    });
    return updatedFeedback;
  }
  // XEM CỤ THỂ FEEDBACK BY ID
  async getFeedbackById(id) {
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            email: true,
            username: true,
            user_profiles: {
              select: {
                first_name: true,
                phone_number: true,
              },
            },
          },
        },
      },
    });
    if (!feedback) {
      throw new Error("Feedback not found");
    }
    return feedback;
  }
  // LẤY TẤT CẢ FEEDBACKS
  async getAllFeedbacks() {
    return await prisma.feedbacks.findMany({
      orderBy: { created_at: "desc" },
      include: {
        users: {
          select: {
            email: true,
            username: true,
            user_profiles: {
              select: {
                first_name: true,
                phone_number: true,
              },
            },
          },
        },
      },
    });
  }
}
module.exports = new feedbackService();
