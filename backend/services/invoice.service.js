const prisma = require("../models/prisma");
const { sendVerifyEmail } = require("../utils/mailer.utils");
class InvoiceService {
  // Hàm này được gọi tự động sau khi thanh toán thành công
  async createInvoice(orderId, totalAmount, prismaClient = prisma, isDepositPayment = false) {
    // 1. Kiểm tra xem đã có hóa đơn chưa
    const existing = await prismaClient.invoices.findUnique({
      where: { order_id: orderId },
    });
    // Nếu có rồi và không phải cọc, return luôn. Nếu là cọc thì có thể tạo thêm hoá đơn cọc (tạm thời không thay đổi logic tạo, chỉ update nội dung email)
    // NOTE: Tạm giữ nguyên logic không tạo nhiều invoice để tránh lỗi, vì đây là Invoice duy nhất cho order này.
    // Nếu đã có invoice (VD: từ lần chạy webhook trước đó) thì bỏ qua
    if (existing) return existing;

    const invoiceNo = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    // 2. Tạo hóa đơn
    const newInvoice = await prismaClient.invoices.create({
      data: {
        order_id: orderId,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        email_sent_status: "sent",
      },
    });

    // 3. Kéo FULL thông tin User + Order + Quotation + Specs để vẽ Hóa đơn chi tiết
    const orderData = await prismaClient.orders.findUnique({
      where: { id: orderId },
      include: {
        users: { include: { user_profiles: true } },
        quotations: {
          include: {
            users: { include: { user_profiles: true } },
            quotation_specs: {
              include: { materials: true, paint_types: true }
            }
          }
        },
        order_items: {
          include: { products: true }
        }
      },
    });

    if (orderData && orderData.users?.email) {
      // 4. Gọi hàm gửi email hóa đơn và truyền FULL data vào
      sendVerifyEmail(
        orderData.users.email,
        invoiceNo,
        "INVOICE",          // Từ khóa để mailer.utils biết đây là Hóa đơn
        orderData,          // Dữ liệu Đơn hàng
        orderData.quotations,// Dữ liệu bóc tách
        isDepositPayment
      ).catch((err) => console.error("Lỗi gửi mail hóa đơn:", err));
    }

    return newInvoice;
  }

  async getUserInvoices(userId) {
    // Truy vấn Hoá đơn thông qua Order -> Quotation -> User HOẶC Order -> User (hàng thường)
    return await prisma.invoices.findMany({
      where: {
        OR: [
          { orders: { user_id: userId } },
          { orders: { quotations: { user_id: userId } } },
        ],
      },
      include: {
        orders: {
          select: {
            order_code: true,
            total_amount: true,
            quotations: { select: { title: true } },
            order_items: {
              include: { products: { select: { product_name: true } } },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getInvoiceById(invoiceId, userId) {
    const invoice = await prisma.invoices.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { orders: { user_id: userId } },
          { orders: { quotations: { user_id: userId } } },
        ],
      },
      include: {
        orders: {
          include: {
            quotations: { include: { quotation_specs: true } },
            order_items: { include: { products: true } },
          },
        },
      },
    });
    if (!invoice) throw new Error("Không tìm thấy hoá đơn!");
    return invoice;
  }
}

module.exports = new InvoiceService();
