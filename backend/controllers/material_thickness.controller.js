const thicknessService = require("../services/material_thickness.service");

class MaterialThicknessController {
  async getAll(req, res) {
    try {
      const result = await thicknessService.getAll();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async create(req, res) {
    try {
      const result = await thicknessService.create(req.body);
      res
        .status(201)
        .json({
          success: true,
          message: "Cấu hình độ dày thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async update(req, res) {
    try {
      const result = await thicknessService.update(req.params.id, req.body);
      res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật hệ số thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async delete(req, res) {
    try {
      await thicknessService.delete(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa cấu hình độ dày thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
module.exports = new MaterialThicknessController();
