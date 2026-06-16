const prisma = require("../models/prisma");
const { sendVerifyEmail } = require("../utils/mailer.utils");
class InvoiceService {
  // Hàm này được gọi tự động sau khi thanh toán thành công
  async createInvoice(orderId, totalAmount, prismaClient = prisma) {
    // 1. Kiểm tra xem đã có hóa đơn chưa
    const existing = await prismaClient.invoices.findUnique({
      where: { order_id: orderId },
    });
    if (existing) return existing;

    const invoiceNo = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    // 2. Tạo hóa đơn
    const newInvoice = await prismaClient.invoices.create({
      data: {
        order_id: orderId,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        email_sent_status: "sent", // Đánh dấu là đã gửi
      },
    });

    // 3. Kéo thông tin User + Chi tiết Order để gửi Email
    const orderData = await prismaClient.orders.findUnique({
      where: { id: orderId },
      include: {
        users: true, // Lấy bảng users để có email
      },
    });

    if (orderData && orderData.users?.email) {
      // 4. Gửi mail hóa đơn (Bro cần tạo 1 template INVOICE trong mailer.utils)
      sendVerifyEmail(
        orderData.users.email,
        invoiceNo, // Hoặc gửi nội dung chi tiết hóa đơn
        "INVOICE", // Type email mới bro cần cấu hình thêm
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
