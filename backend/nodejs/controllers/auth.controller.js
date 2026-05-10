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
        user: { username: user.username, email: user.email },
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
        return res
          .status(400)
          .json({
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
}
module.exports = new authController();
