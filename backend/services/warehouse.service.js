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
      const [actualMatId, actualThickId] = matId.split('_');
      const inv = await prisma.inventory.findFirst({
        where: { material_id: actualMatId, thickness_id: actualThickId || null },
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
        const [actualMatId, actualThickId] = matId.split('_');
        await tx.inventory.updateMany({
          where: { material_id: actualMatId, thickness_id: actualThickId || null },
          data: { quantity: { decrement: requiredQty } },
        });

        await tx.inventory_logs.create({
          data: {
            material_id: actualMatId || matId,
            action_type: "EXPORT",
            quantity_change: -requiredQty,
            reference_code: `ORDER_${orderId}`,
            note: `Kho xuất vật tư sản xuất đơn hàng ${orderId}`,
          },
        });
      }

      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "EXPORTING_WAREHOUSE" },
      });
    });

    return {
      message: "Kho đã xác nhận xuất hàng. Đơn hàng chuyển sang Kiểm xuất kho!",
    };
  }

  // Chuyển từ "Kiểm xuất kho" sang "Đang sản xuất"
  async completeOrderExport(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");
    if (order.production_status !== "EXPORTING_WAREHOUSE") {
      throw new Error("Đơn hàng này không ở trạng thái kiểm xuất kho!");
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { production_status: "MANUFACTURING" },
    });

    return { message: "Hoàn tất kiểm xuất kho. Lệnh sản xuất bắt đầu!" };
  }
  // ==========================================
  // CÁC HÀM ĐIỀU HƯỚNG TRẠNG THÁI ĐƠN HÀNG MỚI
  // ==========================================

  // 1. Tiếp nhận đơn (admin_approved -> warehouse_received)
  async receiveOrder(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "warehouse_received" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "warehouse_received",
          stage_description:
            "Kho đã tiếp nhận đơn hàng, đang chuẩn bị kiểm tra vật tư.",
          tracked_at: new Date(),
        },
      });
    });
    return { message: "Đã tiếp nhận đơn hàng thành công!", order: order };
  }

  // 2. Đủ hàng -> Bắt đầu sản xuất (warehouse_received -> production_ready)
  async confirmSufficientStock(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    const requiredMaterials = order.material_requirements || {};
    const missingMaterials = [];

    // Kiểm tra tồn
    for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
      const requiredQty = parseFloat(requiredQtyStr);
      const [actualMatId, actualThickId] = matId.split('_');
      let inv = await prisma.inventory.findFirst({
        where: { material_id: actualMatId, thickness_id: actualThickId || null },
        include: { materials: true },
      });
      if (!inv && actualThickId) {
        inv = await prisma.inventory.findFirst({
          where: { material_id: actualMatId, thickness_id: null },
          include: { materials: true },
        });
      }
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

    if (missingMaterials.length > 0) {
      const error = new Error(
        "Hệ thống đối soát thấy vật tư hiện tại không đủ!",
      );
      error.isMissingMaterialError = true;
      error.missingList = missingMaterials;
      throw error;
    }

    // Đủ hàng -> Trừ tồn kho và cập nhật status
    await prisma.$transaction(async (tx) => {
      for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
        const requiredQty = parseFloat(requiredQtyStr);
        const [actualMatId, actualThickId] = matId.split('_');
        let inv = await tx.inventory.findFirst({
          where: { material_id: actualMatId, thickness_id: actualThickId || null },
        });
        if (!inv && actualThickId) {
          inv = await tx.inventory.findFirst({
            where: { material_id: actualMatId, thickness_id: null },
          });
        }
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: requiredQty } },
          });
        }

        await tx.inventory_logs.create({
          data: {
            material_id: actualMatId || matId,
            action_type: "EXPORT",
            quantity_change: -requiredQty,
            reference_code: `ORDER_${orderId}`,
            note: `Kho xuất vật tư sản xuất đơn hàng ${orderId}`,
          },
        });
      }

      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "production_ready" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "production_ready",
          stage_description: "Đã xác nhận đủ vật tư, sẵn sàng sản xuất.",
          tracked_at: new Date(),
        },
      });
    });

    return {
      message: "Xác nhận đủ vật tư, đơn hàng chuyển sang Sẵn sàng sản xuất!",
      order: order,
    };
  }

  // 3. Thiếu hàng -> Báo cáo thiếu (chuyển sang out_of_stock)
  async reportOutOfStock(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    const requiredMaterials = order.material_requirements || {};
    let isReallyMissing = false;

    // Tính toán lượng thiếu cho từng loại vật tư để kiểm chứng
    for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
      const requiredQty = parseFloat(requiredQtyStr);
      const [actualMatId, actualThickId] = matId.split('_');
      let inv = await prisma.inventory.findFirst({
        where: { material_id: actualMatId, thickness_id: actualThickId || null },
      });
      if (!inv && actualThickId) {
        inv = await prisma.inventory.findFirst({
          where: { material_id: actualMatId, thickness_id: null },
        });
      }
      const currentStock = inv ? parseFloat(inv.quantity) : 0;

      if (currentStock < requiredQty) {
        isReallyMissing = true;
        break;
      }
    }

    if (!isReallyMissing) {
      throw new Error(
        "Toàn bộ vật tư cho đơn hàng này đã đầy đủ, không thể báo thiếu!",
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "out_of_stock" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "out_of_stock",
          stage_description:
            "Phát hiện thiếu vật tư, chờ NV Kho lập phiếu yêu cầu nhập thêm.",
          tracked_at: new Date(),
        },
      });
    });
    return { message: "Đã báo cáo thiếu vật tư thành công!", order: order };
  }

  // 4. Đã nhập hàng & Cập nhật tồn kho (import_approved -> production_ready)
  async completeImportAndReady(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    const requiredMaterials = order.material_requirements || {};

    await prisma.$transaction(async (tx) => {
      // Trừ tồn kho như confirmSufficientStock
      for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
        const requiredQty = parseFloat(requiredQtyStr);
        const [actualMatId, actualThickId] = matId.split('_');
        let inv = await tx.inventory.findFirst({
          where: { material_id: actualMatId, thickness_id: actualThickId || null },
        });
        if (!inv && actualThickId) {
          inv = await tx.inventory.findFirst({
            where: { material_id: actualMatId, thickness_id: null },
          });
        }
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: { decrement: requiredQty } },
          });
        }

        await tx.inventory_logs.create({
          data: {
            material_id: actualMatId || matId,
            action_type: "EXPORT",
            quantity_change: -requiredQty,
            reference_code: `ORDER_${orderId}`,
            note: `Kho xuất vật tư (sau khi nhập bù) sản xuất đơn hàng ${orderId}`,
          },
        });
      }

      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "production_ready" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "production_ready",
          stage_description:
            "Đã nhập đủ vật tư bù, chuyển sang trạng thái sẵn sàng sản xuất.",
          tracked_at: new Date(),
        },
      });
    });

    return {
      message: "Cập nhật tồn kho và chuyển trạng thái sản xuất thành công!",
      order: order,
    };
  }

  // 4.5. Bắt đầu sản xuất (production_ready -> producing)
  async startProduction(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "producing" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "producing",
          stage_description: "Đơn hàng đang được tiến hành sản xuất.",
          tracked_at: new Date(),
        },
      });
    });

    return {
      message: "Đã đưa đơn hàng vào trạng thái đang sản xuất!",
      order: order,
    };
  }

  // 5. Gia công xong (producing -> production_completed)
  async completeProduction(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: { production_status: "production_completed" },
      });
      await tx.order_tracking.create({
        data: {
          order_id: orderId,
          stage_name: "production_completed",
          stage_description: "Gia công hoàn tất, đã gửi báo cáo nghiệm thu.",
          tracked_at: new Date(),
        },
      });
    });

    return {
      message: "Gia công hoàn tất, đã gửi báo cáo nghiệm thu!",
      order: order,
    };
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
        material_thickness: true,
      },
      orderBy: { updated_at: "desc" },
    });
  }

  // Lấy danh sách lịch sử phiếu xuất kho
  async getExportHistory() {
    const exportLogs = await prisma.inventory_logs.findMany({
      where: {
        action_type: "EXPORT",
      },
      include: {
        materials: {
          select: {
            material_code: true,
            material_name: true,
            material_units: {
              select: {
                unit_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const groupedInvoices = new Map();

    for (const log of exportLogs) {
      const groupKey = log.reference_code || "SYSTEM_EXPORT";

      if (!groupedInvoices.has(groupKey)) {
        const orderId = groupKey.startsWith("ORDER_")
          ? groupKey.replace("ORDER_", "")
          : null;

        groupedInvoices.set(groupKey, {
          group_key: groupKey,
          reference_code: log.reference_code || groupKey,
          order_id: orderId,
          created_at: log.created_at,
          items: [],
        });
      }

      const invoice = groupedInvoices.get(groupKey);
      invoice.items.push({
        id: log.id,
        material_id: log.material_id,
        material_code: log.materials?.material_code || "N/A",
        material_name: log.materials?.material_name || "N/A",
        unit_name: log.materials?.material_units?.unit_name || "Cai",
        quantity_change: parseFloat(log.quantity_change),
        note: log.note || "",
        created_at: log.created_at,
      });
    }

    return Array.from(groupedInvoices.values()).map((invoice) => ({
      ...invoice,
      items: invoice.items.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }),
      total_items: invoice.items.length,
      total_quantity: invoice.items.reduce(
        (sum, item) => sum + Math.abs(Number(item.quantity_change) || 0),
        0,
      ),
    }));
  }

  // Lấy danh sách tồn kho sắp hết (dưới 20)
  async getLowStock() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lt: 20, // Threshold = 20
        },
      },
      include: {
        materials: {
          select: {
            material_code: true,
            material_name: true,
          },
        },
      },
      orderBy: { quantity: "asc" },
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
            thickness_id: inventory.thickness_id || null,
            action_type: "MANUAL_ADJUST",
          quantity_change: quantityChange,
          note: note || "Điều chỉnh tồn kho thủ công",
          reference_code: `INVENTORY_${id}`,
        },
      });
      return updated;
    });
  }
  // Tạo yêu cầu nhập hàng mới thủ công từ form Kho
  async requestImportMaterials(payload) {
    const { items, note } = payload;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Vui lòng chọn ít nhất 1 vật tư để yêu cầu!");
    }

    const dataToInsert = items.map((item) => ({
      order_id: item.order_id || null,
      material_id: item.material_id,
        thickness_id: item.thickness_id || null,
      requested_quantity: parseFloat(item.requested_quantity),
      note: note || "Yêu cầu cấp vật tư bổ sung từ kho",
      status: "PENDING",
    }));

    return await prisma.material_import_requests.createMany({
      data: dataToInsert,
    });
  }

  // Nhận hàng từ yêu cầu nhập vật tư, cập nhật thực nhập và tồn kho trước/sau
  async confirmImportRequest(requestId, actualQuantity) {
    const request = await prisma.material_import_requests.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu này!");
    if (request.status !== "APPROVED")
      throw new Error(
        "Chỉ có thể nhập kho những yêu cầu đã được Admin duyệt mua (APPROVED)!",
      );

    return await prisma.$transaction(async (tx) => {
      // 1. Get current inventory
      let whereClause = { material_id: request.material_id };
        if (request.thickness_id) whereClause.thickness_id = request.thickness_id;
        else whereClause.thickness_id = null;
        const inv = await tx.inventory.findFirst({ where: whereClause });
      const inventory_before = inv ? parseFloat(inv.quantity) : 0;
      const inventory_after = inventory_before + actualQuantity;

      // 2. Update material_import_requests
      const updatedReq = await tx.material_import_requests.update({
        where: { id: requestId },
        data: {
          status: "IMPORTED",
          actual_quantity: actualQuantity,
          inventory_before: inventory_before,
          inventory_after: inventory_after,
        },
      });

      // 3. Update inventory
      const existingInv = await tx.inventory.findFirst({ where: whereClause });
      if (existingInv) {
        await tx.inventory.update({
          where: { id: existingInv.id },
          data: { quantity: inventory_after }
        });
      } else {
        await tx.inventory.create({
          data: {
            material_id: request.material_id,
            thickness_id: request.thickness_id || null,
            quantity: inventory_after
          }
        });
      }

      // 4. Log inventory
      await tx.inventory_logs.create({
        data: {
          material_id: request.material_id,
            thickness_id: request.thickness_id || null,
            action_type: "IMPORT",
          quantity_change: actualQuantity,
          reference_code: `REQ_${requestId}`,
          note: request.order_id
            ? `Kho nhận hàng từ yêu cầu nhập bù cho đơn hàng ${request.order_id}`
            : "Kho nhận vật tư từ yêu cầu nhập bổ sung",
        },
      });

      // 5. Nếu có order_id, kiểm tra xem đơn hàng đó đã đủ vật tư chưa
      if (request.order_id) {
        const order = await tx.orders.findUnique({
          where: { id: request.order_id },
        });
        if (order && order.production_status === "out_of_stock") {
          const reqs = order.material_requirements || {};
          let isEnough = true;
          for (const [matId, reqQtyStr] of Object.entries(reqs)) {
            const reqQty = parseFloat(reqQtyStr);
            
            let actualMatId = matId;
            let actualThickId = null;
            if (matId.includes('_')) {
              [actualMatId, actualThickId] = matId.split('_');
            }
            
            const whereClause = { material_id: actualMatId };
            if (actualThickId) whereClause.thickness_id = actualThickId;
            
            const matInv = await tx.inventory.findFirst({ where: whereClause });
            const currentStock = matInv ? parseFloat(matInv.quantity) : 0;
            if (currentStock < reqQty) {
              isEnough = false;
              break;
            }
          }
          if (isEnough) {
            await tx.orders.update({
              where: { id: request.order_id },
              data: { production_status: "production_ready" },
            });
            await tx.order_tracking.create({
              data: {
                order_id: request.order_id,
                stage_name: "production_ready",
                stage_description:
                  "Đã nhập đủ vật tư bù, đơn hàng sẵn sàng đưa vào sản xuất.",
                tracked_at: new Date(),
              },
            });
          }
        }
      }

      return updatedReq;
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
            thickness_id: inventory.thickness_id || null,
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
  // Hàm lấy vật tư bị thiếu để sinh PDF
  async getMissingMaterialsForPDF(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Không tìm thấy đơn hàng!");
    
    const requiredMaterials = order.material_requirements || {};
    const missingMaterials = [];
    
    // Kiểm tra tồn kho
    for (const [matId, requiredQtyStr] of Object.entries(requiredMaterials)) {
      const requiredQty = parseFloat(requiredQtyStr);
      // Cần include thêm bảng materials và material_units để lấy tên và đơn vị tính
      const [actualMatId, actualThickId] = matId.split('_');
      let inv = await prisma.inventory.findFirst({
        where: { material_id: actualMatId, thickness_id: actualThickId || null },
        include: {
          materials: {
            include: {
              material_units: true
            }
          }
        }
      });
      if (!inv && actualThickId) {
        inv = await prisma.inventory.findFirst({
          where: { material_id: actualMatId, thickness_id: null },
          include: {
            materials: {
              include: {
                material_units: true
              }
            }
          }
        });
      }
      
      const currentStock = inv ? parseFloat(inv.quantity) : 0;
      
      if (currentStock < requiredQty) {
        missingMaterials.push({
          material_code: inv?.materials?.material_code || matId,
          material_name: inv?.materials?.material_name || "Vật tư chưa rõ",
          unit_name: inv?.materials?.material_units?.unit_name || "",
          quantity: requiredQty - currentStock, // Số lượng cần xuất (tức là số lượng bị thiếu)
        });
      }
    }
    return missingMaterials;
  }
  // Hàm lấy thông tin tồn kho cho báo cáo PDF tuỳ chọn
  async getInventoryForPDF(materialIds) {
    let whereClause = {};
    if (materialIds && Array.isArray(materialIds) && materialIds.length > 0) {
      whereClause = { material_id: { in: materialIds } };
    }

    const inventories = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        materials: {
          include: {
            material_units: true
          }
        }
      },
      orderBy: { quantity: 'asc' } // Sắp xếp cái nào ít lên đầu
    });

    return inventories.map(inv => ({
      material_code: inv.materials.material_code,
      material_name: inv.materials.material_name,
      unit_name: inv.materials.material_units?.unit_name || "",
      quantity: parseFloat(inv.quantity),
      leftover_amount: parseFloat(inv.leftover_amount || 0),
      min_stock_level: parseFloat(inv.min_stock_level || 0),
      note: inv.note || ""
    }));
  }
}

module.exports = new WarehouseService();
