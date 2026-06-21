const aiService = require("../services/ai.service");

class AIController {
  async chat(req, res) {
    try {
      // Nhận thêm biến mode ('fast', 'slow' hoặc bỏ trống thì tự động)
      const { sessionId, message, mode } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng nhập tin nhắn!" });
      }

      // Đẩy thêm mode xuống Service
      const result = await aiService.chatWithAI(message, sessionId, mode, userId);

      res.status(200).json({
        success: true,
        data: {
          sessionId: result.sessionId,
          reply: result.reply,
        },
      });
    } catch (error) {
      console.error("Lỗi AI Chat:", error);
      res.status(500).json({
        success: false,
        message: "Hệ thống AI đang bận, vui lòng thử lại sau!",
      });
    }
  }
  async analyze(req, res) {
    try {
      const { imageUrl, messageId } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp URL hình ảnh bản vẽ!",
        });
      }

      // Đẩy xuống Service và BẮT BUỘC lưu vào biến tên là: analysisResult
      const analysisResult = await aiService.analyzeDrawing(
        imageUrl,
        messageId,
      );

      // Trả kết quả về cho Postman / Frontend
      res.status(200).json({
        success: true,
        message: "Phân tích bản vẽ thành công!",
        data: {
          id: analysisResult.id,
          drawingName: analysisResult.drawing_name,
          scaleRatio: analysisResult.scale_ratio,
          dimensions: analysisResult.specifications, // Cục JSON Dài x Rộng x Cao
        },
      });
    } catch (error) {
      console.error("Lỗi Controller Phân Tích Ảnh:", error);
      res.status(500).json({
        success: false,
        message:
          "AI Vision không thể đọc bản vẽ này, vui lòng thử lại ảnh khác!",
      });
    }
  }
  // Hàm xử lý Upload ảnh bản vẽ
  async uploadDrawingImage(req, res) {
    try {
      // req.file do Multer cung cấp sau khi đẩy thành công lên Cloudinary
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy file ảnh!" });
      }

      // Trả về cái link URL xịn xò của Cloudinary
      res.status(200).json({
        success: true,
        message: "Upload bản vẽ thành công!",
        data: {
          imageUrl: req.file.path,
        },
      });
    } catch (error) {
      console.error("Lỗi Upload Ảnh:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi upload ảnh." });
    }
  }
}
module.exports = new AIController();
