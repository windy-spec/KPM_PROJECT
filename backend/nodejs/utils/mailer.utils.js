const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerifyEmail = async (email, code) => {
  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "[KPM] Mã xác thực tài khoản của bạn",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb;">
        
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">KPM MATERIALS</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Hệ thống Quản lý & Báo giá Vật tư</p>
        </div>

        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào,</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Bạn vừa yêu cầu đăng ký tài khoản trên hệ thống <strong style="color: #1e3a8a;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất quá trình đăng ký:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; padding: 15px 40px; border-radius: 8px;">
              <span style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #ef4444; font-size: 13px; margin-top: 10px; font-weight: 600;">
              * Mã này chỉ có hiệu lực trong vòng 5 phút.
            </p>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai để bảo vệ tài khoản của bạn.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px; color: #9ca3af; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0;">Email này được gửi tự động từ hệ thống KPM Materials.</p>
          <p style="margin: 5px 0 0 0;">© 2026 KPM Materials. All rights reserved.</p>
        </div>

      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerifyEmail };
