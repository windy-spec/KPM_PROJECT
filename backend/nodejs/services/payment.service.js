const prisma = require("../models/prisma");
const axios = require("axios");
const { momoConfig, createSignature } = require("../utils/momo.config");
const vnpayConfig = require("../utils/vnpay.config");
const invoiceService = require("./invoice.service");
const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");

class PaymentService {
  // 1. THANH TOÁN MOMO
  async createMomoPayment(userId, { quotation_id, order_id }) {
    let amount = 0;
    let title = "";

    if (quotation_id) {
      const quotation = await prisma.quotations.findUnique({
        where: { id: quotation_id, user_id: userId },
      });
      if (!quotation) throw new Error("Không tìm thấy báo giá!");
      amount = Number(quotation.total_quoted_price);
      title = quotation.title || quotation_id;
    } else if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { id: order_id, user_id: userId },
      });
      if (!order) throw new Error("Không tìm thấy đơn hàng!");
      amount = Number(order.total_amount);
      title = order.order_code || order_id;
    } else {
      throw new Error("Vui lòng cung cấp quotation_id hoặc order_id");
    }

    const transactionCode = `KPM-MOMO-${Date.now()}`;

    // Tạo record Transaction trạng thái pending
    await prisma.transactions.create({
      data: {
        quotation_id: quotation_id || null,
        order_id: order_id || null,
        transaction_code: transactionCode,
        amount: amount,
        payment_method: "MOMO",
        status: "pending",
      },
    });

    const orderInfo = `Thanh toan KPM cho: ${title}`;
    const requestId = `${momoConfig.partnerCode}-${Date.now()}`;
    const requestType = "captureWallet";
    const extraData = Buffer.from(
      JSON.stringify({ quotation_id, order_id }),
    ).toString("base64");

    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${transactionCode}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = createSignature(rawSignature);

    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      partnerName: "KPM",
      storeId: "KPM_Store",
      requestId,
      amount: amount.toString(),
      orderId: transactionCode,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    const response = await axios.post(momoConfig.endpoint, requestBody);
    return { payUrl: response.data.payUrl, qrCodeUrl: response.data.qrCodeUrl };
  }

  // 2. THANH TOÁN TIỀN MẶT (CASH)
  async createCashPayment(userId, { quotation_id, order_id }) {
    let amount = 0;

    if (quotation_id) {
      const quotation = await prisma.quotations.findUnique({
        where: { id: quotation_id },
      });
      if (!quotation) throw new Error("Không tìm thấy báo giá!");
      amount = quotation.total_quoted_price;
    } else if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { id: order_id },
      });
      if (!order) throw new Error("Không tìm thấy đơn hàng!");
      amount = order.total_amount;
    } else {
      throw new Error("Vui lòng cung cấp quotation_id hoặc order_id");
    }

    const transaction = await prisma.transactions.create({
      data: {
        quotation_id: quotation_id || null,
        order_id: order_id || null,
        transaction_code: `KPM-CASH-${Date.now()}`,
        amount: amount,
        payment_method: "CASH",
        status: "pending", // Admin sẽ duyệt tay sau
      },
    });

    return transaction;
  }

  // 3. XỬ LÝ WEBHOOK TỪ MOMO
  async handleMomoWebhook(ipnData) {
    const { orderId, amount, resultCode, extraData, signature } = ipnData;

    // Kiểm tra chữ ký bảo mật
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${ipnData.message}&orderId=${orderId}&orderInfo=${ipnData.orderInfo}&orderType=${ipnData.orderType}&partnerCode=${ipnData.partnerCode}&payType=${ipnData.payType}&requestId=${ipnData.requestId}&responseTime=${ipnData.responseTime}&resultCode=${resultCode}&transId=${ipnData.transId}`;
    const expectedSignature = createSignature(rawSignature);

    if (signature !== expectedSignature) {
      throw new Error("Chữ ký MoMo không hợp lệ!");
    }

    const transaction = await prisma.transactions.findUnique({
      where: { transaction_code: orderId },
    });
    if (!transaction) throw new Error("Giao dịch không tồn tại!");

    // Nếu thanh toán thành công
    if (resultCode === 0) {
      await prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái transaction
        await tx.transactions.update({
          where: { id: transaction.id },
          data: { status: "success", paid_at: new Date() },
        });

        if (transaction.quotation_id) {
          // Đổi trạng thái báo giá
          await tx.quotations.update({
            where: { id: transaction.quotation_id },
            data: { status: "paid" },
          });

          // Tìm Order tương ứng để xuất Hoá Đơn
          const order = await tx.orders.findUnique({
            where: { quotation_id: transaction.quotation_id },
          });
          if (order) {
            await invoiceService.createInvoice(order.id, amount, tx); // Truyền tx để chạy trong transaction
          }
        } else if (transaction.order_id) {
          // Xuất hoá đơn luôn cho đơn hàng trực tiếp
          await invoiceService.createInvoice(transaction.order_id, amount, tx);
        }
      });
    } else {
      // Thanh toán thất bại
      await prisma.transactions.update({
        where: { id: transaction.id },
        data: { status: "failed" },
      });
    }

    return true;
  }
  // 4. THANH TOÁN CHUYỂN KHOẢN NGÂN HÀNG (VIETQR)
  async createVietQRPayment(userId, { quotation_id, order_id }) {
    let amount = 0;
    let title = "";

    if (quotation_id) {
      const quotation = await prisma.quotations.findUnique({
        where: { id: quotation_id, user_id: userId },
      });
      if (!quotation) throw new Error("Không tìm thấy báo giá!");
      amount = Number(quotation.total_quoted_price);
      title = quotation.title || quotation_id;
    } else if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { id: order_id, user_id: userId },
      });
      if (!order) throw new Error("Không tìm thấy đơn hàng!");
      amount = Number(order.total_amount);
      title = order.order_code || order_id;
    } else {
      throw new Error("Vui lòng cung cấp quotation_id hoặc order_id");
    }

    const transactionCode = `KPM-BANK-${Date.now()}`;

    // LƯU DB: Vẫn lưu đúng số tiền thật để quản lý hóa đơn
    const transaction = await prisma.transactions.create({
      data: {
        quotation_id: quotation_id || null,
        order_id: order_id || null,
        transaction_code: transactionCode,
        amount: amount,
        payment_method: "BANK_TRANSFER",
        status: "pending",
      },
    });

    const BANK_ID = "TECHCOMBANK";
    const ACCOUNT_NO = "2383823838";
    const ACCOUNT_NAME = "DO THANH PHONG";
    const TEMPLATE = "compact";
    const description = `Thanh toan KPM ${transactionCode}`.replace(
      /[^a-zA-Z0-9 ]/g,
      "",
    );

    // ==========================================
    // MẸO TEST DEMO: Ép số tiền tạo QR thành 1000đ
    // ==========================================
    const isDemoMode = true; // Bật cờ này khi đang test
    const qrAmount = isDemoMode ? 1000 : amount;

    // Truyền qrAmount vào link thay vì amount gốc
    const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${qrAmount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    return {
      transaction_code: transactionCode,
      qrCodeUrl,
      actual_amount: amount, // Báo cho FE biết tổng tiền thật
      qr_amount: qrAmount, // Báo cho FE biết tiền cần quét
      description,
      message:
        "Vui lòng quét mã QR để chuyển khoản. Admin sẽ kiểm tra và xác nhận hóa đơn của bạn.",
    };
  }

  // 5. THANH TOÁN VNPAY
  async createVnpayPayment(userId, { quotation_id, order_id, ipAddr }) {
    let amount = 0;
    let title = "";

    if (quotation_id) {
      const quotation = await prisma.quotations.findUnique({
        where: { id: quotation_id, user_id: userId },
      });
      if (!quotation) throw new Error("Không tìm thấy báo giá!");
      amount = Number(quotation.total_quoted_price);
      title = quotation.title || quotation_id;
    } else if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { id: order_id, user_id: userId },
      });
      if (!order) throw new Error("Không tìm thấy đơn hàng!");
      amount = Number(order.total_amount);
      title = order.order_code || order_id;
    } else {
      throw new Error("Vui lòng cung cấp quotation_id hoặc order_id");
    }

    const transactionCode = `KPM-VNPAY-${Date.now()}`;

    // Tạo record Transaction trạng thái pending
    await prisma.transactions.create({
      data: {
        quotation_id: quotation_id || null,
        order_id: order_id || null,
        transaction_code: transactionCode,
        amount: amount,
        payment_method: "VNPAY",
        status: "pending",
      },
    });

    let tmnCode = vnpayConfig.vnp_TmnCode;
    let secretKey = vnpayConfig.vnp_HashSecret;
    let vnpUrl = vnpayConfig.vnp_Url;
    let returnUrl = vnpayConfig.vnp_ReturnUrl;

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");
    let expireDate = moment(date).add(15, "minutes").format("YYYYMMDDHHmmss");

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = transactionCode;
    vnp_Params["vnp_OrderInfo"] = `Thanh toan KPM cho: ${title}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr || "127.0.0.1";
    vnp_Params["vnp_CreateDate"] = createDate;
    vnp_Params["vnp_ExpireDate"] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

    return { payUrl: vnpUrl };
  }

  // 6. XỬ LÝ WEBHOOK TỪ VNPAY
  async handleVnpayIpn(vnp_Params) {
    let secureHash = vnp_Params["vnp_SecureHash"];
    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];
    let amount = Number(vnp_Params["vnp_Amount"]) / 100;

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = vnpayConfig.vnp_HashSecret;
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const transaction = await prisma.transactions.findUnique({
        where: { transaction_code: orderId },
      });
      if (!transaction) return { RspCode: "01", Message: "Order not found" };
      if (transaction.status !== "pending")
        return { RspCode: "02", Message: "Order already confirmed" };

      if (rspCode === "00") {
        // Thanh toán thành công
        await prisma.$transaction(async (tx) => {
          await tx.transactions.update({
            where: { id: transaction.id },
            data: { status: "success", paid_at: new Date() },
          });

          if (transaction.quotation_id) {
            await tx.quotations.update({
              where: { id: transaction.quotation_id },
              data: { status: "paid" },
            });
            const order = await tx.orders.findUnique({
              where: { quotation_id: transaction.quotation_id },
            });
            if (order) await invoiceService.createInvoice(order.id, amount, tx);
          } else if (transaction.order_id) {
            await invoiceService.createInvoice(
              transaction.order_id,
              amount,
              tx,
            );
          }
        });
        return { RspCode: "00", Message: "Confirm Success" };
      } else {
        // Thanh toán thất bại
        await prisma.transactions.update({
          where: { id: transaction.id },
          data: { status: "failed" },
        });
        return { RspCode: "00", Message: "Success" };
      }
    } else {
      return { RspCode: "97", Message: "Invalid Checksum" };
    }
  }
}

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = new PaymentService();
