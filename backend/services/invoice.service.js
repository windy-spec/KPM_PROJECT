const prisma = require("../models/prisma");
const { sendVerifyEmail } = require("../utils/mailer.utils");
class InvoiceService {
  // Hàm này được gọi tự động sau khi thanh toán thành công
  async createInvoice(
    orderId,
    totalAmount,
    prismaClient = prisma,
    invoiceType = "TOTAL",
  ) {
    // 1. Kiểm tra xem đã có hóa đơn loại này chưa
    const existing = await prismaClient.invoices.findFirst({
      where: { order_id: orderId, invoice_type: invoiceType },
    });

    if (existing) return existing;

    const invoiceNo = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    // 2. Tạo hóa đơn
    const newInvoice = await prismaClient.invoices.create({
      data: {
        order_id: orderId,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        invoice_type: invoiceType,
        status: "PAID",
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
              include: { materials: true, paint_types: true },
            },
          },
        },
        order_items: {
          include: { products: true },
        },
      },
    });

    if (orderData && orderData.users?.email) {
      // 4. Gọi hàm gửi email hóa đơn và truyền FULL data vào
      sendVerifyEmail(
        orderData.users.email,
        invoiceNo,
        invoiceType === "DEPOSIT"
          ? "DEPOSIT_INVOICE"
          : invoiceType === "PHASE_2"
            ? "PHASE2_INVOICE"
            : "INVOICE",
        orderData, // Dữ liệu Đơn hàng
        orderData.quotations, // Dữ liệu bóc tách
        invoiceType === "DEPOSIT",
      ).catch((err) => console.error("Lỗi gửi mail hóa đơn:", err));
    }

    return newInvoice;
  }

  async createTotalInvoice(orderId, prismaClient = prisma) {
    const order = await prismaClient.orders.findUnique({
      where: { id: orderId },
    });
    if (!order) return null;

    const existingTotal = await prismaClient.invoices.findFirst({
      where: { order_id: orderId, invoice_type: "TOTAL" },
    });
    if (existingTotal) return existingTotal;

    const invoiceNo = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInvoice = await prismaClient.invoices.create({
      data: {
        order_id: orderId,
        invoice_no: invoiceNo,
        total_amount: order.total_amount,
        invoice_type: "TOTAL",
        status: "PAID",
        email_sent_status: "sent",
      },
    });

    // Cập nhật parent_invoice_id cho các hoá đơn con
    await prismaClient.invoices.updateMany({
      where: {
        order_id: orderId,
        invoice_type: { in: ["DEPOSIT", "PHASE_2"] },
      },
      data: { parent_invoice_id: newInvoice.id },
    });

    // Gửi email hoá đơn tổng
    const orderData = await prismaClient.orders.findUnique({
      where: { id: orderId },
      include: {
        users: { include: { user_profiles: true } },
        quotations: {
          include: {
            users: { include: { user_profiles: true } },
            quotation_specs: {
              include: { materials: true, paint_types: true },
            },
          },
        },
        order_items: { include: { products: true } },
      },
    });

    if (orderData && orderData.users?.email) {
      sendVerifyEmail(
        orderData.users.email,
        invoiceNo,
        "TOTAL_INVOICE",
        orderData,
        orderData.quotations,
        false,
      ).catch((err) => console.error("Lỗi gửi mail hóa đơn tổng:", err));
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
  // 📝 Đề bài: Xử lý danh sách đơn hàng giá trị cao
  // Bạn cần viết một hàm tên là getHighValueCompletedOrders().
  // Yêu cầu nghiệp vụ:
  // Lấy dữ liệu từ Database thông qua prisma.orders.findMany(...).
  // Kiểm tra: Nếu danh sách rỗng (không tìm thấy bất kỳ đơn hàng nào dưới DB),
  // hãy quăng ra một lỗi (throw Error): "Không có đơn hàng nào trong hệ thống!".
  // Chỉ trả về mảng kết quả gồm những đơn hàng thỏa mãn đồng thời 2 điều kiện sau:
  // Trạng thái (status) của đơn hàng là: "COMPLETED"
  // Tổng tiền (total_amount) phải lớn hơn 500000
  async getHighValueCompletedOrders() {
    const orders = await prisma.orders.findMany({});
    if (orders.length === 0) {
      throw new Error("Không có đơn hàng nào trong hệ thống!");
    }
    const list = [];
    for (const order of orders) {
      if (
        order.production_status === "COMPLETED" &&
        order.total_amount > 500000
      ) {
        list.push(order);
      }
      return list;
    }
  }
}

module.exports = new InvoiceService();
