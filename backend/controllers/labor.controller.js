const laborService = require("../services/labor.service");

class LaborController {
  // --- Phục vụ Categories ---
  async getCategories(req, res) {
    try {
      res
        .status(200)
        .json({ success: true, data: await laborService.getCategories() });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async createCategory(req, res) {
    try {
      res
        .status(201)
        .json({
          success: true,
          data: await laborService.createCategory(req.body),
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async deleteCategory(req, res) {
    try {
      await laborService.deleteCategory(req.params.id);
      res.status(200).json({ success: true, message: "Xóa thành công!" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // --- Phục vụ Models ---
  async getModels(req, res) {
    try {
      res
        .status(200)
        .json({ success: true, data: await laborService.getModels() });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async createModel(req, res) {
    try {
      res
        .status(201)
        .json({
          success: true,
          data: await laborService.createModel(req.body),
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async deleteModel(req, res) {
    try {
      await laborService.deleteModel(req.params.id);
      res.status(200).json({ success: true, message: "Xóa thành công!" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // --- Phục vụ Rates (Đơn giá) ---
  async getRates(req, res) {
    try {
      res
        .status(200)
        .json({ success: true, data: await laborService.getRates() });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async setRate(req, res) {
    try {
      res
        .status(200)
        .json({
          success: true,
          message: "Thiết lập đơn giá thành công!",
          data: await laborService.setRate(req.body),
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async deleteRate(req, res) {
    try {
      await laborService.deleteRate(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa đơn giá thành công!" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}
module.exports = new LaborController();
