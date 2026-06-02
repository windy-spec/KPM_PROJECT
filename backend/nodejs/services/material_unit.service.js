const prisma = require("../models/prisma");

class MaterialUnitService {
  async getAllUnits() {
    return await prisma.material_units.findMany();
  }

  async createUnit(data) {
    const { unit_name } = data;
    if (!unit_name) throw new Error("Đơn vị tính không được để trống!");

    return await prisma.material_units.create({
      data: { unit_name },
    });
  }

  async updateUnit(id, data) {
    const { unit_name } = data;
    if (unit_name !== undefined && !unit_name)
      throw new Error("Đơn vị tính không được để trống!");

    return await prisma.material_units.update({
      where: { id },
      data: { unit_name },
    });
  }

  async deleteUnit(id) {
    try {
      return await prisma.material_units.delete({
        where: { id },
      });
    } catch (error) {
      // Dùng .includes('RESTRICT') để bắt trúng lỗi khóa ngoại của PostgreSQL
      if (
        error.code === "P2003" ||
        (error.message && error.message.includes("RESTRICT"))
      ) {
        throw new Error(
          "Không thể xóa Đơn vị tính này vì đang có Vật tư sử dụng nó!",
        );
      }
      throw error;
    }
  }
}
module.exports = new MaterialUnitService();
