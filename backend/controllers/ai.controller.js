const aiService = require("../services/ai.service");

class AIController {
  async chat(req, res) {
    try {
      // Nhận thêm biến mode ('fast', 'slow' hoặc bỏ trống thì tự động) và imageUrl (nếu có)
      const { sessionId, message, mode, imageUrl } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!message && !imageUrl) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng nhập tin nhắn hoặc gửi ảnh!" });
      }

      // Đẩy thêm mode và imageUrl xuống Service
      const result = await aiService.chatWithAI(message, sessionId, mode, userId, imageUrl);

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
      const { imageUrl, sessionId } = req.body;
      const userId = req.user ? req.user.id : null;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp URL hình ảnh bản vẽ!",
        });
      }

      // Đẩy xuống Service và lấy kết quả
      const analysisResult = await aiService.analyzeDrawing(
        imageUrl,
        sessionId,
        userId
      );

      // Nếu là ảnh rác, AI trả về message text thay vì bản vẽ
      if (analysisResult.isErrorResponse) {
        return res.status(200).json({
          success: true,
          isChatMessageOnly: true,
          data: {
            reply: analysisResult.message,
            sessionId: analysisResult.sessionId
          }
        });
      }

      // Trả kết quả về cho Postman / Frontend
      res.status(200).json({
        success: true,
        message: "Phân tích bản vẽ thành công!",
        data: {
          id: analysisResult.id,
          drawingName: analysisResult.drawing_name,
          scaleRatio: analysisResult.scale_ratio,
          dimensions: analysisResult.specifications,
          sessionId: analysisResult.sessionId, // Frontend cần cái này để cập nhật
          reply: analysisResult.replyMessage
        },
      });
    } catch (error) {
      console.error("Lỗi Controller Phân Tích Ảnh:", error);
      res.status(400).json({
        success: false,
        message: "AI Vision không thể đọc bản vẽ này, vui lòng thử lại ảnh khác!",
        error: error.message
      });
    }
  }

  // Hàm xử lý Upload ảnh bản vẽ
  async uploadDrawingImage(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy file ảnh!" });
      }

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

  // GET /api/ai/sessions
  async getSessions(req, res) {
    try {
      const userId = req.user.id;
      console.log("[getSessions] Received request for userId:", userId);
      const sessions = await aiService.getUserSessions(userId);
      console.log("[getSessions] Found sessions:", sessions.length);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      console.error("[getSessions] Error:", error.message);
      res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
  }

  // GET /api/ai/sessions/:id
  async getSessionDetails(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;
      const sessionData = await aiService.getSessionDetails(sessionId, userId);
      res.status(200).json({ success: true, data: sessionData });
    } catch (error) {
      console.error("[getSessionDetails] Error:", error.message);
      res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
  }
}

module.exports = new AIController();
