const prisma = require("../models/prisma");

class InvoiceService {
  // Hàm này được gọi tự động sau khi thanh toán thành công
  // Khuyến khích nhận biến prismaClient từ ngoài vào để hỗ trợ Transaction
  async createInvoice(orderId, totalAmount, prismaClient = prisma) {
    const existing = await prismaClient.invoices.findUnique({
      where: { order_id: orderId },
    });
    if (existing) return existing; // Tránh tạo trùng

    const invoiceNo = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    return await prismaClient.invoices.create({
      data: {
        order_id: orderId,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        email_sent_status: "pending",
      },
    });
  }

  async getUserInvoices(userId) {
    // Truy vấn Hoá đơn thông qua Order -> Quotation -> User HOẶC Order -> User (hàng thường)
    return await prisma.invoices.findMany({
      where: {
        OR: [
          { orders: { user_id: userId } },
          { orders: { quotations: { user_id: userId } } }
        ]
      },
      include: {
        orders: {
          select: {
            order_code: true,
            total_amount: true,
            quotations: { select: { title: true } },
            order_items: {
              include: { products: { select: { product_name: true } } }
            }
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
          { orders: { quotations: { user_id: userId } } }
        ]
      },
      include: {
        orders: {
          include: { 
            quotations: { include: { quotation_specs: true } },
            order_items: { include: { products: true } }
          },
        },
      },
    });
    if (!invoice) throw new Error("Không tìm thấy hoá đơn!");
    return invoice;
  }
}

module.exports = new InvoiceService();
