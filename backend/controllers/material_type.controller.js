const materialTypeService = require("../services/material_type.service");

class MaterialTypeController {
  async getAll(req, res) {
    try {
      const result = await materialTypeService.getAllTypes();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = await materialTypeService.createType(req.body);
      res
        .status(201)
        .json({
          success: true,
          message: "Thêm loại vật tư thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await materialTypeService.updateType(
        req.params.id,
        req.body,
      );
      res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật loại vật tư thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await materialTypeService.deleteType(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa loại vật tư thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
module.exports = new MaterialTypeController();
