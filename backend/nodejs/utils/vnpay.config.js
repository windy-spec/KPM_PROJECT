// utils/vnpay.config.js
module.exports = {
  vnp_TmnCode:    process.env.VNPAY_TMN_CODE    || "D8RIU82N",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "9BH1NF4MA3PAIFPUEVH2N534N6NOSF6H",
  vnp_Url:        process.env.VNPAY_URL          || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_Api:        process.env.VNPAY_API          || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  vnp_ReturnUrl:  process.env.VNPAY_RETURN_URL   || "http://localhost:5173/payment-result",
};
