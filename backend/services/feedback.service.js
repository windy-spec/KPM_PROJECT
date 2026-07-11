const prisma = require("../models/prisma");
const mailer = require("../utils/mailer.utils");

class feedbackService {
  // THÊM FEEDBACK MỚI VÀ GỬI EMAIL CẢM ƠN NGAY SAU KHI TẠO
  async createFeedback(userId, data) {
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
