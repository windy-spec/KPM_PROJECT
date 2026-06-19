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
        const inv = await prisma.inventory.findUnique({ where: { material_id: matId }, include: { materials: true } });
        const currentStock = inv ? parseFloat(inv.quantity) : 0;

        if (currentStock < requiredQty) {
            missingMaterials.push({
                material_code: inv?.materials?.material_code || matId,
                material_name: inv?.materials?.material_name || 'Vật tư chưa rõ',
                current_stock: currentStock,
                required: requiredQty,
                missing: requiredQty - currentStock
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
                data: { quantity: { decrement: requiredQty } }
            });

            await tx.inventory_logs.create({
                data: {
                    material_id: matId,
                    action_type: "EXPORT",
                    quantity_change: -requiredQty,
                    reference_code: `ORDER_${orderId}`,
                    note: `Kho xuất vật tư sản xuất đơn hàng ${orderId}`
                }
            });
        }
        
        await tx.orders.update({
            where: { id: orderId },
            data: { production_status: "MANUFACTURING" }
        });
    });

    return { message: "Kho đã xuất hàng đủ. Lệnh sản xuất bắt đầu!" };
  }
}

module.exports = new WarehouseService();