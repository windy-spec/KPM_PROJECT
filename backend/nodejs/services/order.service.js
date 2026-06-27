const prisma = require("../models/prisma");

class OrderService {
  async getAllOrders() {
    return await prisma.orders.findMany({
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
            quotation_specs: true,
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getOrderById(id) {
    return await prisma.orders.findUnique({
      where: { id: id }, // Đã xóa parseInt(id)
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
            quotation_specs: true,
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
    });
  }

  async getMyOrders(userId) {
    return await prisma.orders.findMany({
      where: {
        OR: [{ user_id: userId }, { quotations: { user_id: userId } }],
      },
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, username: true, email: true } }, // Đã xóa phone
        quotations: {
          include: {
            quotation_specs: true,
          },
        },
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });
  }
  async createDirectOrder(userId, payload) {
    const { product_id, quantity, price } = payload;

    // 1. Tạo đơn hàng mới thẳng vào DB
    const newOrder = await prisma.orders.create({
      data: {
        users: { connect: { id: userId } },
        total_amount: price * quantity,
        order_code: `KPM-ORD-${Date.now()}`,
        production_status: "pending_payment",
      },
    });

    // 2. Tạo chi tiết đơn hàng
    await prisma.order_items.create({
      data: {
        orders: { connect: { id: newOrder.id } },
        products: { connect: { id: product_id } },
        quantity: quantity,
        price: price,
      },
    });

    return newOrder;
  } // THÊM MỚI: Cập nhật thông tin giao hàng & các loại phí trước khi thanh toán
  async updateCheckoutInfo(orderId, userId, payload) {
    const {
      customer_name,
      customer_phone,
      shipping_address,
      order_notes,
      shipping_fee,
      installation_fee,
      final_total,
    } = payload;

    // Kiểm tra xem đơn hàng có tồn tại không
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error("Không tìm thấy đơn hàng để thanh toán!");

    // Cập nhật thông tin Snapshot vào DB
    return await prisma.orders.update({
      where: { id: orderId },
      data: {
        customer_name,
        customer_phone,
        shipping_address,
        order_notes,
        shipping_fee: shipping_fee || 0,
        installation_fee: installation_fee || 0,
        total_amount: final_total, // Trọng tâm: Cập nhật đè tổng tiền để MoMo/VNPay lấy đúng số này!
      },
    });
  }
  async updateOrderStatus(orderId, payload) {
    const { status, stage_name, stage_description } = payload;

    // Kiểm tra tồn tại đh
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Đơn hàng không tồn tại!");

    // VALIDATE CHUYỂN TRẠNG THÁI
    // Ví dụ: chỉ cho phép chuyển từ out_of_stock sang import_approved
    if (order.production_status === "out_of_stock" && status !== "import_approved") {
      throw new Error("Đơn hàng đang hết vật tư, chỉ có thể chuyển sang trạng thái import_approved!");
    }

    // Transaction lỗi sẽ không bị thừa
    return await prisma.$transaction(async (tx) => {
      // cập nhật trạng thái tổng

      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { production_status: status },
        include: { quotations: true }
      });

      // Ghi log trạng thái
      if (stage_name) {
        await tx.order_tracking.create({
          data: {
            order_id: orderId,
            stage_name: stage_name,
            stage_description: stage_description || "",
            tracked_at: new Date(), // Lưu mốc thời gian rõ ràng để tính 3 ngày giao hàng
          },
        });
      }
      return updatedOrder;
    });
  }
  async getOrderTracking(orderID) {
    return await prisma.order_tracking.findMany({
      where: { order_id: orderID },
      orderBy: { tracked_at: "desc" },
    });
  }

  // API Duyệt Đơn của Admin -> Tính 1 lần & Lưu Snapshot
  async approveOrderAndRequestMaterials(orderId) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: {
          include: { products: true }
        }
      }
    });

    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    const requiredMaterials = {};

    // TÍNH TOÁN (CHỈ LÀM DUY NHẤT Ở ĐÂY)
    for (const item of order.order_items) {
      // products.components là mảng JSON
      const components = item.products?.components || [];
      const productQty = item.quantity || 1;

      for (const comp of components) {
        const matId = comp.material_id;

        // Sửa lỗi: Lấy định mức tuyệt đối (ưu tiên lấy từ waste_configs, nếu không có thì lấy default_waste hoặc waste_rate)
        let waste = 0;
        if (matId && comp.waste_configs && comp.waste_configs[matId] && comp.waste_configs[matId].rate !== undefined) {
          waste = parseFloat(comp.waste_configs[matId].rate);
        } else {
          waste = parseFloat(comp.default_waste) || parseFloat(comp.waste_rate) || 0;
        }

        const consumedQty = waste * productQty;

        if (matId && consumedQty > 0) {
          if (!requiredMaterials[matId]) requiredMaterials[matId] = 0;
          requiredMaterials[matId] += consumedQty;
        }
      }
    }

    // Đổi trạng thái và LƯU SNAPSHOT (Lưu vĩnh viễn bảng vật tư cần dùng vào cột material_requirements)
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        production_status: "WAITING_WAREHOUSE",
        material_requirements: requiredMaterials
      }
    });

    return requiredMaterials;
  }
}

module.exports = new OrderService();
