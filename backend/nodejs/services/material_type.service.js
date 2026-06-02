const prisma = require("../models/prisma");

class MaterialTypeService {
  async getAllTypes() {
    return await prisma.material_types.findMany();
  }

  async createType(data) {
    const { type_name, description } = data;
    if (!type_name) throw new Error("Tên loại vật tư không được để trống!");

    return await prisma.material_types.create({
      data: { type_name, description },
    });
  }

  async updateType(id, data) {
    const { type_name, description } = data;
    if (type_name !== undefined && !type_name)
      throw new Error("Tên loại vật tư không được để trống!");

    return await prisma.material_types.update({
      where: { id },
      data: { type_name, description },
    });
  }

  async deleteType(id) {
    try {
      return await prisma.material_types.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2003") {
        throw new Error(
          "Không thể xóa Loại vật tư này vì đang có Vật tư sử dụng nó!",
        );
      }
      throw error;
    }
  }
}
module.exports = new MaterialTypeService();
