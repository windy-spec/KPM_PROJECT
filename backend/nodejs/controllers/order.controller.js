const orderService = require("../services/order.service");

class OrderController {
  async getAllOrders(req, res) {
    try {
      const orders = await orderService.getAllOrders();
      res.status(200).json({ success: true, data: orders });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }
      res.status(200).json({ success: true, data: order });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getMyOrders(req, res) {
    try {
      const orders = await orderService.getMyOrders(req.user.id);
      res.status(200).json({ success: true, data: orders });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async createDirect(req, res) {
    try {
      const order = await orderService.createDirectOrder(req.user.id, req.body);
      res.status(200).json({ success: true, data: { order_id: order.id } });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async updateCheckoutInfo(req, res) {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
      const payload = req.body;

      const order = await orderService.updateCheckoutInfo(
        orderId,
        userId,
        payload,
      );
      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin đơn hàng thành công",
        data: order,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async updateStatus(req, res) {
    try {
      const orderId = req.params.id;
      const payload = req.body; // chứa status, stage_name, stage_description

      const result = await orderService.updateOrderStatus(orderId, payload);
      
      if (global.io && result) {
        const userIdToNotify = result.user_id || (result.quotations && result.quotations.user_id);
        if (userIdToNotify) {
          global.io.to(`room_user_${userIdToNotify}`).emit("orderStatusUpdated", {
            orderId: orderId,
            status: result.production_status,
            stage_name: payload.stage_name,
            stage_description: payload.stage_description
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật tiến độ đơn hàng thành công!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getTracking(req, res) {
    try {
      const trackingHistory = await orderService.getOrderTracking(
        req.params.id,
      );
      res.status(200).json({
        success: true,
        data: trackingHistory,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async approveOrder(req, res) {
    try {
      const orderId = req.params.id;
      const requirements = await orderService.approveOrderAndRequestMaterials(orderId);
      
      res.status(200).json({
        success: true,
        message: "Đã duyệt đơn và tạo yêu cầu vật tư xuống Kho.",
        data: requirements
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new OrderController();
