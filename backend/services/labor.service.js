const prisma = require("../models/prisma");

class LaborService {
  // ==========================================
  // 1. QUẢN LÝ LOẠI THỢ (Labor Categories)
  // ==========================================
  async getCategories() {
    return await prisma.labor_categories.findMany();
  }
  async createCategory(data) {
    if (!data.category_name)
      throw new Error("Tên loại thợ không được để trống!");
    return await prisma.labor_categories.create({ data });
  }
  async updateCategory(id, data) {
    return await prisma.labor_categories.update({ where: { id }, data });
  }
  async deleteCategory(id) {
    try {
      return await prisma.labor_categories.delete({ where: { id } });
    } catch (error) {
      if (error.code === "P2003")
        throw new Error(
          "Không thể xóa Loại thợ này vì đang có Đơn giá sử dụng!",
        );
      throw error;
    }
  }

  // ==========================================
  // 2. QUẢN LÝ MÔ HÌNH TÍNH GIÁ (Pricing Models)
  // ==========================================
  async getModels() {
    return await prisma.labor_pricing_models.findMany();
  }
  async createModel(data) {
    if (!data.model_name)
      throw new Error("Tên mô hình tính giá không được để trống!");
    return await prisma.labor_pricing_models.create({ data });
  }
  async updateModel(id, data) {
    return await prisma.labor_pricing_models.update({ where: { id }, data });
  }
  async deleteModel(id) {
    try {
      return await prisma.labor_pricing_models.delete({ where: { id } });
    } catch (error) {
      if (error.code === "P2003")
        throw new Error(
          "Không thể xóa Mô hình này vì đang có Đơn giá sử dụng!",
        );
      throw error;
    }
  }

  // ==========================================
  // 3. QUẢN LÝ ĐƠN GIÁ NHÂN CÔNG (Labor Rates)
  // ==========================================
  async getRates() {
    return await prisma.labor_rates.findMany({
      include: {
        labor_categories: true,
        labor_pricing_models: true,
      },
      orderBy: { updated_at: "desc" },
    });
  }

  // Dùng lệnh Upsert thần thánh: Có rồi thì Update, chưa có thì Create Mới
  async setRate(data) {
    const { category_id, model_id, rate_amount } = data;

    if (!category_id || !model_id)
      throw new Error("Bắt buộc phải chọn Loại thợ và Mô hình tính giá!");

    const amount = parseFloat(rate_amount);
    if (isNaN(amount) || amount < 0)
      throw new Error("Đơn giá nhân công không được là số âm!");

    return await prisma.labor_rates.upsert({
      where: {
        category_id_model_id: {
          // Dựa vào constraint @@unique trong Prisma
          category_id,
          model_id,
        },
      },
      update: {
        rate_amount: amount,
        updated_at: new Date(),
      },
      create: {
        category_id,
        model_id,
        rate_amount: amount,
      },
    });
  }

  async deleteRate(id) {
    return await prisma.labor_rates.delete({ where: { id } });
  }
}
module.exports = new LaborService();
