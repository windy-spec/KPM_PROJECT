const prisma = require("../models/prisma");

class MaterialRequestService {
  async createRequest(payload) {
    const { order_id, material_id, requested_quantity, note } = payload;
    return await prisma.material_import_requests.create({
      data: {
        order_id: order_id || null,
        material_id,
        requested_quantity,
        note,
      },
    });
  }

  async getAllRequests() {
    return await prisma.material_import_requests.findMany({
      include: {
        materials: true,
        orders: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async approveRequest(requestId) {
    const request = await prisma.material_import_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu này!");
    if (request.status !== "PENDING")
      throw new Error("Chỉ có thể duyệt mua yêu cầu đang ở trạng thái Chờ xử lý (PENDING)!");

    // Chỉ cập nhật trạng thái thành APPROVED (Admin đã mua hàng)
    return await prisma.material_import_requests.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });
  }

  async receiveImport(requestId, actualQuantity) {
    const request = await prisma.material_import_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu này!");
    if (request.status !== "APPROVED")
      throw new Error("Chỉ có thể nhập kho những yêu cầu đã được Admin duyệt mua (APPROVED)!");

    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật status request thành IMPORTED
      const updatedReq = await tx.material_import_requests.update({
        where: { id: requestId },
        data: { status: "IMPORTED" },
      });

      // 2. Cộng dồn số lượng vào inventory
      await tx.inventory.upsert({
        where: { material_id: request.material_id },
        update: { quantity: { increment: actualQuantity } },
        create: {
          material_id: request.material_id,
          quantity: actualQuantity,
        },
      });

      // 3. Ghi log nhập kho để theo dõi
      await tx.inventory_logs.create({
        data: {
          material_id: request.material_id,
          action_type: "IMPORT",
          quantity_change: actualQuantity,
          reference_code: `REQ_${requestId}`,
          note: request.order_id
            ? `Kho nhận hàng từ yêu cầu nhập bù cho đơn hàng ${request.order_id}`
            : "Kho nhận vật tư từ yêu cầu nhập bổ sung",
        },
      });

      // 4. Nếu có order_id, kiểm tra xem đơn hàng đó đã đủ vật tư chưa
      if (request.order_id) {
        const order = await tx.orders.findUnique({ where: { id: request.order_id } });
        if (order && order.production_status === "out_of_stock") {
            const reqs = order.material_requirements || {};
            let isEnough = true;
            for (const [matId, reqQtyStr] of Object.entries(reqs)) {
                const reqQty = parseFloat(reqQtyStr);
                const inv = await tx.inventory.findUnique({ where: { material_id: matId } });
                const currentStock = inv ? parseFloat(inv.quantity) : 0;
                if (currentStock < reqQty) {
                    isEnough = false;
                    break;
                }
            }
            // Nếu đã đủ tất cả, ta có thể tự động chuyển sang production_ready
            // Hoặc để NV Kho tự bấm ở tab Yêu cầu xuất vật tư. Ở đây theo yêu cầu user, ta có thể tự động chuyển hoặc báo Notification.
            // Sẽ tự động chuyển để tiện lợi
            if (isEnough) {
                await tx.orders.update({
                    where: { id: request.order_id },
                    data: { production_status: "production_ready" }
                });
                await tx.order_tracking.create({
                    data: {
                        order_id: request.order_id,
                        stage_name: "production_ready",
                        stage_description: "Đã nhập đủ vật tư bù, đơn hàng sẵn sàng đưa vào sản xuất.",
                        tracked_at: new Date(),
                    }
                });
            }
        }
      }

      return updatedReq;
    });
  }
}
module.exports = new MaterialRequestService();
