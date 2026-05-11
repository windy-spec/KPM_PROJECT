const jwt = require("jsonwebtoken");
require("dotenv").config();

class JWTUtils {
  // Thẻ vào cổng - Hạn 15 phút (Đã sửa bỏ chữ 'd' ở generate)
  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        role: user.role_id, // Sửa chuẩn theo Schema DB của bro
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );
  }

  // Thẻ gia hạn - Hạn 7 ngày (Đã sửa bỏ chữ 'd' ở generate)
  generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );
  }
}

module.exports = new JWTUtils();
