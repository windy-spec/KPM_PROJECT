const prisma = require("../models/prisma");

class MaterialThicknessService {
  async getAll() {
    return await prisma.material_thickness.findMany({
      include: {
        materials: {
          select: { material_name: true, material_code: true },
        },
      },
      orderBy: { thickness_value: "asc" },
    });
  }

  async create(data) {
    const { material_id, thickness_value, price_multiplier } = data;

    if (!material_id || !thickness_value)
      throw new Error("Vật tư và Tên độ dày không được để trống!");

    const multiplier = parseFloat(price_multiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      throw new Error("Hệ số nhân (Multiplier) bắt buộc phải lớn hơn 0!");
    }

    // Kiểm tra xem Vật tư này đã có độ dày này chưa (tránh trùng lặp)
    const existing = await prisma.material_thickness.findUnique({
      where: {
        material_id_thickness_value: {
          material_id,
          thickness_value,
        },
      },
    });
    if (existing)
      throw new Error(
        `Vật tư này đã được cấu hình độ dày '${thickness_value}'!`,
      );

    return await prisma.material_thickness.create({
      data: {
        material_id,
        thickness_value,
        price_multiplier: multiplier,
      },
    });
  }

  async update(id, data) {
    const { price_multiplier, thickness_value } = data;

    if (price_multiplier !== undefined) {
      const multiplier = parseFloat(price_multiplier);
      if (isNaN(multiplier) || multiplier <= 0) {
        throw new Error("Hệ số nhân (Multiplier) bắt buộc phải lớn hơn 0!");
      }
      data.price_multiplier = multiplier;
    }

    return await prisma.material_thickness.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    try {
      return await prisma.material_thickness.delete({ where: { id } });
    } catch (error) {
      if (
        error.code === "P2003" ||
        (error.message && error.message.includes("RESTRICT"))
      ) {
        throw new Error(
          "Không thể xóa cấu hình này vì đang được sử dụng trong Báo giá!",
        );
      }
      throw error;
    }
  }
}
module.exports = new MaterialThicknessService();
