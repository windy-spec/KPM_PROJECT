const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// 1. EMAIL MÃ XÁC THỰC (OTP) - Giữ nguyên hoặc tinh chỉnh nhẹ
const sendVerifyEmail = async (email, code, type = "REGISTER") => {
  let subjectText = "";
  let greetingContext = "";

  if (type === "FORGOT_PASSWORD") {
    subjectText = "[KPM] Yêu cầu đặt lại mật khẩu";
    greetingContext = `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản trên hệ thống <strong style="color: #1e3a8a;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiến hành đổi mật khẩu mới:`;
  } else if (type === "INVOICE") {
    subjectText = "[KPM] Hóa Đơn Đặt Hàng KPM";
    greetingContext = `Cảm ơn bạn đã tin tưởng và đặt hàng tại <strong style="color: #1e3a8a;">KPM Materials</strong>. Giao dịch của bạn đã được hệ thống ghi nhận. Mã hóa đơn điện tử của bạn là:`;
  } else {
    subjectText = "[KPM] Mã xác thực đăng ký tài khoản";
    greetingContext = `Bạn vừa yêu cầu đăng ký tài khoản trên hệ thống <strong style="color: #1e3a8a;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất quá trình đăng ký:`;
  }

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subjectText,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          
          <div style="background: #1e293b; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">KPM MATERIALS</h1>
          </div>

          <div style="padding: 40px 30px;">
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Xin chào,</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${greetingContext}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 15px 40px; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">${code}</span>
              </div>
              ${type !== "INVOICE" ? `<p style="color: #ef4444; font-size: 13px; margin-top: 15px; font-weight: 600;">* Mã này chỉ có hiệu lực trong vòng 5 phút.</p>` : ""}
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              Email này được gửi tự động. Vui lòng không trả lời email này.<br>
              © 2026 KPM Materials.
            </p>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// 2. EMAIL BÁO GIÁ SẢN PHẨM (Giao diện Cao cấp/Kỹ thuật)
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
    subject: `[KPM] Hồ sơ Báo giá Kỹ thuật - #${quotationData.id.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdf4; padding: 40px 10px; background: #e2e8f0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 40px 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Hồ sơ Báo giá</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">KPM MATERIALS</h1>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Xin chào Quý khách,<br><br>
              KPM Materials đã hoàn tất việc bóc tách bản vẽ và tính toán vật tư. Dưới đây là bảng tóm tắt chi phí cho hạng mục yêu cầu của Quý khách:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
                ${quotationData.title || "Gia công cấu hình kỹ thuật"}
              </h3>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span style="color: #64748b; font-size: 15px;">Mã số báo giá:</span>
                <strong style="color: #0f172a; font-size: 15px;">#${quotationData.id.slice(0, 8).toUpperCase()}</strong>
              </div>
              
              <div style="background: #1e293b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Tổng chi phí dự kiến</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 800; color: #fbbf24;">
                  ${formatCurrency(quotationData.total_quoted_price)}
                </p>
              </div>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Mức giá trên được tính toán tối ưu dựa trên cấu hình vật tư chuẩn. Để xem bản vẽ chi tiết, danh sách linh kiện và tiến hành đặt hàng, Quý khách vui lòng truy cập hệ thống.
            </p>

            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile?panel=quotations" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(37,99,235,0.3);">
                XEM CHI TIẾT HỒ SƠ
              </a>
            </div>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// 3. EMAIL XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG (Giao diện Thành công/Công xưởng)
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
    subject: `[KPM] Xác nhận Đơn hàng #${orderData.order_code}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #047857 0%, #064e3b 100%); padding: 40px 30px; text-align: center; border-bottom: 4px solid #10b981;">
            <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 50%; margin-bottom: 15px;">
              <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="40" height="40" alt="Success" style="filter: brightness(0) invert(1);" />
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px; text-transform: uppercase;">Xác nhận đơn hàng</h1>
            <p style="color: #a7f3d0; font-size: 15px; margin-top: 10px; font-weight: 500;">Cảm ơn Quý khách đã tin tưởng KPM!</p>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Đơn hàng của Quý khách đã được hệ thống ghi nhận thành công và chính thức chuyển giao lệnh sản xuất xuống xưởng.
            </p>

            <div style="border: 2px dashed #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Mã Đơn Hàng</p>
                <p style="color: #111827; font-size: 22px; font-weight: 800; margin: 5px 0 0 0;">#${orderData.order_code}</p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                <tr>
                  <td style="padding: 15px 0; color: #4b5563; border-bottom: 1px solid #f3f4f6;"><strong>Hạng mục gia công</strong></td>
                  <td style="padding: 15px 0; color: #111827; text-align: right; font-weight: 500; border-bottom: 1px solid #f3f4f6;">
                    ${quotationData?.title || "Vật tư & Linh kiện cơ khí"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; color: #4b5563; border-bottom: 1px solid #f3f4f6;"><strong>Trạng thái</strong></td>
                  <td style="padding: 15px 0; color: #059669; text-align: right; font-weight: bold; border-bottom: 1px solid #f3f4f6;">
                    Chờ sản xuất
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; color: #374151; font-size: 16px;"><strong>TỔNG GIÁ TRỊ</strong></td>
                  <td style="padding-top: 20px; color: #dc2626; font-size: 22px; font-weight: 900; text-align: right;">
                    ${formatCurrency(quotationData?.total_quoted_price || orderData?.total_amount || 0)}
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; text-align: center;">
              Kỹ thuật viên sẽ cập nhật tiến độ gia công liên tục. Quý khách có thể theo dõi tình trạng đơn hàng trực tiếp trên hệ thống Dashboard.
            </p>

            <div style="text-align: center; margin: 40px 0 10px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile?panel=orders" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(5,150,105,0.3);">
                THEO DÕI TIẾN ĐỘ
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">© 2026 KPM Materials - Công nghệ & Cơ khí chính xác</p>
          </div>
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
