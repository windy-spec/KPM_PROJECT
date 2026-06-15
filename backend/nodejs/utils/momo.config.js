const crypto = require("crypto");

const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey:   process.env.MOMO_ACCESS_KEY   || "F8BBA842ECF85",
  secretKey:   process.env.MOMO_SECRET_KEY   || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint:    process.env.MOMO_API_URL      || "https://test-payment.momo.vn/v2/gateway/api/create",
  // Nhớ cập nhật ngrok/localtunnel URL vào MOMO_IPN_URL trong .env khi test local!
  ipnUrl:      process.env.MOMO_IPN_URL      || "https://silver-icons-repair.loca.lt/api/payments/momo-webhook",
  redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:5173/payment-result",
};


const createSignature = (rawSignature) => {
  return crypto
    .createHmac("sha256", momoConfig.secretKey)
    .update(rawSignature)
    .digest("hex");
};

module.exports = { momoConfig, createSignature };
