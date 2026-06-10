const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerifyEmail = async (email, code, type = "REGISTER") => {
  let subjectText = "";
  let greetingContext = "";
  if (type === "FORGOT_PASSWORD") {
    subjectText = "[KPM] Yêu cầu đặt lại mật khẩu";
    greetingContext = `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản trên hệ thống <strong style="color: #1e3a8a;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiến hành đổi mật khẩu mới:`;
  } else {
    // Mặc định là REGISTER
    subjectText = "[KPM] Mã xác thực đăng ký tài khoản";
    greetingContext = `Bạn vừa yêu cầu đăng ký tài khoản trên hệ thống <strong style="color: #1e3a8a;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất quá trình đăng ký:`;
  }
  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subjectText,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb;">
        
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">KPM MATERIALS</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Hệ thống Quản lý & Báo giá Vật tư</p>
        </div>

        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào,</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            ${greetingContext}
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
            Nếu bạn không thực hiện yêu cầu này, vui lòng đổi mật khẩu ngay hoặc liên hệ với Admin. Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai để bảo vệ tài khoản của bạn.
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

const sendQuotationEmail = async (email, quotationData) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `[KPM] Báo giá chi tiết - Yêu cầu #${quotationData.id.slice(0, 8)}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb;">
        
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">KPM MATERIALS</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Hệ thống Quản lý & Báo giá Vật tư</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào Quý khách,</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            KPM Materials rất trân trọng gửi đến Quý khách bảng báo giá chi tiết cho hạng mục <strong style="color: #1e3a8a;">${quotationData.title || "Cấu hình sản phẩm"}</strong>.
          </p>

          <div style="margin: 25px 0; padding: 20px; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Tổng tiền tạm tính</p>
            <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: 800; color: #dc2626;">
              ${formatCurrency(quotationData.total_quoted_price)}
            </p>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Mức giá trên đã được đội ngũ kỹ thuật tính toán tối ưu nhất dựa trên bản vẽ, cấu hình vật tư chuẩn và khối lượng thực tế. KPM cam kết sử dụng đúng chủng loại vật tư, đảm bảo độ bền và tính thẩm mỹ cao nhất cho công trình của Quý khách.
          </p>

          <div style="text-align: center; margin: 35px 0 20px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 16px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
              Xem Chi Tiết & Chốt Đơn
            </a>
          </div>
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

const sendOrderConfirmationEmail = async (email, orderData, quotationData) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `[KPM] Xác nhận đơn hàng thành công - Mã ĐH #${orderData.order_code}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px; border-radius: 10px; border: 1px solid #e5e7eb;">
        
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #047857; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">KPM MATERIALS</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Hệ thống Quản lý & Báo giá Vật tư</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Xin chào Quý khách,</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Chúc mừng Quý khách! Đơn hàng <strong style="color: #047857; font-size: 18px;">#${orderData.order_code}</strong> đã được KPM Materials ghi nhận thành công và chính thức chuyển giao cho xưởng sản xuất.
          </p>

          <div style="margin: 25px 0; padding: 20px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
              <tr>
                <td style="padding-bottom: 12px; color: #4b5563; width: 40%;"><strong>Hạng mục:</strong></td>
                <td style="padding-bottom: 12px; color: #1f2937; text-align: right; font-weight: 500;">${quotationData?.title || "Đơn hàng gia công"}</td>
              </tr>
              <tr>
                <td style="padding-top: 12px; border-top: 1px solid #d1fae5; color: #4b5563;"><strong>Tổng giá trị:</strong></td>
                <td style="padding-top: 12px; border-top: 1px solid #d1fae5; color: #dc2626; font-size: 18px; font-weight: 800; text-align: right;">
                  ${formatCurrency(quotationData?.total_quoted_price || 0)}
                </td>
              </tr>
            </table>
          </div>

          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Anh em thợ tại xưởng đã nắm rõ bản vẽ và yêu cầu kỹ thuật. Tiến độ gia công sẽ được cập nhật liên tục. Quý khách có thể theo dõi trực tiếp tình trạng đơn hàng ngay trên hệ thống.
          </p>

          <div style="text-align: center; margin: 35px 0 20px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 16px; font-weight: 600; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
              Theo Dõi Đơn Hàng
            </a>
          </div>
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

module.exports = {
  sendVerifyEmail,
  sendQuotationEmail,
  sendOrderConfirmationEmail,
};
