const authService = require("../services/auth.service");
class authController {
  async register(req, res) {
    try {
      if (req.body.password !== req.body.confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Mật khẩu không khớp" });
      }
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          username: user?.username,
          email: user?.email,
          verifyCode: user?.verification_code, // Để bro test Postman
          expiresAt: user?.code_expires_at, // Lấy đúng từ kết quả của Service
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(
        username,
        password,
      );

      // Trả token về cho Frontend lưu trữ
      res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          username: user.username,
          email: user.email,
          role: user.roles?.role_name,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async verifyOTP(req, res) {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đầy đủ email và mã OTP",
        });
      }

      await authService.verifyOTP(email, otpCode);

      return res.status(200).json({
        success: true,
        message:
          "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async logout(req, res) {
    try {
      // req.user được gán từ auth.middleware khi user gửi accessToken lên
      const userId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy thông tin người dùng.",
        });
      }

      await authService.logout(userId);

      return res.status(200).json({
        success: true,
        message:
          "Đăng xuất thành công! (Frontend vui lòng tự xóa accessToken trong LocalStorage).",
      });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      return res
        .status(500)
        .json({ success: false, message: "Lỗi hệ thống khi đăng xuất." });
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng nhập email" });
      }
      await authService.forgotPassword(email);
      return res.status(200).json({
        success: true,
        message:
          "Nếu email tồn tại, một mã OTP đã được gửi để đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.",
      });
    } catch (error) {
      console.error("Lỗi quên mật khẩu:", error);
      return res
        .status(500)
        .json({ success: false, message: "Lỗi hệ thống khi xử lý yêu cầu." });
    }
  }
  async resetPassword(req, res) {
    try {
      const { email, otpCode, newPassword } = req.body;
      if (!email || !otpCode || !newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng điền đầy đủ thông tin." });
      }

      await authService.resetPassword(email, otpCode, newPassword);
      return res.status(200).json({
        success: true,
        message: "Cập nhật mật khẩu thành công! Bạn có thể đăng nhập.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu cũ và mới.",
        });
      }

      await authService.changePassword(userId, oldPassword, newPassword);
      return res
        .status(200)
        .json({ success: true, message: "Thay đổi mật khẩu thành công." });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updatedData = await authService.updateProfile(userId, req.body);
      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin thành công.",
        data: updatedData,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async getAccessLogs(req, res) {
    try {
      // BẢN CHẤT BẢO MẬT: Kiểm tra nếu role trong token không phải ADMIN thì đá văng
      // (Tùy theo tên role bro lưu trong DB, ở đây check role_name)
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Truy cập bị từ chối. Chỉ dành cho Admin.",
        });
      }

      const logs = await authService.getUsersAccessLogs();
      return res.status(200).json({ success: true, data: logs });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
module.exports = new authController();
