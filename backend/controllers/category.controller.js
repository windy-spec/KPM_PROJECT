const categoryService = require("../services/category.service");

class CategoryController {
  // 1. TẠO MỚI (POST)
  async create(req, res) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: "Tạo danh mục thành công",
        data: category,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 2. LẤY DANH SÁCH (GET)
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. CẬP NHẬT (PUT)
  async update(req, res) {
    try {
      const { id } = req.params; // Lấy ID từ trên URL (Ví dụ: /api/categories/:id)
      const category = await categoryService.updateCategory(id, req.body);
      res.status(200).json({
        success: true,
        message: "Cập nhật danh mục thành công",
        data: category,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 4. XÓA (DELETE)
  async delete(req, res) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);
      res
        .status(200)
        .json({ success: true, message: "Xóa danh mục thành công" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  //
  async createCateUnique(req, res) {
    try {
      const cate = await categoryService.createCategoryUnique(req.body);
      res.status(200).json({ success: true, data: cate });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async createCateCus(req, res) {
    try {
      const getData = req.body;
      const createCate = await categoryService.createCus(getData);
      res.status(200).json({ success: true, data: createCate });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CategoryController();
