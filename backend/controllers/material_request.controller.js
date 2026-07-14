const requestService = require("../services/material_request.service");

class MaterialRequestController {
  async createRequest(req, res) {
    try {
      const result = await requestService.createRequest(req.body);

      // Bắn Socket cho Admin biết có yêu cầu mới
      if (global.io) {
        global.io.to("room_admin").emit("new_import_request", result);
      }

      res
        .status(201)
        .json({
          success: true,
          message: "Đã gửi yêu cầu nhập vật tư cho Admin",
          data: result,
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getAllRequests(req, res) {
    try {
      const data = await requestService.getAllRequests();
      res.status(200).json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async approveRequest(req, res) {
    try {
      const result = await requestService.approveRequest(req.params.id);

      // Bắn Socket cho Kho biết Admin đã duyệt mua
      if (global.io) {
        global.io.to("room_warehouse").emit("import_request_approved", result);
      }

      res
        .status(200)
        .json({
          success: true,
          message: "Đã đánh dấu là Đã Mua",
          data: result,
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async receiveImport(req, res) {
    try {
      const { actualQuantity } = req.body;
      const result = await requestService.receiveImport(req.params.id, parseFloat(actualQuantity));

      // Bắn Socket báo đã nhận hàng
      if (global.io) {
        global.io.to("room_admin").emit("import_request_received", result);
        global.io.to("room_warehouse").emit("import_request_received", result);
      }

      res
        .status(200)
        .json({
          success: true,
          message: "Đã nhập kho thành công và kiểm tra đơn hàng",
          data: result,
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}
module.exports = new MaterialRequestController();
