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
}

module.exports = new OrderController();
