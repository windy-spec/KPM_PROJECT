const feedbackService = require("../services/feedback.service");

class feedbackController {
  // GỌI HÀM TẠO FEEDBACK MỚI
  async createFeedback(req, res) {
    try {
      const userId = req.user.id;
      const data = req.body;
      const feedback = await feedbackService.createFeedback(userId, data);
      res
        .status(201)
        .json({ message: "Feedback created successfully", feedback });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  // GỌI HÀM LẤY TẤT CẢ FEEDBACKS
  async getAllFeedbacks(req, res) {
    try {
      const feedbacks = await feedbackService.getAllFeedbacks();
      res.status(200).json({ feedbacks });
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  // GỌI HÀM Lấy chi tiết 1 feedback
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      const feedback = await feedbackService.getFeedbackById(id);
      res.status(200).json({ success: true, data: feedback });
    } catch (e) {
      res.status(404).json({ success: false, message: e.message });
    }
  }

  // GỌI HÀM Cập nhật feedback
  async updateFeedback(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedFeedback = await feedbackService.updateFeedback(id, data);
      res.status(200).json({
        success: true,
        data: updatedFeedback,
        message: "Cập nhật góp ý thành công!",
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // GỌI HÀM Xóa feedback
  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      await feedbackService.deleteFeedback(id);
      res.status(200).json({
        success: true,
        message: "Xóa góp ý thành công!",
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}
module.exports = new feedbackController();
