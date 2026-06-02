const prisma = require("../models/prisma");

class PaintTypeService {
  async getAll() {
    return await prisma.paint_types.findMany();
  }

  async create(data) {
    const { paint_name, price_per_sqm, description } = data;

    if (!paint_name) throw new Error("Tên loại sơn không được để trống!");

    const price = parseFloat(price_per_sqm);
    if (isNaN(price) || price < 0) {
      throw new Error("Đơn giá sơn không được là số âm!");
    }

    return await prisma.paint_types.create({
      data: { paint_name, price_per_sqm: price, description },
    });
  }

  async update(id, data) {
    if (data.price_per_sqm !== undefined) {
      const price = parseFloat(data.price_per_sqm);
      if (isNaN(price) || price < 0) {
        throw new Error("Đơn giá sơn không được là số âm!");
      }
      data.price_per_sqm = price;
    }

    return await prisma.paint_types.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    try {
      return await prisma.paint_types.delete({ where: { id } });
    } catch (error) {
      if (
        error.code === "P2003" ||
        (error.message && error.message.includes("RESTRICT"))
      ) {
        throw new Error(
          "Không thể xóa Loại sơn này vì đã có Báo giá sử dụng nó!",
        );
      }
      throw error;
    }
  }
}
module.exports = new PaintTypeService();
