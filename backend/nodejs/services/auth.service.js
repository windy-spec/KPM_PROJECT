const prisma = require("../models/prisma");
const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const { sendVerifyEmail } = require("../utils/mailer.utils");

class authService {
  async register(data) {
    const {
      username,
      email,
      password,
      firstName,
      middleName,
      lastName,
      phoneNumber,
    } = data;

    // 1. Tìm Role USER trong Database
    const userRole = await prisma.roles.findUnique({
      where: { role_name: "USER" },
    });

    if (!userRole) {
      throw new Error("Hệ thống chưa cấu hình Role USER trong Database!");
    }

    // 2. Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Tạo mã verify và hạn dùng (5 phút)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 4. Transaction: Tạo User & Profile
    const newUser = await prisma.$transaction(async (tx) => {
      return await tx.users.create({
        data: {
          username,
          email,
          password_hash: passwordHash,
          role_id: userRole.id, // Auto gán USER
          verification_code: verifyCode,
          code_expires_at: expiresAt,
          user_profiles: {
            create: {
              first_name: firstName,
              middle_name: middleName,
              last_name: lastName,
              phone_number: phoneNumber,
            },
          },
        },
        include: { user_profiles: true },
      });
    });

    // 5. Gửi mail xác thực (Không dùng await để không bắt người dùng đợi)
    sendVerifyEmail(newUser.email, verifyCode, "REGISTER").catch((err) =>
      console.error("Lỗi gửi mail:", err),
    );

    return newUser;
  }

  async login(username, password) {
    const user = await prisma.users.findUnique({
      where: { username },
      include: { user_profiles: true, roles: true },
    });

    if (!user) throw new Error("Tài khoản không tồn tại");

    // Kiểm tra tài khoản đã xác thực email chưa
    if (!user.is_verified) {
      throw new Error(
        "Tài khoản chưa được xác thực email, vui lòng kiểm tra hộp thư",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error("Mật khẩu không chính xác");

    // Tạo token (Dùng đúng tên hàm trong jwt.utils.js của bro)
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);

    // Lưu Refresh Token vào DB
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken, last_login_at: new Date() },
    });

    return { user, accessToken, refreshToken };
  }
  async verifyOTP(email, code) {
    // 1. Tìm user theo email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) throw new Error("Người dùng không tồn tại");
    if (user.is_verified) throw new Error("Tài khoản này đã được xác thực rồi");

    // 2. Kiểm tra mã xác thực
    if (user.verification_code !== code) {
      throw new Error("Mã xác thực không chính xác");
    }

    // 3. Kiểm tra thời gian hết hạn (5 phút)
    const now = new Date();
    if (now > user.code_expires_at) {
      throw new Error("Mã xác thực đã hết hạn, vui lòng yêu cầu mã mới");
    }

    // 4. Kích hoạt tài khoản và xóa mã đã dùng
    return await prisma.users.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_code: null, // Xóa mã để bảo mật
        code_expires_at: null,
      },
    });
  }
  async logout(userId) {
    // Xóa refresh_token trong DB để vô hiệu hóa phiên đăng nhập
    return await prisma.users.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
  }
  async forgotPassword(email) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");
    const verifiCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.users.update({
      where: { id: user.id },
      data: {
        verification_code: verifiCode,
        code_expires_at: expiresAt,
      },
    });
    sendVerifyEmail(user.email, verifiCode, "FORGOT_PASSWORD").catch((err) =>
      console.error("Lỗi gửi mail:", err),
    );
    return true;
  }
  async resetPassword(email, code, newPassword) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");
    if (user.verification_code !== code)
      throw new Error("Mã xác thực không chính xác");
    const now = new Date();
    if (now > user.code_expires_at) {
      throw new Error("Mã xác thực đã hết hạn, vui lòng yêu cầu mã mới");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        verification_code: null,
        code_expires_at: null,
      },
    });
  }
  async updateUserProfile(userId, profileData) {
    const {
      firstName,
      middleName,
      lastName,
      phoneNumber,
      address,
      zaloNumber,
    } = profileData;

    return await prisma.user_profiles.update({
      where: { user_id: userId },
      data: {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
        zalo_number: zaloNumber,
        updated_at: new Date(),
      },
    });
  }
  async getUsersAccessLogs() {
    return await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        last_login_at: true,
        is_active: true,
        user_profiles: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        roles: {
          select: {
            role_name: true,
          },
        },
      },
      orderBy: {
        last_login_at: "desc",
      },
    });
  }
}

module.exports = new authService();
