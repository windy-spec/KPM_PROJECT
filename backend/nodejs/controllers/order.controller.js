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
  // THÊM MỚI: Nhận request từ trang Checkout
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
}

module.exports = new OrderController();
