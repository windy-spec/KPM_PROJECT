const paintTypeService = require("../services/paint_type.service");

class PaintTypeController {
  async getAll(req, res) {
    try {
      const result = await paintTypeService.getAll();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async create(req, res) {
    try {
      const result = await paintTypeService.create(req.body);
      res
        .status(201)
        .json({
          success: true,
          message: "Thêm loại sơn thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async update(req, res) {
    try {
      const result = await paintTypeService.update(req.params.id, req.body);
      res
        .status(200)
        .json({
          success: true,
          message: "Cập nhật loại sơn thành công!",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async delete(req, res) {
    try {
      await paintTypeService.delete(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa loại sơn thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
module.exports = new PaintTypeController();
