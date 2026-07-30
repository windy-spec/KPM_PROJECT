const prisma = require("../models/prisma");

class OrderService {
  // LẤY TOÀN BỘ ĐƠN HÀNG DÀNH CHO ADMIN
  async getAllOrders() {
    const orders = await prisma.orders.findMany({
      include: {
        users: { select: { id: true, username: true, email: true } },
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } },
            quotation_specs: {
              include: {
                materials: true,
                material_thickness: true
              }
            },
            quotation_attachments: true,
            // Đã xóa product_drawings lỗi ở đây
          },
        },
        order_items: {
          include: {
            products: {
              include: {
                product_drawings: {
                  include: {
                    drawing_parts: true,
                  }
                },
              },
            },
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    // TỐI ƯU HÓA (Xóa bỏ vòng lặp N+1 query)
    const allProductIds = [];
    orders.forEach(order => {
      if (order.quotations && order.quotations.quotation_specs) {
        order.quotations.quotation_specs.forEach(spec => {
          if (spec.dimensions?.product_id) allProductIds.push(spec.dimensions.product_id);
        });
      }
    });

    let drawingsMap = {};
    if (allProductIds.length > 0) {
      const allDrawings = await prisma.product_drawings.findMany({
        where: { product_id: { in: allProductIds }, is_active: true },
        include: { drawing_parts: true },
      });
      drawingsMap = allDrawings.reduce((acc, dwg) => {
        if (!acc[dwg.product_id]) acc[dwg.product_id] = [];
        acc[dwg.product_id].push(dwg);
        return acc;
      }, {});
    }

    for (const order of orders) {
      if (order.quotations && order.quotations.quotation_specs) {
        const productIds = order.quotations.quotation_specs
          .map((spec) => spec.dimensions?.product_id)
          .filter(Boolean);

        if (productIds.length > 0) {
          order.quotations.product_drawings = productIds.flatMap(id => drawingsMap[id] || []);
        } else {
          order.quotations.product_drawings = [];
        }
      }
    }
    
    // FETCH IMAGES FOR ALL PRODUCT IDS
    if (allProductIds.length > 0) {
      const allImages = await prisma.product_images.findMany({
        where: { product_id: { in: allProductIds }, is_primary: true },
      });
      const imagesMap = allImages.reduce((acc, img) => {
        if (!acc[img.product_id]) acc[img.product_id] = [];
        acc[img.product_id].push(img);
        return acc;
      }, {});
      for (const order of orders) {
        if (order.quotations && order.quotations.quotation_specs) {
          const productIds = order.quotations.quotation_specs
            .map((spec) => spec.dimensions?.product_id)
            .filter(Boolean);
          order.quotations.product_images = productIds.flatMap(id => imagesMap[id] || []);
        }
      }
    }

    return orders;
  }
  // LẤY CHI TIẾT ĐƠN HÀNG THEO ID
  async getOrderById(id) {
    const order = await prisma.orders.findUnique({
      where: { id: id },
      include: {
        users: { select: { id: true, username: true, email: true } },
        quotations: {
          include: {
            users: { select: { id: true, username: true, email: true } },
            quotation_specs: true,
            quotation_attachments: true,
          },
        },
        order_items: {
          include: {
            products: {
              include: {
                product_drawings: {
                  include: {
                    drawing_parts: true,
                  }
                },
              },
            },
          },
        },
        transactions: true,
        invoices: true,
        order_tracking: true,
      },
    });

    if (order && order.quotations && order.quotations.quotation_specs) {
      const productIds = order.quotations.quotation_specs
        .map((spec) => spec.dimensions?.product_id)
        .filter(Boolean);

      if (productIds.length > 0) {
        const [drawings, images] = await Promise.all([
          prisma.product_drawings.findMany({
            where: { product_id: { in: productIds }, is_active: true },
            include: { drawing_parts: true },
          }),
          prisma.product_images.findMany({
            where: { product_id: { in: productIds }, is_primary: true },
          })
        ]);
        order.quotations.product_drawings = drawings;
        order.quotations.product_images = images;
      } else {
        order.quotations.product_drawings = [];
        order.quotations.product_images = [];
      }
    }

    return order;
  }
  // LẤY DANH SÁCH ĐƠN HÀNG CỦA USER HIỆN TẠI
  async getMyOrders(userId) {
    const orders = await prisma.orders.findMany({
      where: {
        OR: [{ user_id: userId }, { quotations: { user_id: userId } }],
      },
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, username: true, email: true } },
        quotations: {
          include: {
            quotation_specs: {
              include: {
                materials: true,
                material_thickness: true
              }
            },
            quotation_attachments: true,
          },
        },
        order_items: {
          include: {
            products: {
              include: {
                product_images: true,
                product_drawings: {
                  include: {
                    drawing_parts: true,
                  }
                },
              },
            },
          },
        },
      },
    });

    // Lấy thông tin vật tư để map vào components
    const materials = await prisma.materials.findMany({
      include: { material_thickness: true }
    });
    const materialMap = {};
    materials.forEach(m => {
      materialMap[m.id] = m;
    });

    for (const order of orders) {
      if (order.quotations && order.quotations.quotation_specs) {
        const productIds = order.quotations.quotation_specs
          .map((spec) => spec.dimensions?.product_id)
          .filter(Boolean);

        if (productIds.length > 0) {
          const [drawings, images] = await Promise.all([
            prisma.product_drawings.findMany({
              where: { product_id: { in: productIds }, is_active: true },
              include: { drawing_parts: true },
            }),
            prisma.product_images.findMany({
              where: { product_id: { in: productIds }, is_primary: true },
            })
          ]);
          order.quotations.product_drawings = drawings;
          order.quotations.product_images = images;
        } else {
          order.quotations.product_drawings = [];
          order.quotations.product_images = [];
        }
      }

      // Map material_name vào components của products
      if (order.order_items) {
        order.order_items.forEach(item => {
          if (item.products && item.products.components) {
            item.products.components = item.products.components.map(comp => {
              const mat = materialMap[comp.material_id];
              if (mat) {
                comp.material_name = mat.material_name;
                if (comp.thickness_id) {
                  const thk = mat.material_thickness.find(t => t.id === comp.thickness_id);
                  if (thk) comp.thickness_value = thk.thickness_value;
                }
              }
              return comp;
            });
          }
        });
      }
    }

    return orders;
  }
  // Tạo đơn hàng trực tiếp (không qua báo giá)
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
  } 
  // Cập nhật thông tin giao hàng & các loại phí trước khi thanh toán
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

    const materialAmount =
      final_total - (shipping_fee || 0) - (installation_fee || 0);
    // Ưu tiên dùng cờ is_deposit từ client truyền lên, nếu không có thì fallback
    const isDepositRequired =
      payload.is_deposit !== undefined
        ? payload.is_deposit
        : materialAmount >= 10000000;
    const depositAmount = isDepositRequired ? materialAmount * 0.1 : 0;

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
        deposit_amount: depositAmount,
        is_deposit_required: isDepositRequired,
      },
    });
  }
  // Cập nhật thông tin giao hàng & các loại phí trước khi thanh toán
  async updateOrderStatus(orderId, payload) {
    const { status, stage_name, stage_description } = payload;

    // Kiểm tra tồn tại đh
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Đơn hàng không tồn tại!");

    // VALIDATE CHUYỂN TRẠNG THÁI
    // Ví dụ: chỉ cho phép chuyển từ out_of_stock sang import_approved
    if (
      order.production_status === "out_of_stock" &&
      status !== "import_approved"
    ) {
      throw new Error(
        "Đơn hàng đang hết vật tư, chỉ có thể chuyển sang trạng thái import_approved!",
      );
    }

    // Transaction lỗi sẽ không bị thừa
    return await prisma.$transaction(async (tx) => {
      // cập nhật trạng thái tổng

      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { production_status: status },
        include: { quotations: true },
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
  // Cập nhật trạng thái đơn hàng & ghi log vào order_tracking 
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
          include: { products: true },
        },
        quotations: {
          include: { quotation_specs: true },
        },
      },
    });

    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    const requiredMaterials = {};

    // TÍNH TOÁN CHO ĐƠN HÀNG TRỰC TIẾP (CÓ ORDER_ITEMS)
    for (const item of order.order_items) {
      // products.components là mảng JSON
      const components = item.products?.components || [];
      const productQty = item.quantity || 1;

      for (const comp of components) {
        const matId = comp.material_id;
        const thickId = comp.thickness_id;
        const reqKey = thickId ? `${matId}_${thickId}` : matId;

        // Lấy định mức tuyệt đối
        let waste = 0;
        if (
          matId &&
          comp.waste_configs &&
          comp.waste_configs[matId] &&
          comp.waste_configs[matId].rate !== undefined
        ) {
          waste = parseFloat(comp.waste_configs[matId].rate);
        } else {
          waste =
            parseFloat(comp.default_waste) || parseFloat(comp.waste_rate) || 0;
        }

        const consumedQty = waste * productQty;

        if (matId && consumedQty > 0) {
          if (!requiredMaterials[reqKey]) requiredMaterials[reqKey] = 0;
          requiredMaterials[reqKey] += consumedQty;
        }
      }
    }

    // TÍNH TOÁN CHO ĐƠN HÀNG BÁO GIÁ TÙY CHỈNH (CÓ QUOTATION_SPECS)
    if (order.quotations && order.quotations.quotation_specs) {
      for (const spec of order.quotations.quotation_specs) {
        const matId = spec.material_id;
        const thickId = spec.thickness_id;
        const reqKey = thickId ? `${matId}_${thickId}` : matId;
        if (!matId) continue;

        let consumedQty = 0;
        if (spec.dimensions) {
          const area = parseFloat(spec.dimensions.area) || 0;
          const qty = parseFloat(spec.dimensions.quantity) || 1;

          if (
            matId &&
            spec.dimensions.waste_configs &&
            spec.dimensions.waste_configs[matId] &&
            spec.dimensions.waste_configs[matId].rate !== undefined
          ) {
            const waste = parseFloat(spec.dimensions.waste_configs[matId].rate);
            consumedQty = waste * qty;
          } else if (spec.dimensions.waste_rate) {
            const waste = parseFloat(spec.dimensions.waste_rate);
            consumedQty = waste * qty;
          } else {
            // Mặc định hao hụt 5% (1.05) giống như tính toán báo giá cũ
            consumedQty = area * qty * 1.05;
          }
        }

        if (consumedQty > 0) {
          if (!requiredMaterials[reqKey]) requiredMaterials[reqKey] = 0;
          requiredMaterials[reqKey] += consumedQty;
        }
      }
    }

    // Đổi trạng thái và LƯU SNAPSHOT (Lưu vĩnh viễn bảng vật tư cần dùng vào cột material_requirements)
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        production_status: "WAITING_WAREHOUSE",
        material_requirements: requiredMaterials,
      },
    });

    if (global.io) {
      global.io.to("room_warehouse").emit("new_warehouse_request", {
        message: `Có lệnh sản xuất mới #${orderId.slice(0, 8)} cần chuẩn bị vật tư!`,
        orderId: orderId,
      });
    }

    return requiredMaterials;
  }
}

module.exports = new OrderService();
