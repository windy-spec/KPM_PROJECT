const prisma = require("../models/prisma");

class MaterialService {
  // 1. Lấy danh sách Vật tư (Kèm thông tin Loại và ĐVT)
  async getAllMaterials() {
    return await prisma.materials.findMany({
      include: {
        material_types: { select: { type_name: true } },
        material_units: { select: { unit_name: true } },
        material_thickness: true,
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
        material_thickness: true,
      },
    });
    if (!material) throw new Error("Không tìm thấy vật tư này!");
    return material;
  }

  // 3. Thêm mới Vật tư
  async createMaterial(data) {
    const { type_id, unit_id, material_code, material_name, base_price, thicknesses } = data;

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

    const createData = {
      type_id,
      unit_id,
      material_code,
      material_name,
      base_price: parseFloat(base_price),
    };

    if (Array.isArray(thicknesses) && thicknesses.length > 0) {
      createData.material_thickness = {
        create: thicknesses.map(t => ({
          thickness_value: t.thickness_value,
          price_multiplier: t.price_multiplier !== undefined ? parseFloat(t.price_multiplier) : 1.00
        }))
      };
    }

    return await prisma.materials.create({
      data: createData,
      include: { material_thickness: true }
    });
  }

  // 4. Cập nhật Vật tư
  async updateMaterial(id, data) {
    const { material_code, base_price, thicknesses, type_id, unit_id, material_name } = data;

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

    const updateData = {};
    if (material_code !== undefined) updateData.material_code = material_code;
    if (material_name !== undefined) updateData.material_name = material_name;
    if (type_id !== undefined) updateData.type_id = type_id;
    if (unit_id !== undefined) updateData.unit_id = unit_id;
    if (base_price !== undefined) updateData.base_price = parseFloat(base_price);

    if (Array.isArray(thicknesses)) {
      const keepIds = thicknesses.filter(t => t.id).map(t => t.id);
      
      updateData.material_thickness = {
        deleteMany: { id: { notIn: keepIds } },
        create: thicknesses.filter(t => !t.id).map(t => ({
          thickness_value: t.thickness_value,
          price_multiplier: t.price_multiplier !== undefined ? parseFloat(t.price_multiplier) : 1.00
        })),
        update: thicknesses.filter(t => t.id).map(t => ({
          where: { id: t.id },
          data: {
            thickness_value: t.thickness_value,
            price_multiplier: t.price_multiplier !== undefined ? parseFloat(t.price_multiplier) : 1.00
          }
        }))
      };
    }

    try {
      return await prisma.materials.update({
        where: { id },
        data: updateData,
        include: { material_thickness: true }
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error("Không thể cập nhật/xóa độ dày vì nó đang được sử dụng trong hệ thống.");
      }
      throw error;
    }
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
