const materialService = require("../services/material.service");

class MaterialController {
  async getMaterials(req, res) {
    try {
      const materials = await materialService.getAllMaterials();
      return res.status(200).json({
        success: true,
        count: materials.length,
        data: materials,
      });
    } catch (error) {
      console.error("Lỗi Controller getMaterials:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy dữ liệu vật tư",
      });
    }
  }
}

module.exports = new MaterialController();
