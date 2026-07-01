const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

// ============================================================================
// 1. EMAIL MÃ XÁC THỰC (OTP) & HÓA ĐƠN CHI TIẾT
// ============================================================================
const sendVerifyEmail = async (email, code, type = "REGISTER", orderData = null, quotationData = null, isDepositPayment = false) => {
  
  // ---------------------------------------------------------
  // KỊCH BẢN 1: NẾU LÀ HÓA ĐƠN (INVOICE)
  // ---------------------------------------------------------
  if (type === "INVOICE" || type === "DEPOSIT_INVOICE" || type === "PHASE2_INVOICE" || type === "TOTAL_INVOICE") {
    let itemsHtml = "";
    if (quotationData && quotationData.quotation_specs && quotationData.quotation_specs.length > 0) {
      // DÀNH CHO ĐƠN CÓ BÓC TÁCH BÁO GIÁ
      itemsHtml = quotationData.quotation_specs.map((spec, index) => {
        return `
        <tr>
          <td style="padding: 15px 12px; border-bottom: 1px solid #bfdbfe; vertical-align: top;">
            <strong style="color: #1e3a8a; font-size: 14px;">${index + 1}. ${spec.component_name || "Linh kiện"}</strong>
            <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5;">
              - Vật tư: ${spec.materials?.material_name || "Theo TC"}<br>
              - Kích thước: ${spec.dimensions?.width || "-"} x ${spec.dimensions?.height || "-"} (mm)
            </div>
          </td>
          <td style="padding: 15px 12px; border-bottom: 1px solid #bfdbfe; color: #1e3a8a; text-align: center; font-weight: bold; font-size: 14px; vertical-align: top;">
            ${spec.dimensions?.quantity || 1}
          </td>
        </tr>
      `}).join("");
    } else if (orderData && orderData.order_items && orderData.order_items.length > 0) {
      // DÀNH CHO ĐƠN MUA HÀNG TRỰC TIẾP (BÁN LẺ) CÓ HIỂN THỊ CẤU THÀNH LINH KIỆN
      itemsHtml = orderData.order_items.map((item, index) => {
        // Trích xuất mảng JSON components của product (nếu có)
        const components = item.products?.components || [];
        let componentDetails = "";
        
        if (components.length > 0) {
          componentDetails = components.map(comp => 
            `&nbsp;&nbsp;+ ${comp.component_name || 'Linh kiện'}: ${comp.width || '-'} x ${comp.length || comp.height || '-'} (mm)`
          ).join("<br>");
        }

        return `
        <tr>
          <td style="padding: 15px 12px; border-bottom: 1px solid #bfdbfe; vertical-align: top;">
            <strong style="color: #1e3a8a; font-size: 14px;">${index + 1}. ${item.products?.product_name || "Sản phẩm KPM"}</strong>
            <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.5;">
              - Đơn giá: ${formatCurrency(item.price)}
              ${componentDetails ? `<br><div style="margin-top: 5px; color: #64748b;"><strong>Chi tiết vật tư & linh kiện:</strong><br>${componentDetails}</div>` : ""}
            </div>
          </td>
          <td style="padding: 15px 12px; border-bottom: 1px solid #bfdbfe; color: #1e3a8a; text-align: center; font-weight: bold; font-size: 14px; vertical-align: top;">
            ${item.quantity}
          </td>
        </tr>
      `}).join("");
    } else {
      itemsHtml = `<tr><td colspan="2" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">Hóa đơn bán lẻ sản phẩm tiêu chuẩn.</td></tr>`;
    }

    const finalTotal = orderData?.total_amount || 0;
    const shippingFee = orderData?.shipping_fee || 0;
    const installFee = orderData?.installation_fee || 0;
    const subTotal = finalTotal - shippingFee - installFee;
    
    let invoiceTitle = "Hóa Đơn Điện Tử Đã Thanh Toán";
    let invoiceNote = "ĐÃ THANH TOÁN:";
    let paidAmount = finalTotal;

    if (type === "DEPOSIT_INVOICE") {
      invoiceTitle = "Hóa Đơn Đặt Cọc (Đợt 1)";
      invoiceNote = "ĐÃ ĐẶT CỌC (10%):";
      paidAmount = orderData?.deposit_amount || 0;
    } else if (type === "PHASE2_INVOICE") {
      invoiceTitle = "Hóa Đơn Thanh Toán Đợt 2";
      invoiceNote = "ĐÃ THANH TOÁN (ĐỢT 2):";
      paidAmount = finalTotal - (orderData?.deposit_amount || 0);
    } else if (type === "TOTAL_INVOICE") {
      invoiceTitle = "Hóa Đơn Tổng Tất Toán";
      invoiceNote = "TỔNG ĐÃ THANH TOÁN:";
      paidAmount = finalTotal;
    }

    // Lấy tên khách hàng từ orderData hoặc quotationData, ưu tiên trường first_name
    let invoiceCustomerName = orderData?.customer_name || 'Khách hàng';
    let invoiceCustomerPhone = orderData?.customer_phone || 'Chưa cập nhật';
    let invoiceShippingAddress = orderData?.shipping_address || 'Chưa cập nhật';

    // Thử lấy first_name nếu được cung cấp qua data
    if (orderData?.users?.user_profiles?.first_name) {
      invoiceCustomerName = orderData.users.user_profiles.first_name;
    } else if (quotationData?.users?.user_profiles?.first_name) {
      invoiceCustomerName = quotationData.users.user_profiles.first_name;
    }

    const mailOptions = {
      from: `"KPM Materials" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `[KPM] ${invoiceTitle} - ${code}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 10px;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">${invoiceTitle}</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 2px;">KPM MATERIALS</h1>
            </div>
            <div style="padding: 30px;">
              <div style="background-color: #eff6ff; border: 2px dashed #bfdbfe; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; font-size: 12px; color: #3b82f6; text-transform: uppercase; font-weight: bold;">Mã Hóa Đơn</p>
                <span style="font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px;">${code}</span>
              </div>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 15px 20px; margin: 0 0 30px 0; text-align: left;">
                <p style="margin: 0 0 5px 0; font-size: 13px; color: #1e3a8a; text-transform: uppercase;"><strong>Thông tin khách hàng:</strong></p>
                <p style="margin: 0 0 3px 0; font-size: 13px; color: #475569;">Xin chào: <strong>${invoiceCustomerName}</strong></p>
                <p style="margin: 0 0 3px 0; font-size: 13px; color: #475569;">SĐT: ${invoiceCustomerPhone}</p>
                <p style="margin: 0; font-size: 13px; color: #475569;">Địa chỉ: ${invoiceShippingAddress}</p>
              </div>

              <h3 style="margin: 30px 0 15px 0; font-size: 15px; color: #1e3a8a; border-bottom: 2px solid #bfdbfe; padding-bottom: 8px; text-transform: uppercase;">Chi tiết Sản phẩm / Hạng mục</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #bfdbfe;">Hạng mục / Cấu hình</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #bfdbfe; width: 120px;">Số lượng</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td width="40%"></td>
                  <td width="60%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 12px; font-size: 13px; color: #475569; text-align: right;">Tiền vật tư & Gia công:</td>
                        <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 500;">${formatCurrency(subTotal)}</td>
                      </tr>
                      ${shippingFee > 0 ? `<tr><td style="padding: 6px 12px; font-size: 13px; color: #475569; text-align: right;">Vận chuyển:</td><td style="padding: 6px 12px; font-size: 13px; color: #0f172a; text-align: right;">${formatCurrency(shippingFee)}</td></tr>` : ""}
                      ${installFee > 0 ? `<tr><td style="padding: 6px 12px; font-size: 13px; color: #475569; text-align: right;">Lắp đặt:</td><td style="padding: 6px 12px; font-size: 13px; color: #0f172a; text-align: right;">${formatCurrency(installFee)}</td></tr>` : ""}
                      ${type === "PHASE2_INVOICE" && orderData?.deposit_amount > 0 ? `<tr><td style="padding: 6px 12px; font-size: 13px; color: #ef4444; text-align: right;">Đã trừ cọc (Đợt 1):</td><td style="padding: 6px 12px; font-size: 13px; color: #ef4444; text-align: right;">-${formatCurrency(orderData.deposit_amount)}</td></tr>` : ""}
                      <tr>
                        <td style="padding: 12px; font-size: 15px; color: #1e3a8a; text-align: right; font-weight: bold; border-top: 1px solid #bfdbfe;">
                          ${invoiceNote}
                        </td>
                        <td style="padding: 12px; font-size: 20px; color: #10b981; text-align: right; font-weight: 900; border-top: 1px solid #bfdbfe;">
                          ${formatCurrency(paidAmount)}
                        </td>
                      </tr>
                      ${type === "DEPOSIT_INVOICE" ? `
                      <tr>
                        <td style="padding: 12px; font-size: 14px; color: #ef4444; text-align: right; font-weight: bold; border-top: 1px dashed #bfdbfe;">
                          CÒN LẠI PHẢI THANH TOÁN ĐỢT 2:
                        </td>
                        <td style="padding: 12px; font-size: 16px; color: #ef4444; text-align: right; font-weight: bold; border-top: 1px dashed #bfdbfe;">
                          ${formatCurrency(finalTotal - paidAmount)}
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile?panel=orders" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 14px; font-weight: bold; border-radius: 6px;">KIỂM TRA ĐƠN HÀNG</a>
              </div>
            </div>
          </div>
        </div>
      `,
    };
    return transporter.sendMail(mailOptions);
  }

  // ---------------------------------------------------------
  // KỊCH BẢN 2: NẾU LÀ GỬI MÃ OTP (REGISTER / FORGOT_PASSWORD)
  // ---------------------------------------------------------
  let subjectText = "";
  let greetingContext = "";

  if (type === "FORGOT_PASSWORD") {
    subjectText = "[KPM] Yêu cầu đặt lại mật khẩu";
    greetingContext = `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản trên hệ thống <strong style="color: #2563eb;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiến hành đổi mật khẩu mới:`;
  } else {
    subjectText = "[KPM] Mã xác thực đăng ký tài khoản";
    greetingContext = `Bạn vừa yêu cầu đăng ký tài khoản trên hệ thống <strong style="color: #2563eb;">KPM Materials</strong>. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất quá trình đăng ký:`;
  }

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: subjectText,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 35px 20px; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Xác thực bảo mật</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 2px;">KPM MATERIALS</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Xin chào,</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">${greetingContext}</p>
            <div style="text-align: center; margin: 35px 0;">
              <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px 40px; border-radius: 12px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Mã OTP của bạn</p>
                <span style="font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #ef4444; font-size: 13px; margin-top: 15px; font-weight: 600;">* Mã này chỉ có hiệu lực trong vòng 5 phút.</p>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 30px;">
              Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.<br>
              © ${new Date().getFullYear()} KPM Materials.
            </p>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================================
// 2. EMAIL BÁO GIÁ SẢN PHẨM (Giao diện Cao cấp/Kỹ thuật chi tiết)
// ============================================================================
const sendQuotationEmail = async (email, quotationData) => {
  let itemsHtml = "";
  if (quotationData && quotationData.quotation_specs && quotationData.quotation_specs.length > 0) {
    itemsHtml = quotationData.quotation_specs.map((spec, index) => {
      return `
      <tr>
        <td style="padding: 15px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <strong style="color: #0f172a; font-size: 14px;">${index + 1}. ${spec.component_name || "Linh kiện"}</strong>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.5;">
            - Vật tư: ${spec.materials?.material_name || "Theo TC"}<br>
            - Kích thước: ${spec.dimensions?.width || "-"} x ${spec.dimensions?.height || "-"} (mm)
          </div>
          ${spec.note ? `<div style="font-size: 12px; color: #d97706; font-style: italic; margin-top: 4px;">*${spec.note}</div>` : ""}
        </td>
        <td style="padding: 15px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-align: center; font-weight: bold; font-size: 14px; vertical-align: top;">
          ${spec.dimensions?.quantity || 1}
        </td>
      </tr>
    `}).join("");
  } else {
    itemsHtml = `<tr><td colspan="2" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">Chi tiết bóc tách vật tư được đính kèm trong hệ thống.</td></tr>`;
  }

  const originalPrice = quotationData?.total_quoted_price || 0;
  const adminProposedPrice = quotationData?.admin_proposed_price;
  const finalDisplayPrice = adminProposedPrice || originalPrice;
  const hasDiscount = adminProposedPrice && adminProposedPrice < originalPrice;

  const customerName = quotationData?.users?.user_profiles?.first_name 
    ? `${quotationData.users.user_profiles.first_name}`.trim()
    : (quotationData?.users?.username || 'Quý khách');
  const customerPhone = quotationData?.users?.user_profiles?.phone_number || 'Đã cập nhật trên hệ thống';
const customerEmail = quotationData?.users?.user_profiles?.email || 'Đã cập nhật trên hệ thống';
  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `[KPM] Hồ sơ Báo giá Kỹ thuật - #${quotationData.id?.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f0fdf4; padding: 40px 10px; background: #e2e8f0;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 35px 30px; text-align: center; border-bottom: 4px solid #fbbf24;">
            <p style="color: #fbbf24; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Hồ Sơ Báo Giá Sản Xuất</p>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px; text-transform: uppercase;">KPM MATERIALS</h1>
            <p style="color: #cbd5e1; font-size: 14px; margin-top: 8px;">Mã tham chiếu: <strong>#${quotationData.id?.slice(0, 8).toUpperCase()}</strong></p>
          </div>

          <div style="padding: 30px;">
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
              Xin chào <strong>${customerName}</strong>,<br><br>
              Phòng Kỹ thuật KPM Materials đã hoàn tất việc bóc tách bản vẽ và tính toán định mức vật tư cho yêu cầu gia công của bạn.
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #334155; border-radius: 8px; padding: 15px 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 5px 0; color: #0f172a; font-size: 16px;">${quotationData.title || "Gia công cấu hình kỹ thuật tùy chỉnh"}</h3>
              <p style="margin: 0; font-size: 13px; color: #64748b;">Yêu cầu bởi: ${customerName} | SĐT: ${customerPhone} | Email: ${customerEmail}</p>
            </div>

            <h3 style="margin: 30px 0 15px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; display: inline-block; text-transform: uppercase;">Chi tiết Bóc tách & Phân bổ chi phí</h3>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1;">Hạng mục / Cấu hình</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; width: 120px;">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background: #1e293b; color: white; padding: 25px; border-radius: 12px; margin-top: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${hasDiscount ? `
                <tr>
                  <td style="padding-bottom: 10px; color: #94a3b8; font-size: 14px;">Giá gốc hệ thống tính:</td>
                  <td style="padding-bottom: 10px; color: #94a3b8; font-size: 14px; text-align: right; text-decoration: line-through;">${formatCurrency(originalPrice)}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; color: #34d399; font-size: 13px; font-style: italic;" colspan="2">
                    * Đã áp dụng mức giá ưu đãi/đề xuất từ Admin KPM
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding-top: 15px; border-top: 1px solid #334155; color: #cbd5e1; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Tổng Chi Phí Đề Xuất:</td>
                  <td style="padding-top: 15px; border-top: 1px solid #334155; color: #fbbf24; font-size: 26px; font-weight: 900; text-align: right;">
                    ${formatCurrency(finalDisplayPrice)}
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
              Để xem chi tiết bản vẽ đính kèm, tải file PDF hoặc <strong>phản hồi/mặc cả lại mức giá này</strong>, Quý khách vui lòng truy cập vào hệ thống nội bộ.
            </p>

            <div style="text-align: center; margin: 35px 0 10px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile?panel=quotations" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 35px; font-size: 15px; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); transition: all 0.3s;">
                XEM BẢN VẼ & TRẢ LỜI BÁO GIÁ
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Phòng Kỹ thuật & Báo giá - KPM Materials</p>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================================
// 3. EMAIL XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG
// ============================================================================
const sendOrderConfirmationEmail = async (email, orderData, quotationData) => {
  let itemsHtml = "";
  if (quotationData && quotationData.quotation_specs && quotationData.quotation_specs.length > 0) {
    itemsHtml = quotationData.quotation_specs.map((spec, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
          <strong>${index + 1}. ${spec.component_name || "Linh kiện"}</strong>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            - Vật tư: ${spec.materials?.material_name || "Theo TC"}<br>
            - Kích thước: ${spec.dimensions?.width || "-"} x ${spec.dimensions?.height || "-"} (mm)
          </div>
          ${spec.note ? `<div style="font-size: 12px; color: #d97706; font-style: italic; margin-top: 4px;">*${spec.note}</div>` : ""}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center; font-size: 14px;">${spec.dimensions?.quantity || 1}</td>
      </tr>
    `).join("");
  } else if (orderData && orderData.order_items && orderData.order_items.length > 0) {
    itemsHtml = orderData.order_items.map((item, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
          <strong>${index + 1}. ${item.products?.product_name || "Sản phẩm KPM"}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151; text-align: center; font-size: 14px;">${item.quantity}</td>
      </tr>
    `).join("");
  } else {
    itemsHtml = `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #6b7280; font-style: italic;">Chi tiết gia công đính kèm trong hệ thống</td></tr>`;
  }

  const subTotal = quotationData?.total_quoted_price || (orderData?.total_amount - (orderData?.shipping_fee || 0) - (orderData?.installation_fee || 0)) || orderData?.total_amount;
  const shippingFee = orderData?.shipping_fee || 0;
  const installFee = orderData?.installation_fee || 0;
  const finalTotal = orderData?.total_amount || quotationData?.total_quoted_price || 0;

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `[KPM] Xác nhận Đơn hàng #${orderData.order_code}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 35px 30px; text-align: center;">
            <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 50%; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" width="35" height="35" alt="Success" style="display: block; filter: hue-rotate(150deg) saturate(2) brightness(0.8);" />
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; text-transform: uppercase;">Đặt hàng thành công</h1>
            <p style="color: #d1fae5; font-size: 15px; margin-top: 8px;">Mã đơn: <strong>#${orderData.order_code}</strong></p>
          </div>

          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 0;">
              Xin chào Quý khách,<br><br>
              Cảm ơn Quý khách đã tin tưởng KPM Materials. Đơn hàng của Quý khách đã được hệ thống ghi nhận và đang được chuyển xuống phân xưởng để xếp lịch sản xuất.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
              <tr>
                <td width="50%" style="padding: 20px; vertical-align: top; border-right: 1px solid #e5e7eb;">
                  <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Thông tin khách hàng</h3>
                  <p style="margin: 0 0 5px 0; font-size: 15px; color: #111827;"><strong>${orderData?.customer_name || 'Khách hàng KPM'}</strong></p>
                  <p style="margin: 0; font-size: 14px; color: #4b5563;">SĐT: ${orderData?.customer_phone || 'Đã cập nhật trên hệ thống'}</p>
                </td>
                <td width="50%" style="padding: 20px; vertical-align: top;">
                  <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Địa chỉ giao hàng</h3>
                  <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                    ${orderData?.shipping_address || 'Nhận tại xưởng KPM / Theo thỏa thuận'}
                  </p>
                </td>
              </tr>
            </table>

            <h3 style="margin: 30px 0 15px 0; font-size: 16px; color: #111827; border-bottom: 2px solid #059669; padding-bottom: 8px; display: inline-block;">Chi tiết Đơn hàng</h3>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Hạng mục / Sản phẩm</th>
                  <th style="padding: 12px; text-align: center; font-size: 13px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; width: 60px;">SL</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td width="50%"></td>
                <td width="50%">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 12px; font-size: 14px; color: #4b5563; text-align: right;">Tạm tính:</td>
                      <td style="padding: 8px 12px; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">${formatCurrency(subTotal)}</td>
                    </tr>
                    ${shippingFee > 0 ? `
                    <tr>
                      <td style="padding: 8px 12px; font-size: 14px; color: #4b5563; text-align: right;">Phí vận chuyển:</td>
                      <td style="padding: 8px 12px; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">${formatCurrency(shippingFee)}</td>
                    </tr>
                    ` : ""}
                    ${installFee > 0 ? `
                    <tr>
                      <td style="padding: 8px 12px; font-size: 14px; color: #4b5563; text-align: right;">Phí lắp đặt:</td>
                      <td style="padding: 8px 12px; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">${formatCurrency(installFee)}</td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td style="padding: 15px 12px; font-size: 16px; color: #111827; text-align: right; font-weight: bold; border-top: 1px solid #e5e7eb;">TỔNG THANH TOÁN:</td>
                      <td style="padding: 15px 12px; font-size: 20px; color: #dc2626; text-align: right; font-weight: 900; border-top: 1px solid #e5e7eb;">${formatCurrency(finalTotal)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin: 35px 0 10px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/profile?panel=orders" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(5,150,105,0.25);">
                THEO DÕI TIẾN ĐỘ ĐƠN HÀNG
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KPM Materials - Công nghệ & Cơ khí chính xác</p>
          </div>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================================
// 4. EMAIL YÊU CẦU ĐẶT CỌC 10% (ĐƠN HÀNG LỚN)
// ============================================================================
const sendDepositRequestEmail = async (email, orderData) => {
  const depositAmount = orderData?.deposit_amount || 0;
  const finalTotal = orderData?.total_amount || 0;
  const customerName = orderData?.customer_name || 'Khách hàng KPM';

  const mailOptions = {
    from: `"KPM Materials" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `[KPM] Yêu cầu Đặt cọc Đơn hàng #${orderData.order_code}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; padding: 40px 10px;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; text-transform: uppercase;">Yêu cầu Đặt cọc Đơn hàng</h1>
            <p style="color: #fef3c7; font-size: 15px; margin-top: 8px;">Mã đơn: <strong>#${orderData.order_code}</strong></p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 0;">
              Xin chào <strong>${customerName}</strong>,<br><br>
              Đơn hàng của bạn có tổng giá trị <strong>${formatCurrency(finalTotal)}</strong> (Lớn hơn 20.000.000đ).<br>
              Theo quy định của KPM Materials đối với các đơn hàng giá trị lớn, quý khách vui lòng <strong>đặt cọc trước 10%</strong> giá trị đơn hàng để chúng tôi tiến hành sản xuất.
            </p>
            <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #b45309; text-transform: uppercase; font-weight: bold;">Số tiền cọc cần thanh toán</p>
              <p style="margin: 0; font-size: 28px; font-weight: 900; color: #ea580c;">${formatCurrency(depositAmount)}</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              Sau khi thanh toán cọc thành công, đơn hàng sẽ được tự động chuyển trạng thái sang <strong>Đang sản xuất</strong>. Số tiền còn lại <strong>(${formatCurrency(finalTotal - depositAmount)})</strong> sẽ được thanh toán cho nhân viên giao hàng (COD).
            </p>
            <div style="text-align: center; margin: 35px 0 10px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/deposit-payment?order_id=${orderData.id}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 35px; font-size: 15px; font-weight: bold; border-radius: 6px; text-transform: uppercase; box-shadow: 0 4px 6px rgba(234,88,12,0.25);">
                THANH TOÁN CỌC NGAY
              </a>
            </div>
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
  sendDepositRequestEmail
};