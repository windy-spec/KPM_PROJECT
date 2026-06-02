const materialService = require("../services/material.service");

class MaterialController {
  async getAll(req, res) {
    try {
      const result = await materialService.getAllMaterials();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const result = await materialService.getMaterialById(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = await materialService.createMaterial(req.body);
      res.status(201).json({
        success: true,
        message: "Thêm vật tư thành công!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await materialService.updateMaterial(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        success: true,
        message: "Cập nhật vật tư thành công!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await materialService.deleteMaterial(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa vật tư thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MaterialController();
