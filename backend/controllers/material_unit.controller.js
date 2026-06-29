const materialUnitService = require("../services/material_unit.service");

class MaterialUnitController {
  async getAll(req, res) {
    try {
      const result = await materialUnitService.getAllUnits();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = await materialUnitService.createUnit(req.body);
      res
        .status(201)
        .json({
          success: true,
          message: "Thêm đơn vị tính thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await materialUnitService.updateUnit(
        req.params.id,
        req.body,
      );
      res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật đơn vị tính thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await materialUnitService.deleteUnit(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa đơn vị tính thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
module.exports = new MaterialUnitController();
