const componentTemplateService = require("../services/component_template.service");

exports.getAll = async (req, res) => {
  try {
    const data = await componentTemplateService.getAll();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Lỗi get all templates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await componentTemplateService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await componentTemplateService.create(req.body);
    res.status(201).json({ success: true, message: "Tạo linh kiện thành công", data });
  } catch (error) {
    console.error("Lỗi create template:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await componentTemplateService.update(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật thành công", data });
  } catch (error) {
    console.error("Lỗi update template:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await componentTemplateService.delete(req.params.id);
    res.json({ success: true, message: "Xóa thành công" });
  } catch (error) {
    console.error("Lỗi delete template:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
