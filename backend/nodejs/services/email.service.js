const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER || process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.MAIL_PASS || process.env.EMAIL_PASS || "your-app-password",
      },
    });
  }

  async sendOrderConfirmationWithDeposit(userEmail, orderData) {
    try {
      const depositAmount = orderData.deposit_amount
        ? Number(orderData.deposit_amount).toLocaleString("vi-VN")
        : (Number(orderData.total_amount) * 0.1).toLocaleString("vi-VN");
        
      const totalAmount = Number(orderData.total_amount).toLocaleString("vi-VN");
      const remainingAmount = (Number(orderData.total_amount) * 0.9).toLocaleString("vi-VN");

      const depositUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/deposit-payment?order_id=${orderData.id}`;

      const mailOptions = {
        from: '"Xưởng Cơ Khí KPM" <noreply@kpm.com>',
        to: userEmail,
        subject: `[KPM] Yêu cầu đặt cọc cho Đơn hàng #${orderData.order_code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Xác Nhận Đơn Hàng Cần Đặt Cọc</h2>
            </div>
            <div style="padding: 20px; color: #374151;">
              <p>Chào bạn,</p>
              <p>Cảm ơn bạn đã tin tưởng và đặt hàng tại Xưởng Cơ Khí KPM.</p>
              <p>Đơn hàng <strong>#${orderData.order_code}</strong> của bạn có giá trị lớn (<strong>${totalAmount}đ</strong>). Theo quy định của xưởng, chúng tôi cần bạn thanh toán khoản cọc 10% để tiến hành sản xuất.</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Tổng tiền đơn hàng:</strong> ${totalAmount}đ</p>
                <p style="margin: 5px 0; color: #ef4444; font-size: 18px;"><strong>Số tiền cần cọc (10%): ${depositAmount}đ</strong></p>
                <p style="margin: 5px 0;"><strong>Số tiền còn lại khi nhận hàng:</strong> ${remainingAmount}đ</p>
              </div>

              <p>Vui lòng click vào nút bên dưới để thanh toán cọc an toàn qua hệ thống của chúng tôi:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${depositUrl}" style="background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">THANH TOÁN CỌC NGAY</a>
              </div>

              <p>Ngay sau khi nhận được cọc, xưởng sẽ đưa đơn hàng của bạn vào sản xuất ngay lập tức.</p>
              <p>Trân trọng,<br>Ban Quản Lý Xưởng KPM</p>
            </div>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email Service] Gửi mail yêu cầu cọc thành công đến ${userEmail}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error("[Email Service] Lỗi khi gửi mail:", error);
      return false; // Tránh làm crash app
    }
  }

  async sendPaymentSuccessConfirmation(userEmail, orderData) {
    try {
      const depositAmount = orderData.deposit_amount
        ? Number(orderData.deposit_amount).toLocaleString("vi-VN")
        : "Không xác định";

      const mailOptions = {
        from: '"Xưởng Cơ Khí KPM" <noreply@kpm.com>',
        to: userEmail,
        subject: `[KPM] Xác nhận đã nhận tiền cọc cho Đơn hàng #${orderData.order_code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">Đã Nhận Cọc Thành Công</h2>
            </div>
            <div style="padding: 20px; color: #374151;">
              <p>Chào bạn,</p>
              <p>Chúng tôi đã nhận được khoản thanh toán cọc <strong>${depositAmount}đ</strong> cho đơn hàng <strong>#${orderData.order_code}</strong>.</p>
              <p>Đơn hàng của bạn hiện đã được đưa vào lệnh sản xuất. Bạn có thể theo dõi tiến độ thi công trên trang cá nhân hoặc hỏi AI trợ lý của chúng tôi.</p>
              <p>Cảm ơn bạn rất nhiều!</p>
              <p>Trân trọng,<br>Ban Quản Lý Xưởng KPM</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("[Email Service] Lỗi khi gửi mail thành công:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
