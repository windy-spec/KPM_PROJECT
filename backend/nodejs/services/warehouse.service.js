const prisma = require("../models/prisma");

class WarehouseService {
  async confirmOrderMaterials(orderId) {
    // 1. ĐỌC SNAPSHOT TỪ DB
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");
    if (order.production_status !== "WAITING_WAREHOUSE") {
      throw new Error("Đơn hàng này không ở trạng thái chờ xuất kho!");
    }

    const requiredMaterials = order.material_requirements || {};
    const missingMaterials = [];

    // 2. KHO KIỂM TRA TỒN DỰA TRÊN SNAPSHOT
    for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
      const requiredQty = parseFloat(requiredQtyStr);
      const inv = await prisma.inventory.findUnique({
        where: { material_id: matId },
        include: { materials: true },
      });
      const currentStock = inv ? parseFloat(inv.quantity) : 0;

      if (currentStock < requiredQty) {
        missingMaterials.push({
          material_code: inv?.materials?.material_code || matId,
          material_name: inv?.materials?.material_name || "Vật tư chưa rõ",
          current_stock: currentStock,
          required: requiredQty,
          missing: requiredQty - currentStock,
        });
      }
    }

    // 3. NẾU THIẾU HÀNG -> Gom vào Error và quăng ra ngoài
    if (missingMaterials.length > 0) {
      const error = new Error("Kho không đủ vật tư. Đã tạo danh sách báo cáo.");
      error.isMissingMaterialError = true; // Cờ (flag) để Controller nhận diện
      error.missingList = missingMaterials; // Nhét mảng thiếu vào Error
      throw error;
    }

    // 4. NẾU ĐỦ HÀNG -> Trừ tồn kho trong Transaction
    await prisma.$transaction(async (tx) => {
      for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
        const requiredQty = parseFloat(requiredQtyStr);
        await tx.inventory.update({
          where: { material_id: matId },
          data: { quantity: { decrement: requiredQty } },
        });

        await tx.inventory_logs.create({
          data: {
            material_id: matId,
            action_type: "EXPORT",
            quantity_change: -requiredQty,
            reference_code: `ORDER_${orderId}`,
            note: `Kho xuất vật tư sản xuất đơn hàng ${orderId}`,
          },
        });
      }

      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "MANUFACTURING" },
      });
    });

    return { message: "Kho đã xuất hàng đủ. Lệnh sản xuất bắt đầu!" };
  }
  // Lấy tất cả thông tin tồn kho
  async getAllInventory() {
    return await prisma.inventory.findMany({
      include: {
        materials: {
          select: {
            material_code: true,
            material_name: true,
            base_price: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    });
  }
  // Lấy thông tin tồn kho theo ID vật tư
  async getInventoryById(id) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { materials: true },
    });
    if (!inventory) throw new Error("Không tìm thấy vật tư trong kho!");
    const logs = await prisma.inventory_logs.findMany({
      where: { material_id: inventory.material_id },
      orderBy: { created_at: "desc" },
    });
    return { inventory, logs };
  }
  // Tạo mới một bản ghi tồn kho
  async createInventory(payload) {
    const { material_id, quantity = 0, leftover_amount = 0 } = payload;
    const existing = await prisma.inventory.findUnique({
      where: { material_id },
    });
    if (existing) {
      throw new Error("Vật tư đã tồn tại trong kho!");
    }
    return await prisma.inventory.create({
      data: {
        material_id,
        quantity: parseFloat(quantity),
        leftover_amount: parseFloat(leftover_amount),
      },
    });
  }
  // Cập nhật tồn kho thủ công
  async updateInventoryManual(id, payload) {
    const { quantity, leftover_amount, note } = payload;
    const inventory = await prisma.inventory.findUnique({ where: { id } });
    if (!inventory) throw new Error("Không tìm thấy vật tư trong kho!");

    const quantityChange =
      (quantity !== undefined
        ? parseFloat(quantity)
        : parseFloat(inventory.quantity)) - parseFloat(inventory.quantity);
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.update({
        where: { id },
        data: {
          quantity:
            quantity !== undefined
              ? parseFloat(quantity)
              : parseFloat(inventory.quantity),
          leftover_amount:
            leftover_amount !== undefined
              ? parseFloat(leftover_amount)
              : parseFloat(inventory.leftover_amount),
        },
      });
      await tx.inventory_logs.create({
        data: {
          material_id: inventory.material_id,
          action_type: "MANUAL_ADJUST",
          quantity_change: quantityChange,
          note: note || "Điều chỉnh tồn kho thủ công",
          reference_code: `INVENTORY_${id}`,
        },
      });
      return updated;
    });
  }
  // Tạo yêu cầu nhập hàng mới
  async requestImportMaterials(payload) {
    return await prisma.import_batches.create({
      data: {
        batch_type: "MATERIAL_REQUEST",
        status: "PENDING",
        file_name: payload.note || "Yêu cầu cấp vật tư từ kho",
      },
    });
  }
  // Xoá tồn kho (Sử dụng Transaction & Ghi Log)
  async deleteInventory(id) {
    const inventory = await prisma.inventory.findUnique({ where: { id } });
    if (!inventory) throw new Error("Không tìm thấy tồn kho để xoá!");

    return await prisma.$transaction(async (tx) => {
      // 1. Ghi log lưu vết trước khi xoá
      await tx.inventory_logs.create({
        data: {
          material_id: inventory.material_id,
          action_type: "DELETE",
          quantity_change: -parseFloat(inventory.quantity), // Trừ sạch số lượng hiện tại
          note: "Xoá hoàn toàn mã tồn kho khỏi hệ thống",
        },
      });

      // 2. Tiến hành xoá record
      await tx.inventory.delete({
        where: { id },
      });

      return { message: "Đã xoá tồn kho thành công!" };
    });
  }
}

module.exports = new WarehouseService();
