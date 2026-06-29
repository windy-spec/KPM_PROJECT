const prisma = require("../models/prisma");

class MaterialService {
  // 1. Lấy danh sách Vật tư (Kèm thông tin Loại và ĐVT)
  async getAllMaterials() {
    return await prisma.materials.findMany({
      include: {
        material_types: { select: { type_name: true } },
        material_units: { select: { unit_name: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // 2. Lấy chi tiết 1 Vật tư theo ID
  async getMaterialById(id) {
    const material = await prisma.materials.findUnique({
      where: { id },
      include: {
        material_types: true,
        material_units: true,
      },
    });
    if (!material) throw new Error("Không tìm thấy vật tư này!");
    return material;
  }

  // 3. Thêm mới Vật tư
  async createMaterial(data) {
    const { type_id, unit_id, material_code, material_name, base_price } = data;

    // Validate dữ liệu trống và số âm
    if (!material_code || !material_name)
      throw new Error("Mã và Tên vật tư không được để trống!");
    if (base_price === undefined || parseFloat(base_price) < 0)
      throw new Error("Giá gốc không được là số âm!");

    // Validate mã trùng lặp
    const existingCode = await prisma.materials.findUnique({
      where: { material_code },
    });
    if (existingCode)
      throw new Error("Mã vật tư này đã tồn tại trên hệ thống!");

    // Validate Khóa ngoại (Danh mục & ĐVT)
    const [typeExists, unitExists] = await Promise.all([
      prisma.material_types.findUnique({ where: { id: type_id } }),
      prisma.material_units.findUnique({ where: { id: unit_id } }),
    ]);
    if (!typeExists) throw new Error("Loại vật tư (type_id) không tồn tại!");
    if (!unitExists) throw new Error("Đơn vị tính (unit_id) không tồn tại!");

    return await prisma.materials.create({
      data: {
        type_id,
        unit_id,
        material_code,
        material_name,
        base_price: parseFloat(base_price),
      },
    });
  }

  // 4. Cập nhật Vật tư
  async updateMaterial(id, data) {
    const { material_code, base_price } = data;

    // Kiểm tra vật tư có tồn tại không
    await this.getMaterialById(id);

    // Validate số âm nếu có gửi lên
    if (base_price !== undefined && parseFloat(base_price) < 0) {
      throw new Error("Giá gốc không được là số âm!");
    }

    // Validate mã trùng lặp (nếu có đổi mã)
    if (material_code) {
      const existing = await prisma.materials.findFirst({
        where: { material_code, NOT: { id } },
      });
      if (existing) throw new Error("Mã vật tư này bị trùng với vật tư khác!");
    }

    return await prisma.materials.update({
      where: { id },
      data: {
        ...data,
        base_price:
          base_price !== undefined ? parseFloat(base_price) : undefined,
      },
    });
  }

  // 5. Xóa Vật tư
  async deleteMaterial(id) {
    await this.getMaterialById(id);

    // Prisma sẽ tự động văng lỗi nếu có dữ liệu khóa ngoại (ví dụ đã nằm trong báo giá)
    // vì ta dùng onDelete: Restrict trong schema.
    try {
      return await prisma.materials.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error(
          "Không thể xóa vật tư này vì nó đang được sử dụng trong Báo giá hoặc Dữ liệu khác!",
        );
      }
      throw error;
    }
  }
}

module.exports = new MaterialService();
